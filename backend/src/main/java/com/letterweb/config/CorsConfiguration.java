package com.letterweb.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {

	private final List<String> allowedOrigins;

	public CorsConfiguration(@Value("${letterweb.cors.allowed-origins:}") String allowedOrigins) {
		this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
				.map(String::trim)
				.filter(origin -> !origin.isEmpty())
				.toList();
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		if (allowedOrigins.isEmpty()) {
			return;
		}

		registry.addMapping("/api/**")
				.allowedOrigins(allowedOrigins.toArray(String[]::new))
				.allowedMethods("GET", "POST", "OPTIONS")
				.allowedHeaders("Accept", "Content-Type")
				.allowCredentials(false)
				.maxAge(3600);
	}
}
