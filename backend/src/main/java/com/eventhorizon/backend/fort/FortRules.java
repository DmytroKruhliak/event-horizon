package com.eventhorizon.backend.fort;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Fixed game timings.
 *
 * @param siegeStartDelay lead time announced by "через 60 минут" before a siege starts
 * @param siegeDuration   bar length for a siege that has no capture/defend result yet
 * @param readyAfter      cooldown after a capture/defend before the fort is Ready again
 */
@ConfigurationProperties("forts")
public record FortRules(Duration siegeStartDelay, Duration siegeDuration, Duration readyAfter) {
}
