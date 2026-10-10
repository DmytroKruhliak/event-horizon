package com.eventhorizon.backend.telegram;

import java.nio.file.Path;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param enabled        false skips the Telegram connection entirely (tests, offline work)
 * @param apiId          from https://my.telegram.org/apps
 * @param apiHash        from https://my.telegram.org/apps
 * @param phone          optional; when blank the phone number is asked for on the console at first login
 * @param chatId         TDLib chat id (supergroups are -100 + channel id)
 * @param senderId       only messages from this user are read ("Suspicious Merchant")
 * @param sessionDir     TDLib database; holds the logged-in session, never commit or share it
 * @param backfill       how much history to load on startup; also the furthest a catch-up looks back
 * @param resyncInterval how often to re-check Telegram for messages missed by live updates
 * @param timeCorrection added to Telegram's (UTC) message timestamps; normally zero
 */
@ConfigurationProperties("telegram")
public record TelegramProperties(
        boolean enabled,
        Integer apiId,
        String apiHash,
        String phone,
        long chatId,
        long senderId,
        Path sessionDir,
        Duration backfill,
        Duration resyncInterval,
        Duration timeCorrection) {
}
