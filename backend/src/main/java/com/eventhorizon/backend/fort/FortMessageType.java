package com.eventhorizon.backend.fort;

public enum FortMessageType {
    /** "Осада крепости X начнется через 60 минут!" — siege starts one hour after the message. */
    SIEGE_ANNOUNCED,
    /** "Осада X началась!" */
    SIEGE_STARTED,
    /** "Owner захватил крепость X!" */
    CAPTURED,
    /** "Owner отстоял крепость X!" */
    DEFENDED,
    /** Mentions a fort but matches none of the known phrases. */
    OTHER;

    public boolean isSiege() {
        return this == SIEGE_ANNOUNCED || this == SIEGE_STARTED;
    }

    public boolean isCaptureOrDefend() {
        return this == CAPTURED || this == DEFENDED;
    }
}
