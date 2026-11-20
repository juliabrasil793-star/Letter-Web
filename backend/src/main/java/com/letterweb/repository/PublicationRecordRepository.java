package com.letterweb.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.letterweb.entity.PublicationRecord;

public interface PublicationRecordRepository extends JpaRepository<PublicationRecord, Long> {

	long countByClientIpAndPublishedAtAfter(String clientIp, Instant publishedAt);

	Optional<PublicationRecord> findFirstByClientIpAndPublishedAtAfterOrderByPublishedAtAsc(
			String clientIp, Instant publishedAt);
}
