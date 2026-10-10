package com.eventhorizon.backend.fort;

import com.fasterxml.jackson.annotation.JsonValue;

/** Declaration order is the display order. */
public enum FortStatus {
    IN_PROGRESS("Registered/In Progress"),
    PENDING("Pending"),
    READY("Ready"),
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
