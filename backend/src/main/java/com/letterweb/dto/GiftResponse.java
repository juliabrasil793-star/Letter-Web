package com.letterweb.dto;

import java.time.Instant;

import com.letterweb.entity.Gift;
import tools.jackson.databind.JsonNode;

public record GiftResponse(String slug, Instant createdAt, Instant expiresAt, JsonNode gift) {

	public static GiftResponse from(Gift gift) {
		return new GiftResponse(gift.getSlug(), gift.getCreatedAt(), gift.getExpiresAt(), gift.getContent());
	}
}
