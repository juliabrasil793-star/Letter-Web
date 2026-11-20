package com.letterweb.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "publication_records")
public class PublicationRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "client_ip", length = 45, nullable = false, updatable = false)
	private String clientIp;

	@Column(name = "published_at", nullable = false, updatable = false)
	private Instant publishedAt;

	protected PublicationRecord() {
	}

	public PublicationRecord(String clientIp, Instant publishedAt) {
		this.clientIp = clientIp;
		this.publishedAt = publishedAt;
	}

	public String getClientIp() {
		return clientIp;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}
}
