package com.letterweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.letterweb.dto.GiftResponse;
import com.letterweb.entity.Gift;
import com.letterweb.repository.GiftRepository;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class GiftServiceTests {

	private static final Instant NOW = Instant.parse("2026-11-10T12:00:00Z");

	@Mock
	private GiftRepository giftRepository;

	private GiftService giftService;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@BeforeEach
	void setUp() {
		giftService = new GiftService(
				giftRepository,
				Clock.fixed(NOW, ZoneOffset.UTC));
	}

	@Test
	void savesGiftWithUniqueSlugAndFortyEightHourAvailability() throws Exception {
		when(giftRepository.save(any(Gift.class))).thenAnswer(invocation -> invocation.getArgument(0));
		var content = objectMapper.readTree("""
				{"title":"Presente","elements":[],"backgroundImage":"data:image/png;base64,AA=="}
				""");

		GiftResponse response = giftService.publish(content);

		assertEquals(32, response.slug().length());
		assertEquals(NOW, response.createdAt());
		assertEquals(NOW.plusSeconds(48 * 60 * 60), response.expiresAt());
		assertEquals(content, response.gift());
		verify(giftRepository).save(any(Gift.class));
	}

	@Test
	void allowsPublishingMultipleGiftsWithoutLimit() throws Exception {
		when(giftRepository.save(any(Gift.class))).thenAnswer(invocation -> invocation.getArgument(0));
		var content = objectMapper.readTree("""
				{"title":"Presente","elements":[]}
				""");

		for (int i = 0; i < 10; i++) {
			GiftResponse response = giftService.publish(content);
			assertNotNull(response.slug());
		}

		verify(giftRepository, times(10)).save(any(Gift.class));
	}

	@Test
	void doesNotSaveInvalidGiftStructure() throws Exception {
		var content = objectMapper.readTree("""
				{"title":"Sem elementos"}
				""");

		assertThrows(InvalidGiftException.class, () -> giftService.publish(content));

		verify(giftRepository, never()).save(any(Gift.class));
	}

	@Test
	void onlyFindsGiftThatExpiresAfterCurrentTime() throws Exception {
		var content = objectMapper.readTree("""
				{"title":"Presente","elements":[]}
				""");
		Gift gift = new Gift("a".repeat(32), content, NOW.minusSeconds(1), NOW.plusSeconds(1));
		when(giftRepository.findBySlugAndExpiresAtAfter(gift.getSlug(), NOW))
				.thenReturn(Optional.of(gift));

		GiftResponse response = giftService.findPublished(gift.getSlug());

		assertEquals(gift.getSlug(), response.slug());
		assertEquals(content, response.gift());
	}

	@Test
	void treatsExpiredGiftAsNotFound() {
		when(giftRepository.findBySlugAndExpiresAtAfter("expired", NOW))
				.thenReturn(Optional.empty());

		assertThrows(GiftNotFoundException.class, () -> giftService.findPublished("expired"));
	}
}
