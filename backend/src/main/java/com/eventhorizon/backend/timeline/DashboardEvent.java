package com.eventhorizon.backend.timeline;

import java.time.Instant;

/**
 * One event on the Event Horizon timeline (see event-horizon/README.md, "Event shape").
 *
 * @param duration      minutes
 * @param kind          "siege" or "cooldown"
 * @param previousOwner cooldown only: the clan the fort was captured from, if any
 */
public record DashboardEvent(
        long id,
        String name,
        Instant startTime,
        long duration,
        int priority,
        String description,
        String fort,
        String kind,
        String owner,
        String previousOwner) {
}
