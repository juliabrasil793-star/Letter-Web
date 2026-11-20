package com.letterweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.letterweb.entity.PublicationRecord;
import com.letterweb.repository.PublicationRecordRepository;

@ExtendWith(MockitoExtension.class)
class PublicationLimitServiceTests {

	private static final Instant NOW = Instant.parse("2026-11-10T12:00:00Z");
	private static final String CLIENT_IP = "192.0.2.10";

	@Mock
	private JdbcTemplate jdbcTemplate;

	@Mock
	private PublicationRecordRepository publicationRecordRepository;

	private PublicationLimitService publicationLimitService;

	@BeforeEach
	void setUp() {
		publicationLimitService = new PublicationLimitService(
				jdbcTemplate,
				publicationRecordRepository,
				Clock.fixed(NOW, ZoneOffset.UTC));
	}

	@Test
	void allowsFirstFiveAndPersistsOneRecordForEachPublication() {
		when(jdbcTemplate.queryForObject(any(String.class), eq(Boolean.class), eq(CLIENT_IP)))
				.thenReturn(true);
		when(publicationRecordRepository.countByClientIpAndPublishedAtAfter(
				eq(CLIENT_IP), any(Instant.class)))
				.thenReturn(0L, 1L, 2L, 3L, 4L);

		for (int publication = 0; publication < 5; publication++) {
			publicationLimitService.registerPublication(CLIENT_IP);
		}

		ArgumentCaptor<PublicationRecord> recordCaptor = ArgumentCaptor.forClass(PublicationRecord.class);
		verify(publicationRecordRepository, times(5)).save(recordCaptor.capture());
		assertEquals(5, recordCaptor.getAllValues().size());
		assertEquals(NOW, recordCaptor.getAllValues().getFirst().getPublishedAt());
		verify(publicationRecordRepository, times(5)).countByClientIpAndPublishedAtAfter(
				CLIENT_IP, NOW.minusSeconds(24 * 60 * 60));
	}

	@Test
	void rejectsSixthPublicationAndReportsWhenTheOldestRecordExpires() {
		Instant oldestPublication = NOW.minusSeconds(20 * 60 * 60);
		when(jdbcTemplate.queryForObject(any(String.class), eq(Boolean.class), eq(CLIENT_IP)))
				.thenReturn(true);
		when(publicationRecordRepository.countByClientIpAndPublishedAtAfter(
				CLIENT_IP, NOW.minusSeconds(24 * 60 * 60)))
				.thenReturn(5L);
		when(publicationRecordRepository.findFirstByClientIpAndPublishedAtAfterOrderByPublishedAtAsc(
				CLIENT_IP, NOW.minusSeconds(24 * 60 * 60)))
				.thenReturn(Optional.of(new PublicationRecord(CLIENT_IP, oldestPublication)));

		PublicationLimitException exception = assertThrows(
				PublicationLimitException.class,
				() -> publicationLimitService.registerPublication(CLIENT_IP));

		assertEquals(oldestPublication.plusSeconds(24 * 60 * 60), exception.getRetryAt());
		verify(publicationRecordRepository, never()).save(any(PublicationRecord.class));
	}

	@Test
	void countsEachIpIndependentlyAndUsesTheRollingTwentyFourHourCutoff() {
		String otherIp = "198.51.100.4";
		when(jdbcTemplate.queryForObject(any(String.class), eq(Boolean.class), eq(otherIp)))
				.thenReturn(true);
		when(publicationRecordRepository.countByClientIpAndPublishedAtAfter(
				eq(otherIp), any(Instant.class)))
				.thenReturn(0L);

		publicationLimitService.registerPublication(otherIp);

		verify(publicationRecordRepository).countByClientIpAndPublishedAtAfter(
				otherIp, NOW.minusSeconds(24 * 60 * 60));
		verify(publicationRecordRepository).save(any(PublicationRecord.class));
	}
}
