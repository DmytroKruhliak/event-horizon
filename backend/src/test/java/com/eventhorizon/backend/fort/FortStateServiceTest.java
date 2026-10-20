package com.eventhorizon.backend.fort;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import com.eventhorizon.backend.TelegramExport;

class FortStateServiceTest {

    static final FortRules RULES = new FortRules(Duration.ofHours(1), Duration.ofMinutes(60), Duration.ofHours(8));

    private static final String WHITE_SANDS = "Крепость Белых Песков";
    private static final String SNOWY = "Заснеженная Крепость";
    // Times from test_data/filtered.json (date_unixtime).
    private static final Instant WHITE_SANDS_STARTED = Instant.ofEpochSecond(1766729680);
    private static final Instant SNOWY_DEFENDED = Instant.ofEpochSecond(1766733454);

    private final MessageParser parser = new MessageParser();

    @Test
    void sampleExportGivesSameResultAsPythonScript() throws Exception {
        FortStateService state = load(false);

        Map<String, FortStatusView> forts = byFort(state.snapshot(SNOWY_DEFENDED.plus(Duration.ofHours(1))));

        assertThat(forts.get(WHITE_SANDS))
                .isEqualTo(new FortStatusView(WHITE_SANDS, FortStatus.SIEGE, WHITE_SANDS_STARTED, null));
        assertThat(forts.get(SNOWY))
                .isEqualTo(new FortStatusView(SNOWY, FortStatus.PENDING, SNOWY_DEFENDED.plus(Duration.ofHours(8)), "23М65"));
        assertThat(forts.values()).filteredOn(v -> v.status() == FortStatus.UNKNOWN).hasSize(19);
    }

    @Test
    void pendingTurnsReadyWithoutNewMessages() throws Exception {
        FortStateService state = load(false);

        Map<String, FortStatusView> forts = byFort(state.snapshot(SNOWY_DEFENDED.plus(Duration.ofHours(9))));

        assertThat(forts.get(SNOWY).status()).isEqualTo(FortStatus.READY);
    }

    @Test
    void announcedSiegeIsRegisteredUntilItsStartTime() {
        FortStateService state = new FortStateService(RULES);
        Instant announced = Instant.parse("2026-10-10T08:45:50Z");
        parser.parse(1, "Осада крепости Крепость Болота начнется через 60 минут!", announced).forEach(state::apply);
        Instant start = announced.plus(Duration.ofHours(1));

        assertThat(byFort(state.snapshot(start.minusSeconds(60))).get("Крепость Болота"))
                .isEqualTo(new FortStatusView("Крепость Болота", FortStatus.REGISTERED, start, null));
        assertThat(byFort(state.snapshot(start.plusSeconds(60))).get("Крепость Болота").status())
                .isEqualTo(FortStatus.SIEGE);
    }

    @Test
    void statusOrderIsSiegeRegisteredReadyPendingUnknown() {
        FortStateService state = new FortStateService(RULES);
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        apply(state, "Осада Крепость Танор началась!", now.minusSeconds(600));                                // siege
        apply(state, "Осада крепости Крепость Аару начнется через 60 минут!", now.minusSeconds(600));          // registered
        apply(state, "Hinata захватил крепость Крепость Улья!", now.minus(Duration.ofHours(10)));              // ready
        apply(state, "Selinity отстоял крепость Крепость Демона!", now.minus(Duration.ofHours(1)));            // pending

        assertThat(state.snapshot(now)).extracting(FortStatusView::fort).startsWith(
                "Крепость Танор", "Крепость Аару", "Крепость Улья", "Крепость Демона");
        assertThat(state.snapshot(now)).extracting(FortStatusView::status).startsWith(
                FortStatus.SIEGE, FortStatus.REGISTERED, FortStatus.READY, FortStatus.PENDING, FortStatus.UNKNOWN);
    }

    @Test
    void arrivalOrderDoesNotMatter() throws Exception {
        Instant now = SNOWY_DEFENDED.plus(Duration.ofHours(1));

        assertThat(load(true).snapshot(now)).isEqualTo(load(false).snapshot(now));
    }

    @Test
    void snapshotIsGroupedByStatusThenTime() throws Exception {
        List<FortStatusView> snapshot = load(false).snapshot(SNOWY_DEFENDED.plus(Duration.ofHours(1)));

        assertThat(snapshot.get(0).fort()).isEqualTo(WHITE_SANDS);
        assertThat(snapshot.get(1).fort()).isEqualTo(SNOWY);
        assertThat(snapshot).extracting(FortStatusView::status).isSorted();
    }

    private FortStateService load(boolean reversed) throws Exception {
        List<TelegramExport.Message> messages = TelegramExport.read(TelegramExport.SAMPLE);
        if (reversed) {
            Collections.reverse(messages);
        }
        FortStateService state = new FortStateService(RULES);
        for (TelegramExport.Message m : messages) {
            parser.parse(m.id(), m.text(), m.time()).forEach(state::apply);
        }
        return state;
    }

    private void apply(FortStateService state, String text, Instant time) {
        parser.parse(time.getEpochSecond(), text, time).forEach(state::apply);
    }

    private static Map<String, FortStatusView> byFort(List<FortStatusView> views) {
        return views.stream().collect(Collectors.toMap(FortStatusView::fort, Function.identity()));
    }
}
