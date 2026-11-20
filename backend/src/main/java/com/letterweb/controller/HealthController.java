package com.letterweb.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint simples de saúde para monitoramento da aplicação.
 * Não expõe credenciais, variáveis de ambiente, detalhes do banco
 * de dados ou qualquer informação interna.
 */
@RestController
public class HealthController {

	@GetMapping("/api/health")
	public ResponseEntity<Map<String, String>> health() {
		return ResponseEntity.ok(Map.of("status", "ok"));
	}
}
