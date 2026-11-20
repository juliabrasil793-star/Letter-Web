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
	private final PublicationLimitService publicationLimitService;
	private final Clock clock;

	public GiftService(
			GiftRepository giftRepository,
			PublicationLimitService publicationLimitService,
			Clock clock) {
		this.giftRepository = giftRepository;
		this.publicationLimitService = publicationLimitService;
		this.clock = clock;
	}

	@Transactional
	public GiftResponse publish(JsonNode content, String clientIp) {
		if (content == null || !content.isObject() || content.isEmpty()
				|| !content.path("elements").isArray()) {
			throw new InvalidGiftException("O presente deve ser um objeto com elements como uma lista.");
		}

		publicationLimitService.registerPublication(clientIp);

		Instant createdAt = clock.instant();
		Gift gift = new Gift(
				UUID.randomUUID().toString().replace("-", ""),
				content,
				createdAt,
				createdAt.plus(AVAILABILITY));

		return GiftResponse.from(giftRepository.save(gift));
	}

	@Transactional(readOnly = true)
	public GiftResponse findPublished(String slug) {
		return giftRepository.findBySlugAndExpiresAtAfter(slug, clock.instant())
				.map(GiftResponse::from)
				.orElseThrow(GiftNotFoundException::new);
	}
}
