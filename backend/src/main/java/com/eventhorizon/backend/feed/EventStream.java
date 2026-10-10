package com.eventhorizon.backend.feed;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import jakarta.annotation.PreDestroy;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.eventhorizon.backend.timeline.DashboardEvent;

/** Server-Sent Events fan-out to every open dashboard. */
@Component
public class EventStream {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // no server-side timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        try {
            // Flushes the response headers right away so the client sees the stream as open.
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    public void publish(DashboardEvent event) {
        send(SseEmitter.event().name("event").data(event));
    }

    /** Keeps idle connections from being closed by proxies, and drops dead clients. */
    @Scheduled(fixedRate = 30_000)
    void heartbeat() {
        send(SseEmitter.event().comment("ping"));
    }

    /** Ends open streams on shutdown instead of letting each one time out with a warning. */
    @PreDestroy
    void closeAll() {
        emitters.forEach(SseEmitter::complete);
        emitters.clear();
    }

    private void send(SseEmitter.SseEventBuilder message) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(message);
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
                emitter.completeWithError(e);
            }
        }
    }
}
