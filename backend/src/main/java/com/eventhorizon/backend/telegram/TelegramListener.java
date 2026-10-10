package com.eventhorizon.backend.telegram;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.eventhorizon.backend.feed.FortFeed;

import it.tdlight.Init;
import it.tdlight.Log;
import it.tdlight.client.APIToken;
import it.tdlight.client.AuthenticationData;
import it.tdlight.client.AuthenticationSupplier;
import it.tdlight.client.SimpleTelegramClient;
import it.tdlight.client.SimpleTelegramClientBuilder;
import it.tdlight.client.SimpleTelegramClientFactory;
import it.tdlight.client.TDLibSettings;
import it.tdlight.jni.TdApi;

/**
 * Logs in to Telegram as a regular user (MTProto via TDLib, not the Bot API) and feeds every
 * message from the configured sender to {@link FortFeed}, from three sources:
 * <ul>
 *   <li>history - on startup, the last {@code telegram.backfill} of messages</li>
 *   <li>live - new messages pushed by Telegram as they arrive</li>
 *   <li>catch-up - every {@code telegram.resync-interval} and after each reconnect, the messages
 *       since the newest one seen. Telegram does not replay group messages missed while the
 *       connection was down (e.g. the PC slept), so this is what fills such gaps.</li>
 * </ul>
 * History and catch-up ask Telegram's server directly (messages.search filtered by sender),
 * never TDLib's local cache, which is stale after downtime. Overlaps are fine: FortFeed skips
 * messages it has already seen.
 *
 * First run is interactive: phone number (unless telegram.phone is set), login code and 2FA
 * password are asked on the console. The session is then kept in {@code telegram.session-dir}
 * and later starts are silent.
 */
