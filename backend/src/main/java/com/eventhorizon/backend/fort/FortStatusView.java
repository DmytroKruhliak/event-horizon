package com.eventhorizon.backend.fort;

import java.time.Instant;

/**
 * @param time siege start for SIEGE/REGISTERED, ready time for READY/PENDING, last mention for UNKNOWN (null if never seen)
 */
public record FortStatusView(String fort, FortStatus status, Instant time, String owner) {
}
