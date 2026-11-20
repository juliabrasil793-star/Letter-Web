package com.letterweb.service;

import java.time.Instant;

public class PublicationLimitException extends RuntimeException {

	private final Instant retryAt;

	public PublicationLimitException(Instant retryAt) {
		super("O limite de 5 publicações por IP em 24 horas foi atingido.");
		this.retryAt = retryAt;
	}

	public Instant getRetryAt() {
		return retryAt;
	}
}
