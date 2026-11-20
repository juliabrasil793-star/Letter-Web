package com.letterweb.dto;

import java.time.Instant;

public record RateLimitError(String error, Instant retryAt) {
}
