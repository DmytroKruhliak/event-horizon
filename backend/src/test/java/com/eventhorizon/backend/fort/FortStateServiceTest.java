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
                .isEqualTo(new FortStatusView(WHITE_SANDS, FortStatus.IN_PROGRESS, WHITE_SANDS_STARTED, null));
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

    private static Map<String, FortStatusView> byFort(List<FortStatusView> views) {
        return views.stream().collect(Collectors.toMap(FortStatusView::fort, Function.identity()));
    }
}
