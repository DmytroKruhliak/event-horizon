package com.eventhorizon.backend.fort;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Current status and owner per fort.
 *
 * Unlike get_fortress_status.py, which rescans the export newest-to-oldest, this is updated
 * incrementally. Each field only moves forward in time, so messages may arrive in any order
 * (backfill and live updates overlap) and still produce the same result.
 */
@Service
public class FortStateService {

    private record FortState(FortMessageType lastType, Instant lastTime, String owner, Instant ownerTime) {
        static final FortState EMPTY = new FortState(null, null, null, null);
    }

    private final FortRules rules;
    private final Map<String, FortState> states = new ConcurrentHashMap<>();

    public FortStateService(FortRules rules) {
        this.rules = rules;
    }

    public void apply(FortMessage msg) {
        states.compute(msg.fort(), (fort, current) -> {
            FortState s = current == null ? FortState.EMPTY : current;
            FortMessageType lastType = s.lastType();
            Instant lastTime = s.lastTime();
            if (lastTime == null || !msg.time().isBefore(lastTime)) {
                lastType = msg.type();
                lastTime = msg.time();
            }
            String owner = s.owner();
            Instant ownerTime = s.ownerTime();
            if (msg.type().isCaptureOrDefend() && msg.owner() != null
                    && (ownerTime == null || !msg.time().isBefore(ownerTime))) {
                owner = msg.owner();
                ownerTime = msg.time();
            }
            return new FortState(lastType, lastTime, owner, ownerTime);
        });
    }

    /** Current owner (last clan that captured or defended it), or null if unknown. */
    public String owner(String fort) {
        FortState s = states.get(fort);
        return s == null ? null : s.owner();
    }

    /** All forts grouped by status, each group sorted by time (unknown times last). */
    public List<FortStatusView> snapshot(Instant now) {
        Comparator<FortStatusView> order = Comparator
                .comparing(FortStatusView::status)
                .thenComparing(FortStatusView::time, Comparator.nullsLast(Comparator.naturalOrder()));
        return Fortresses.NAMES.stream()
                .map(fort -> view(fort, states.getOrDefault(fort, FortState.EMPTY), now))
                .sorted(order)
                .toList();
    }

    private FortStatusView view(String fort, FortState s, Instant now) {
        if (s.lastType() == null) {
            return new FortStatusView(fort, FortStatus.UNKNOWN, null, s.owner());
        }
        return switch (s.lastType()) {
            case SIEGE_ANNOUNCED -> new FortStatusView(fort, FortStatus.IN_PROGRESS,
                    s.lastTime().plus(rules.siegeStartDelay()), s.owner());
            case SIEGE_STARTED -> new FortStatusView(fort, FortStatus.IN_PROGRESS, s.lastTime(), s.owner());
            case CAPTURED, DEFENDED -> {
                // Evaluated at read time so Pending turns into Ready without a new message.
                Instant readyAt = s.lastTime().plus(rules.readyAfter());
                FortStatus status = now.isAfter(readyAt) ? FortStatus.READY : FortStatus.PENDING;
                yield new FortStatusView(fort, status, readyAt, s.owner());
            }
            case OTHER -> new FortStatusView(fort, FortStatus.UNKNOWN, s.lastTime(), s.owner());
        };
    }
}