@Service
@ConditionalOnProperty(prefix = "telegram", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TelegramListener {

    private static final Logger log = LoggerFactory.getLogger(TelegramListener.class);

    private static final int SEARCH_PAGE_SIZE = 100;
    private static final int MAX_SEARCH_PAGES = 200;
    /** Catch-up looks back this far before the newest seen message, in case of out-of-order delivery. */
    private static final Duration CATCH_UP_OVERLAP = Duration.ofMinutes(15);
    private static final long REQUEST_TIMEOUT_SECONDS = 120;
    /** TDLib message ids are the server message id shifted left by 20 bits. */
    private static final int SERVER_ID_SHIFT = 20;
    private static final int TDLIB_LOG_ERRORS_ONLY = 1;

    private final TelegramProperties props;
    private final FortFeed feed;
    private final Clock clock;
    private final AtomicBoolean historyStarted = new AtomicBoolean();
    private final AtomicBoolean historyDone = new AtomicBoolean();
    private final AtomicReference<Instant> newestSeen = new AtomicReference<>();
    /** One thread for all searches, so history and catch-ups never overlap. */
    private final ScheduledExecutorService worker =
            Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "telegram-sync"));
    private volatile String connectionState = "";

    private SimpleTelegramClientFactory factory;
    private SimpleTelegramClient client;
    private CompletableFuture<AuthenticationData> phoneAuth;

    public TelegramListener(TelegramProperties props, FortFeed feed, Clock clock) {
        this.props = props;
        this.feed = feed;
        this.clock = clock;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() throws Exception {
        if (props.apiId() == null || props.apiHash() == null || props.apiHash().isBlank()) {
            throw new IllegalStateException("telegram.api-id / telegram.api-hash are not set. "
                    + "Set TELEGRAM_API_ID and TELEGRAM_API_HASH, or put them in application-local.yml.");
        }
        Init.init();
        // TDLib's default verbosity logs every poll cycle and buries the login prompts; keep errors only.
        Log.setVerbosityLevel(TDLIB_LOG_ERRORS_ONLY);
        factory = new SimpleTelegramClientFactory();

        TDLibSettings settings = TDLibSettings.create(new APIToken(props.apiId(), props.apiHash()));
        settings.setDatabaseDirectoryPath(props.sessionDir().resolve("data"));
        settings.setDownloadedFilesDirectoryPath(props.sessionDir().resolve("downloads"));
        settings.setDeviceModel("Event Horizon listener");

        SimpleTelegramClientBuilder builder = factory.builder(settings);
        builder.addUpdateHandler(TdApi.UpdateAuthorizationState.class, this::onAuthorizationState);
        builder.addUpdateHandler(TdApi.UpdateNewMessage.class, update -> onMessage(update.message));
        builder.addUpdateHandler(TdApi.UpdateConnectionState.class, this::onConnectionState);

        // Called by TDLight only when Telegram asks for a phone number, i.e. never once a session exists.
        AuthenticationSupplier<AuthenticationData> auth = this::phoneAuthentication;
        client = builder.build(auth);
        log.info("Telegram client started (session in {})", props.sessionDir().toAbsolutePath());
    }

    /**
     * TDLight may ask for the authentication data more than once; memoized so the console is only
     * prompted once (a second pending prompt would swallow the login code typed next).
     */
    private synchronized CompletableFuture<AuthenticationData> phoneAuthentication() {
        if (phoneAuth == null) {
            phoneAuth = CompletableFuture.supplyAsync(() -> AuthenticationSupplier.user(phoneNumber()));
        }
        return phoneAuth;
    }

    /** telegram.phone if set, otherwise asked once on the console. */
    private String phoneNumber() {
        if (props.phone() != null && !props.phone().isBlank()) {
            return props.phone();
        }
        Scanner console = new Scanner(System.in);
        String phone = "";
        while (phone.isBlank()) {
            System.out.print("[login] Telegram phone number, international format (e.g. +380XXXXXXXXX): ");
            System.out.flush();
            phone = console.nextLine().strip();
        }
        return phone;
    }

    private void onAuthorizationState(TdApi.UpdateAuthorizationState update) {
        TdApi.AuthorizationState state = update.authorizationState;
        log.info("Telegram authorization state: {}", state.getClass().getSimpleName());
        if (state instanceof TdApi.AuthorizationStateReady && historyStarted.compareAndSet(false, true)) {
            // Never block TDLib's update thread with synchronous requests.
            worker.submit(this::loadHistory);
            long interval = props.resyncInterval().toSeconds();
            worker.scheduleWithFixedDelay(() -> catchUp("scheduled"), interval, interval, TimeUnit.SECONDS);
        }
    }

    private void onConnectionState(TdApi.UpdateConnectionState update) {
        String state = update.state.getClass().getSimpleName().replace("ConnectionState", "");
        String previous = connectionState;
        connectionState = state;
        if (state.equals(previous)) {
            return;
        }
        if (update.state instanceof TdApi.ConnectionStateReady) {
            log.info("Telegram connection: {} (was {})", state, previous.isEmpty() ? "starting" : previous);
            if (historyDone.get()) {
                worker.submit(() -> catchUp("reconnect"));
            }
        } else {
            log.warn("Telegram connection: {} - live messages may be missed until it is Ready again", state);
        }
    }

    private void onMessage(TdApi.Message message) {
        String text = textOf(message);
        if (text != null) {
            ingest(message, text, "live");
        }
    }

    private void loadHistory() {
        try {
            openChat();
            Instant since = clock.instant().minus(props.backfill());
            SyncResult result = sync(since, "history");
            log.info("History loaded: {} messages from the sender since {} ({} new, {} search pages)",
                    result.found(), since, result.added(), result.pages());
        } catch (Exception e) {
            log.error("Loading history failed; live updates and catch-ups continue", e);
        } finally {
            historyDone.set(true);
        }
    }

    private void catchUp(String reason) {
        if (!historyDone.get()) {
            return;
        }
        try {
            Instant floor = clock.instant().minus(props.backfill());
            Instant newest = newestSeen.get();
            Instant since = newest == null ? floor : max(floor, newest.minus(CATCH_UP_OVERLAP));
            SyncResult result = sync(since, "catch-up");
            if (result.added() > 0) {
                log.warn("Catch-up ({}) recovered {} missed message(s) since {}", reason, result.added(), since);
            } else {
                log.debug("Catch-up ({}): nothing missed since {}", reason, since);
            }
        } catch (Exception e) {
            log.warn("Catch-up ({}) failed: {}", reason, e.toString());
        }
    }

    private record SyncResult(int found, int added, int pages) {
    }

    /**
     * Fetches the sender's messages newer than {@code since} straight from Telegram's server
     * (newest first, paged) and ingests them oldest first.
     */
    private SyncResult sync(Instant since, String source) throws Exception {
        TdApi.MessageSender sender = new TdApi.MessageSenderUser(props.senderId());
        List<TdApi.Message> collected = new ArrayList<>();
        long fromMessageId = 0;
        int pages = 0;
        boolean reachedSince = false;
        while (!reachedSince && pages++ < MAX_SEARCH_PAGES) {
            TdApi.FoundChatMessages page = request(new TdApi.SearchChatMessages(
                    props.chatId(), null, "", sender, fromMessageId, 0, SEARCH_PAGE_SIZE, null));
            if (page.messages == null || page.messages.length == 0) {
                break;
            }
            for (TdApi.Message m : page.messages) { // newest first
                if (Instant.ofEpochSecond(m.date).isBefore(since)) {
                    reachedSince = true;
                    break;
                }
                if (textOf(m) != null) {
                    collected.add(m);
                }
            }
            if (page.nextFromMessageId == 0) {
                break;
            }
            fromMessageId = page.nextFromMessageId;
        }
        Collections.reverse(collected);
        int added = 0;
        for (TdApi.Message m : collected) {
            if (ingest(m, textOf(m), source)) {
                added++;
            }
        }
        return new SyncResult(collected.size(), added, pages);
    }

    private boolean ingest(TdApi.Message m, String text, String source) {
        Instant time = timeOf(m);
        newestSeen.accumulateAndGet(time, (a, b) -> a == null ? b : max(a, b));
        return feed.ingest(serverId(m), text, time, source);
    }

    private static Instant max(Instant a, Instant b) {
        return a.isAfter(b) ? a : b;
    }

    /** Makes sure TDLib knows the chat, and subscribes to its updates. */
    private void openChat() throws Exception {
        try {
            request(new TdApi.GetChat(props.chatId()));
        } catch (ExecutionException notKnownYet) {
            // Like Telethon's get_dialogs(): the chat id only resolves once the chat list is loaded.
            client.loadChatListMainAsync().get(REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            TdApi.Chat chat = request(new TdApi.GetChat(props.chatId()));
            log.info("Resolved chat '{}'", chat.title);
        }
        request(new TdApi.OpenChat(props.chatId()));
    }

    /** The message text if it is a text message in our chat from our sender, otherwise null. */
    private String textOf(TdApi.Message m) {
        if (m.chatId != props.chatId()
                || !(m.senderId instanceof TdApi.MessageSenderUser sender)
                || sender.userId != props.senderId()
                || !(m.content instanceof TdApi.MessageText content)) {
            return null;
        }
        return content.text.text;
    }

    private Instant timeOf(TdApi.Message m) {
        return Instant.ofEpochSecond(m.date).plus(props.timeCorrection());
    }

    private static long serverId(TdApi.Message m) {
        return m.id >> SERVER_ID_SHIFT;
    }

    private <R extends TdApi.Object> R request(TdApi.Function<R> function)
            throws InterruptedException, ExecutionException, TimeoutException {
        return client.send(function).get(REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void stop() throws Exception {
        worker.shutdownNow();
        if (client != null) {
            client.closeAndWait();
        }
        if (factory != null) {
            factory.close();
        }
    }
}
