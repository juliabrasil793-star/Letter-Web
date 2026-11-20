package com.letterweb.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.letterweb.dto.ApiError;
import com.letterweb.dto.RateLimitError;
import com.letterweb.service.GiftNotFoundException;
import com.letterweb.service.InvalidGiftException;
import com.letterweb.service.PublicationLimitException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(InvalidGiftException.class)
	public ResponseEntity<ApiError> handleInvalidGift(InvalidGiftException exception) {
		return ResponseEntity.badRequest().body(new ApiError(exception.getMessage()));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException exception) {
		return ResponseEntity.badRequest().body(new ApiError("Corpo da requisição inválido."));
	}

	@ExceptionHandler(GiftNotFoundException.class)
	public ResponseEntity<ApiError> handleGiftNotFound(GiftNotFoundException exception) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(new ApiError("Presente não encontrado ou expirado."));
	}

	@ExceptionHandler(PublicationLimitException.class)
	public ResponseEntity<RateLimitError> handlePublicationLimit(PublicationLimitException exception) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(new RateLimitError(
						"O limite de 5 publicações por IP em 24 horas foi atingido. "
								+ "Você poderá publicar novamente em " + exception.getRetryAt() + ".",
						exception.getRetryAt()));
	}
}
