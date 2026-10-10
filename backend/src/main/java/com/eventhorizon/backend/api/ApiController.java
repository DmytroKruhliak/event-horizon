package com.eventhorizon.backend.api;

import java.time.Clock;
import java.util.List;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.eventhorizon.backend.feed.EventStream;
import com.eventhorizon.backend.fort.FortStateService;
import com.eventhorizon.backend.fort.FortStatusView;
import com.eventhorizon.backend.timeline.DashboardEvent;
import com.eventhorizon.backend.timeline.TimelineService;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final TimelineService timeline;
    private final FortStateService state;
    private final EventStream stream;
    private final Clock clock;

    public ApiController(TimelineService timeline, FortStateService state, EventStream stream, Clock clock) {
        this.timeline = timeline;
        this.state = state;
        this.stream = stream;
        this.clock = clock;
    }

    @GetMapping("/events")
    public List<DashboardEvent> events() {
        return timeline.events();
    }

    @GetMapping("/forts")
    public List<FortStatusView> forts() {
        return state.snapshot(clock.instant());
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletResponse response) {
        // no-transform stops the CRA dev proxy's compression from buffering the stream.
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        return stream.subscribe();
    }
}
