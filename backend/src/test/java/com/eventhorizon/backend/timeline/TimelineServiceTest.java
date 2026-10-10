package com.eventhorizon.backend.timeline;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.eventhorizon.backend.TelegramExport;
import com.eventhorizon.backend.fort.FortRules;
import com.eventhorizon.backend.fort.MessageParser;

class TimelineServiceTest {

    private static final FortRules RULES = new FortRules(Duration.ofHours(1), Duration.ofMinutes(60), Duration.ofHours(8));
    private static final Instant T = Instant.parse("2025-12-26T05:00:00Z");
    private static final String FORT = "Крепость Аару";

    private final MessageParser parser = new MessageParser();
    private final TimelineService timeline = new TimelineService(RULES);

    @Test
    void announcementAloneIsSiegeOneHourLater() {
        apply(1, "Осада крепости Крепость Аару начнется через 60 минут!", T);

        assertThat(timeline.events()).singleElement().satisfies(e -> {
            assertThat(e.id()).isEqualTo(1);
            assertThat(e.kind()).isEqualTo("siege");
            assertThat(e.startTime()).isEqualTo(T.plus(Duration.ofHours(1)));
            assertThat(e.duration()).isEqualTo(60);
            assertThat(e.priority()).isEqualTo(1);
        });
    }

    @Test
    void startedMessageMergesIntoAnnouncedSiege() {
        apply(1, "Осада крепости Крепость Аару начнется через 60 минут!", T);
        List<DashboardEvent> changed = apply(2, "Осада Крепость Аару началась!", T.plus(Duration.ofMinutes(62)));

        assertThat(changed).singleElement().extracting(DashboardEvent::id).isEqualTo(1L);
        assertThat(timeline.events()).singleElement()
                .extracting(DashboardEvent::startTime).isEqualTo(T.plus(Duration.ofMinutes(62)));
    }

    @Test
    void captureEndsSiegeAndStartsCooldown() {
        apply(1, "Осада Крепость Аару началась!", T);
        List<DashboardEvent> changed = apply(2, "Dark Knights захватил крепость Крепость Аару!", T.plus(Duration.ofMinutes(25)));

        assertThat(changed).extracting(DashboardEvent::id).containsExactlyInAnyOrder(1L, 2L);
        DashboardEvent siege = byId(1);
        DashboardEvent cooldown = byId(2);
        assertThat(siege.duration()).isEqualTo(25);
        assertThat(siege.owner()).isEqualTo("Dark Knights");
        assertThat(cooldown.kind()).isEqualTo("cooldown");
        assertThat(cooldown.duration()).isEqualTo(480);
        assertThat(cooldown.priority()).isEqualTo(2);
        assertThat(cooldown.fort()).isEqualTo(FORT);
    }

    @Test
    void sameMessageTwiceChangesNothing() {
        apply(1, "Осада Крепость Аару началась!", T);

        assertThat(apply(1, "Осада Крепость Аару началась!", T)).isEmpty();
        assertThat(timeline.events()).hasSize(1);
    }

    @Test
    void sampleExportGivesTwoSiegesAndOneCooldown() throws Exception {
        for (TelegramExport.Message m : TelegramExport.read(TelegramExport.SAMPLE)) {
            apply(m.id(), m.text(), m.time());
        }

        assertThat(timeline.events()).extracting(DashboardEvent::kind)
                .containsExactlyInAnyOrder("siege", "siege", "cooldown");
    }

    private List<DashboardEvent> apply(long id, String text, Instant time) {
        return parser.parse(id, text, time).stream().flatMap(m -> timeline.apply(m).stream()).toList();
    }

    private DashboardEvent byId(long id) {
        return timeline.events().stream().filter(e -> e.id() == id).findFirst().orElseThrow();
    }
}
