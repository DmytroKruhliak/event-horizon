package com.eventhorizon.backend.fort;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/** Classifies siege messages. Keyword rules are a port of l2/scripts/get_fortress_status.py. */
@Component
public class MessageParser {

    private static final Pattern OWNER = Pattern.compile("^(.*?)\\s+(?:захватил|отстоял)(?![\\p{L}\\p{N}_])");
    /** What follows the fort name in "... захватил крепость X у Y!". */
    private static final Pattern PREVIOUS_OWNER = Pattern.compile("^\\s+у\\s+(.+?)\\s*!?\\s*$");
    private static final Locale RU = Locale.forLanguageTag("ru");

    public List<FortMessage> parse(long messageId, String text, Instant time) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String lower = text.toLowerCase(RU);
        FortMessageType type = classify(lower);
        String owner = type.isCaptureOrDefend() ? extractOwner(text) : null;

        List<FortMessage> result = new ArrayList<>();
        for (String fort : Fortresses.NAMES) {
            int at = lower.indexOf(fort.toLowerCase(RU));
            if (at >= 0) {
                String previousOwner = type == FortMessageType.CAPTURED
                        ? extractPreviousOwner(text.substring(at + fort.length()))
                        : null;
                result.add(new FortMessage(messageId, fort, type, time, owner, previousOwner, text));
            }
        }
        return result;
    }

    private static FortMessageType classify(String lower) {
        if (lower.contains("осада") && lower.contains("через 60")) {
            return FortMessageType.SIEGE_ANNOUNCED;
        }
        if (lower.contains("осада") && lower.contains("началась")) {
            return FortMessageType.SIEGE_STARTED;
        }
        if (lower.contains("захватил")) {
            return FortMessageType.CAPTURED;
        }
        if (lower.contains("отстоял")) {
            return FortMessageType.DEFENDED;
        }
        return FortMessageType.OTHER;
    }

    static String extractPreviousOwner(String afterFort) {
        Matcher m = PREVIOUS_OWNER.matcher(afterFort);
        return m.find() ? m.group(1).strip() : null;
    }

    static String extractOwner(String text) {
        Matcher m = OWNER.matcher(text);
        return m.find() ? m.group(1).strip() : null;
    }
}
