package com.eventhorizon.backend.fort;

import java.time.Instant;

/**
 * One fort-related fact extracted from a Telegram message. A message naming several forts
 * yields one FortMessage per fort.
 *
 * @param messageId     Telegram message id (server id, same as in chat exports)
 * @param owner         clan/character name for CAPTURED/DEFENDED, otherwise null
 * @param previousOwner for CAPTURED from another clan ("... захватил крепость X у Y!"), otherwise null
 */
public record FortMessage(long messageId, String fort, FortMessageType type, Instant time, String owner,
        String previousOwner, String text) {
}
