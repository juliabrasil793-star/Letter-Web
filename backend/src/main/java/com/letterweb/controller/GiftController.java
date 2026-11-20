package com.letterweb.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.letterweb.config.ClientIpResolver;
import com.letterweb.dto.GiftResponse;
import com.letterweb.service.GiftService;
import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/presentes")
public class GiftController {

	private final GiftService giftService;
	private final ClientIpResolver clientIpResolver;

	public GiftController(GiftService giftService, ClientIpResolver clientIpResolver) {
		this.giftService = giftService;
		this.clientIpResolver = clientIpResolver;
	}

	@PostMapping
	public ResponseEntity<GiftResponse> publish(
			@RequestBody JsonNode content,
			HttpServletRequest request) {
		GiftResponse response = giftService.publish(content, clientIpResolver.resolve(request));
		URI location = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{slug}")
				.buildAndExpand(response.slug())
				.toUri();
		return ResponseEntity.created(location).body(response);
	}

	@GetMapping("/{slug}")
	public GiftResponse findPublished(@PathVariable String slug) {
		return giftService.findPublished(slug);
	}
}
