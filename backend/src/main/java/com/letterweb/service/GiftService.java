package com.letterweb.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.letterweb.dto.GiftResponse;
import com.letterweb.entity.Gift;
import com.letterweb.repository.GiftRepository;
import tools.jackson.databind.JsonNode;

@Service
public class GiftService {

	private static final Duration AVAILABILITY = Duration.ofHours(48);

	private final GiftRepository giftRepository;
	private final Clock clock;

	public GiftService(GiftRepository giftRepository, Clock clock) {
		this.giftRepository = giftRepository;
		this.clock = clock;
	}

	@Transactional
	public GiftResponse publish(JsonNode content) {
		if (content == null || !content.isObject() || content.isEmpty()
				|| !content.path("elements").isArray()) {
			throw new InvalidGiftException("O presente deve ser um objeto com elements como uma lista.");
		}

		Instant createdAt = clock.instant();
		Gift gift = new Gift(
				UUID.randomUUID().toString().replace("-", ""),
				content,
				createdAt,
				createdAt.plus(AVAILABILITY));

		return GiftResponse.from(giftRepository.save(gift));
	}

	@Transactional
	public GiftResponse publish(JsonNode content, String clientIp) {
		return publish(content);
	}

	@Transactional(readOnly = true)
	public GiftResponse findPublished(String slug) {
		return giftRepository.findBySlugAndExpiresAtAfter(slug, clock.instant())
				.map(GiftResponse::from)
				.orElseThrow(GiftNotFoundException::new);
	}
}
