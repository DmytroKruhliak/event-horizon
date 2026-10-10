package com.eventhorizon.backend.timeline;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.eventhorizon.backend.fort.FortMessage;
import com.eventhorizon.backend.fort.FortMessageType;
import com.eventhorizon.backend.fort.FortRules;

/**
 * Turns fort messages into timeline bars:
 * <ul>
 *   <li>siege bar — one per siege; the "starts in 60 min" announcement and the "started" message
 *       collapse into the same bar, which ends early at the capture/defend message if there is one</li>
 *   <li>cooldown bar — from a capture/defend until the fort is Ready again</li>
 * </ul>
 * Bars are rendered from the stored entries on demand, so out-of-order arrival is fine.
 */
@Service
public class TimelineService {

    /** How far apart an announcement's computed start and the "started" message may be to count as one siege. */
    private static final Duration SAME_SIEGE = Duration.ofMinutes(30);
    /** A capture/defend this long after a siege start is treated as that siege's result. */
    private static final Duration MAX_SIEGE_LENGTH = Duration.ofHours(3);
    /** Entries that ended before this are dropped (the widest dashboard view is 30 days). */
    private static final Duration RETENTION = Duration.ofDays(35);

    private record Siege(long id, String fort, Instant start, String text) {
    }

    private record Result(long id, String fort, Instant time, FortMessageType type, String owner,
            String previousOwner, String text) {
    }

    private final FortRules rules;
    private final Map<Long, Siege> sieges = new LinkedHashMap<>();
    private final Map<Long, Result> results = new LinkedHashMap<>();

    public TimelineService(FortRules rules) {
        this.rules = rules;
    }

    /** Applies one message and returns the bars it created or changed (empty if none). */
    public synchronized List<DashboardEvent> apply(FortMessage msg) {
        prune(msg.time());
        return switch (msg.type()) {
            case SIEGE_ANNOUNCED -> applySiege(msg, msg.time().plus(rules.siegeStartDelay()));
            case SIEGE_STARTED -> applySiege(msg, msg.time());
            case CAPTURED, DEFENDED -> applyResult(msg);
            case OTHER -> List.of();
        };
    }

    public synchronized List<DashboardEvent> events() {
        List<DashboardEvent> out = new ArrayList<>();
        sieges.values().forEach(s -> out.add(render(s)));
        results.values().forEach(r -> out.add(render(r)));
        out.sort(Comparator.comparing(DashboardEvent::startTime));
        return out;
    }

    private List<DashboardEvent> applySiege(FortMessage msg, Instant start) {
        if (sieges.containsKey(msg.messageId())) {
            return List.of();
        }
        Optional<Siege> existing = sieges.values().stream()
                .filter(s -> s.fort().equals(msg.fort()))
                .filter(s -> Duration.between(s.start(), start).abs().compareTo(SAME_SIEGE) <= 0)
                .findFirst();
        if (existing.isPresent()) {
            Siege s = existing.get();
            if (msg.type() != FortMessageType.SIEGE_STARTED) {
                return List.of(); // announcement for a siege we already know about
            }
            // The "started" message pins the real start time; keep the bar's id stable.
            Siege updated = new Siege(s.id(), s.fort(), start, msg.text());
            sieges.put(s.id(), updated);
            return List.of(render(updated));
        }
        Siege siege = new Siege(msg.messageId(), msg.fort(), start, msg.text());
        sieges.put(siege.id(), siege);
        return List.of(render(siege));
    }

    private List<DashboardEvent> applyResult(FortMessage msg) {
        if (results.containsKey(msg.messageId())) {
            return List.of();
        }
        Result result = new Result(msg.messageId(), msg.fort(), msg.time(), msg.type(), msg.owner(),
                msg.previousOwner(), msg.text());
        results.put(result.id(), result);
        List<DashboardEvent> changed = new ArrayList<>();
        changed.add(render(result));
        siegeEndedBy(result).ifPresent(s -> changed.add(render(s)));
        return changed;
    }

    private Optional<Siege> siegeEndedBy(Result r) {
        return sieges.values().stream()
                .filter(s -> s.fort().equals(r.fort()))
                .filter(s -> !s.start().isAfter(r.time()) && Duration.between(s.start(), r.time()).compareTo(MAX_SIEGE_LENGTH) <= 0)
                .max(Comparator.comparing(Siege::start));
    }

    private Optional<Result> resultOf(Siege s) {
        return results.values().stream()
                .filter(r -> r.fort().equals(s.fort()))
                .filter(r -> !s.start().isAfter(r.time()) && Duration.between(s.start(), r.time()).compareTo(MAX_SIEGE_LENGTH) <= 0)
                .min(Comparator.comparing(Result::time));
    }

    private DashboardEvent render(Siege s) {
        Optional<Result> result = resultOf(s);
        long minutes = result
                .map(r -> Math.max(1, Duration.between(s.start(), r.time()).toMinutes()))
                .orElse(rules.siegeDuration().toMinutes());
        String owner = result.map(Result::owner).orElse(null);
        return new DashboardEvent(s.id(), s.fort(), s.start(), minutes, 1, s.text(), s.fort(), "siege", owner, null);
    }

    private DashboardEvent render(Result r) {
        String verb = r.type() == FortMessageType.CAPTURED ? "captured by" : "defended by";
        String description = "Cooldown: " + verb + " " + (r.owner() == null ? "unknown" : r.owner())
                + (r.previousOwner() == null ? "" : " from " + r.previousOwner())
                + " — ready " + rules.readyAfter().toHours() + "h after the siege";
        int priority = r.type() == FortMessageType.CAPTURED ? 2 : 3;
        return new DashboardEvent(r.id(), r.fort(), r.time(), rules.readyAfter().toMinutes(), priority, description,
                r.fort(), "cooldown", r.owner(), r.previousOwner());
    }

    private void prune(Instant reference) {
        Instant cutoff = reference.minus(RETENTION);
        sieges.values().removeIf(s -> s.start().plus(rules.siegeDuration()).isBefore(cutoff));
        results.values().removeIf(r -> r.time().plus(rules.readyAfter()).isBefore(cutoff));
    }
}
