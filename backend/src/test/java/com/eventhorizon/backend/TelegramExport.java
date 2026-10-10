package com.eventhorizon.backend;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Reads a Telegram Desktop "Export chat history" JSON (the result.json format). */
public final class TelegramExport {

    /** Shared sample export at the event-horizon repo root; Maven runs tests from backend/. */
    public static final Path SAMPLE = Path.of("..", "test_data", "filtered.json");

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(long id, String text, @JsonProperty("date_unixtime") long dateUnixtime) {
        public Instant time() {
            return Instant.ofEpochSecond(dateUnixtime);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Export(List<Message> messages) {
    }

    private TelegramExport() {
    }

    public static List<Message> read(Path path) throws IOException {
        return new ObjectMapper().readValue(path.toFile(), Export.class).messages();
    }
}
