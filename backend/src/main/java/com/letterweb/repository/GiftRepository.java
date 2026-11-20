package com.letterweb.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.letterweb.entity.Gift;

public interface GiftRepository extends JpaRepository<Gift, String> {

	Optional<Gift> findBySlugAndExpiresAtAfter(String slug, Instant now);
}
