package com.letterweb.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cabeçalhos de segurança e privacidade das respostas da API.
 *
 * - Cache-Control: no-store no consumo de presentes evita que proxies/CDNs
 * retenham conteúdo que só deveria ser acessível por quem tem o link.
 * - nosniff e proteção contra enquadramento (framing) reduzem riscos de MIME
 * sniffing e clickjacking.
 * - Referrer-Policy: no-referrer impede que o slug do presente vaze pelo
 * header Referer em navegações ou recursos externos.
 */
@Configuration
public class SecurityHeadersConfiguration implements WebMvcConfigurer {

	private static final String CACHE_CONTROL_PRIVATE = "no-store, private";
	private static final String CACHE_CONTROL_PUBLIC_ASSETS = "no-store";

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new SecurityHeadersInterceptor())
				.addPathPatterns("/api/**");
	}

	static class SecurityHeadersInterceptor implements HandlerInterceptor {

		@Override
		public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
			response.setHeader("X-Content-Type-Options", "nosniff");
			response.setHeader("Referrer-Policy", "no-referrer");

			String path = request.getRequestURI();
			if (path.startsWith("/api/presentes")) {
				// O conteúdo do presente é privado por link: nunca armazenar em cache.
				response.setHeader("Cache-Control", CACHE_CONTROL_PRIVATE);
				// Presentes nunca devem ser indexados, nem via resultados de busca.
				response.setHeader("X-Robots-Tag", "noindex, nofollow");
				// Não permitir que a página do presente seja embutida em iframes de terceiros.
				response.setHeader("X-Frame-Options", "DENY");
				response.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
			} else {
				response.setHeader("Cache-Control", CACHE_CONTROL_PUBLIC_ASSETS);
			}
			return true;
		}
	}
}
