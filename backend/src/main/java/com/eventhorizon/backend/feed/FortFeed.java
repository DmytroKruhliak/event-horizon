package com.eventhorizon.backend.feed;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.eventhorizon.backend.fort.FortMessage;
import com.eventhorizon.backend.fort.FortStateService;
import com.eventhorizon.backend.fort.MessageParser;
import com.eventhorizon.backend.timeline.TimelineService;

/**
 * Single entry point for raw messages: parse, update state and timeline, push changes live.
 *
 * The same message can arrive several times (live update, startup history, periodic catch-up);
 * only the first arrival is processed and logged.
 */
@Service
public class FortFeed {

    private static final Logger log = LoggerFactory.getLogger(FortFeed.class);

    private final MessageParser parser;
    private final FortStateService state;
    private final TimelineService timeline;
    private final EventStream stream;
    private final Set<Long> seenMessageIds = ConcurrentHashMap.newKeySet();

    public FortFeed(MessageParser parser, FortStateService state, TimelineService timeline, EventStream stream) {
        this.parser = parser;
        this.state = state;
        this.timeline = timeline;
        this.stream = stream;
    }

    /**
     * @param source where the message came from ("live", "history", "catch-up"), for the log
     * @return true if the message was new, false if it had already been ingested
     */
    public boolean ingest(long messageId, String text, Instant time, String source) {
        if (!seenMessageIds.add(messageId)) {
            log.debug("[{}] #{} already ingested, skipped", source, messageId);
            return false;
        }
        List<FortMessage> messages = parser.parse(messageId, text, time);
        if (messages.isEmpty()) {
            // Every known Suspicious Merchant format names a fort; this means the format changed.
            log.warn("[{}] #{} {} unrecognised message, ignored: \"{}\"", source, messageId, time, text);
            return true;
        }
        for (FortMessage msg : messages) {
            String ownerBefore = state.owner(msg.fort());
            state.apply(msg);
            timeline.apply(msg).forEach(stream::publish);

            log.info("[{}] #{} {} {} {}{}{} — \"{}\"", source, messageId, time, msg.type(), msg.fort(),
                    msg.owner() == null ? "" : " by " + msg.owner(),
                    msg.previousOwner() == null ? "" : " from " + msg.previousOwner(),
                    text);
            String ownerAfter = state.owner(msg.fort());
            if (!Objects.equals(ownerBefore, ownerAfter)) {
                log.info("Owner of {} changed: {} -> {}", msg.fort(),
                        ownerBefore == null ? "none" : ownerBefore, ownerAfter);
            }
        }
        return true;
    }
}
