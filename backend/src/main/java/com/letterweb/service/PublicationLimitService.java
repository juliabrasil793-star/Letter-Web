package com.letterweb.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.letterweb.entity.PublicationRecord;
import com.letterweb.repository.PublicationRecordRepository;

@Service
public class PublicationLimitService {

	private static final int MAX_PUBLICATIONS = 5;
	private static final Duration WINDOW = Duration.ofHours(24);
	private static final String ACQUIRE_IP_LOCK_SQL =
			"SELECT pg_advisory_xact_lock(hashtextextended(?, 0)) IS NULL";

	private final JdbcTemplate jdbcTemplate;
	private final PublicationRecordRepository publicationRecordRepository;
	private final Clock clock;

	public PublicationLimitService(
			JdbcTemplate jdbcTemplate,
			PublicationRecordRepository publicationRecordRepository,
			Clock clock) {
		this.jdbcTemplate = jdbcTemplate;
		this.publicationRecordRepository = publicationRecordRepository;
		this.clock = clock;
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public void registerPublication(String clientIp) {
		jdbcTemplate.queryForObject(ACQUIRE_IP_LOCK_SQL, Boolean.class, clientIp);

		Instant now = clock.instant();
		Instant windowStart = now.minus(WINDOW);
		long recentPublications = publicationRecordRepository
				.countByClientIpAndPublishedAtAfter(clientIp, windowStart);
		if (recentPublications >= MAX_PUBLICATIONS) {
			Instant retryAt = publicationRecordRepository
					.findFirstByClientIpAndPublishedAtAfterOrderByPublishedAtAsc(clientIp, windowStart)
					.orElseThrow(() -> new IllegalStateException(
							"Registros de publicação inconsistentes para o endereço IP."))
					.getPublishedAt()
					.plus(WINDOW);
			throw new PublicationLimitException(retryAt);
		}

		publicationRecordRepository.save(new PublicationRecord(clientIp, now));
	}
}
