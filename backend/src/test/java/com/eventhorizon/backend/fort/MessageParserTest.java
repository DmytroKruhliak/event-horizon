package com.eventhorizon.backend.fort;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

class MessageParserTest {

    private static final Instant T = Instant.parse("2025-12-26T05:14:40Z");
    private final MessageParser parser = new MessageParser();

    @Test
    void siegeAnnouncement() {
        List<FortMessage> result = parser.parse(1, "Осада крепости Крепость Белых Песков начнется через 60 минут!", T);

        assertThat(result).singleElement().satisfies(m -> {
            assertThat(m.fort()).isEqualTo("Крепость Белых Песков");
            assertThat(m.type()).isEqualTo(FortMessageType.SIEGE_ANNOUNCED);
            assertThat(m.owner()).isNull();
            assertThat(m.time()).isEqualTo(T);
        });
    }

    @Test
    void siegeStarted() {
        assertThat(parser.parse(1, "Осада Заснеженная Крепость началась!", T))
                .singleElement()
                .extracting(FortMessage::type)
                .isEqualTo(FortMessageType.SIEGE_STARTED);
    }

    @Test
    void defendedWithOwner() {
        assertThat(parser.parse(1, "23М65 отстоял крепость Заснеженная Крепость!", T))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.type()).isEqualTo(FortMessageType.DEFENDED);
                    assertThat(m.owner()).isEqualTo("23М65");
                });
    }

    @Test
    void capturedOwnerMayContainSpaces() {
        assertThat(parser.parse(1, "Dark Knights захватил крепость Крепость Аару!", T))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.type()).isEqualTo(FortMessageType.CAPTURED);
                    assertThat(m.owner()).isEqualTo("Dark Knights");
                });
    }

    @Test
    void capturedFromAnotherClanHasPreviousOwner() {
        assertThat(parser.parse(1, "Hinata захватил крепость Западная Крепость у Петушилко!", T))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.type()).isEqualTo(FortMessageType.CAPTURED);
                    assertThat(m.owner()).isEqualTo("Hinata");
                    assertThat(m.previousOwner()).isEqualTo("Петушилко");
                });
    }

    @Test
    void capturedWithoutPreviousOwner() {
        assertThat(parser.parse(1, "CopturedByFury захватил крепость Крепость Болота!", T))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.owner()).isEqualTo("CopturedByFury");
                    assertThat(m.previousOwner()).isNull();
                });
    }

    @Test
    void unrelatedTextYieldsNothing() {
        assertThat(parser.parse(1, "Всем привет!", T)).isEmpty();
        assertThat(parser.parse(1, "", T)).isEmpty();
        assertThat(parser.parse(1, null, T)).isEmpty();
    }

    @Test
    void unknownPhraseAboutFortIsOther() {
        assertThat(parser.parse(1, "Крепость Танор скоро будет нашей", T))
                .singleElement()
                .extracting(FortMessage::type)
                .isEqualTo(FortMessageType.OTHER);
    }
}
