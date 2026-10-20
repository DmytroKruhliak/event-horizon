package com.eventhorizon.backend.fort;

import com.fasterxml.jackson.annotation.JsonValue;

/** Declaration order is the display order (most urgent first). */
public enum FortStatus {
    /** A siege is happening right now. */
    SIEGE("Siege"),
    /** A siege was announced ("начнется через 60 минут") and hasn't started yet. */
    REGISTERED("Registered"),
    /** Cooldown is over; the fort can be sieged. */
    READY("Ready"),
    /** In the cooldown after a capture/defend. */
    PENDING("Pending"),
    /** No usable message about this fort. */
    UNKNOWN("Unknown");

    private final String label;

    FortStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String label() {
        return label;
    }
}
