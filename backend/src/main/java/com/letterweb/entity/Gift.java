package com.letterweb.entity;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import tools.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "presents")
public class Gift {

	@Id
	@Column(length = 32, nullable = false, updatable = false)
	private String slug;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "content", columnDefinition = "jsonb", nullable = false)
	private JsonNode content;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "expires_at", nullable = false, updatable = false)
	private Instant expiresAt;

	protected Gift() {
	}

	public Gift(String slug, JsonNode content, Instant createdAt, Instant expiresAt) {
		this.slug = slug;
		this.content = content;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
	}

	public String getSlug() {
		return slug;
	}

	public JsonNode getContent() {
		return content;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}
}
