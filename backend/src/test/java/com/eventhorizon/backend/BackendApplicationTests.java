package com.eventhorizon.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import com.eventhorizon.backend.feed.FortFeed;

// force-response makes MockMvc decode the Cyrillic JSON as UTF-8.
@SpringBootTest(properties = {"telegram.enabled=false", "server.servlet.encoding.force-response=true"})
@AutoConfigureMockMvc
class BackendApplicationTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FortFeed feed;

    @Test
    void apiServesIngestedMessages() throws Exception {
        assertThat(feed.ingest(42, "Осада Крепость Танор началась!", Instant.parse("2025-12-26T05:00:00Z"), "live")).isTrue();
        // The same message again (e.g. from a catch-up) is recognised and skipped
        assertThat(feed.ingest(42, "Осада Крепость Танор началась!", Instant.parse("2025-12-26T05:00:00Z"), "catch-up")).isFalse();

        mvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42))
                .andExpect(jsonPath("$[0].name").value("Крепость Танор"))
                .andExpect(jsonPath("$[0].startTime").value("2025-12-26T05:00:00Z"))
                .andExpect(jsonPath("$[0].duration").value(60))
                .andExpect(jsonPath("$.length()").value(1));

        mvc.perform(get("/api/forts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(21))
                .andExpect(jsonPath("$[0].fort").value("Крепость Танор"))
                .andExpect(jsonPath("$[0].status").value("Registered/In Progress"));
    }
}
