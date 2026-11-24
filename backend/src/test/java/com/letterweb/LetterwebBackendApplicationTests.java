package com.letterweb;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.letterweb.config.CorsConfiguration;
import com.letterweb.controller.ApiExceptionHandler;
import com.letterweb.controller.GiftController;
import com.letterweb.dto.GiftResponse;
import com.letterweb.service.GiftNotFoundException;
import com.letterweb.service.InvalidGiftException;
import com.letterweb.service.GiftService;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(GiftController.class)
@Import({ApiExceptionHandler.class, CorsConfiguration.class})
@TestPropertySource(properties = "letterweb.cors.allowed-origins=http://localhost:5173,https://letter.example")
class LetterwebBackendApplicationTests {

	private static final String GIFT_JSON = """
			{
			  "title": "Um presente",
			  "recipient": "Ana",
			  "background": "#FFF4E8",
			  "backgroundImage": "data:image/png;base64,AA==",
			  "fontFamily": "Georgia, serif",
			  "textColor": "#3A3036",
			  "appearance": "paper",
			  "elements": [
			    {"id":"text-1","type":"text","role":"title","content":"Olá","x":50,"y":20,"font":"cursive"},
			    {"id":"carousel-1","type":"carousel","images":[{"id":"photo-1","src":"data:image/jpeg;base64,AA==","name":"foto.jpg"}],"currentIndex":0},
			    {"id":"music-1","type":"music","url":"https://open.spotify.com/embed/track/example"},
			    {"id":"sticker-1","type":"sticker","content":"heart","color":"#f349a5"}
			  ],
			  "music": null
			}
			""";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private GiftService giftService;

	@Test
	void publishesGiftWithoutChangingItsContent() throws Exception {
		Instant createdAt = Instant.parse("2026-11-10T12:00:00Z");
		Instant expiresAt = createdAt.plusSeconds(48 * 60 * 60);
		when(giftService.publish(any())).thenAnswer(invocation -> new GiftResponse(
				"abc123",
				createdAt,
				expiresAt,
				invocation.getArgument(0)));

		mockMvc.perform(post("/api/presentes")
						.contentType(MediaType.APPLICATION_JSON)
						.content(GIFT_JSON))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "http://localhost/api/presentes/abc123"))
				.andExpect(jsonPath("$.slug").value("abc123"))
				.andExpect(jsonPath("$.createdAt").value("2026-11-10T12:00:00Z"))
				.andExpect(jsonPath("$.expiresAt").value("2026-11-12T12:00:00Z"))
				.andExpect(jsonPath("$.gift.backgroundImage").value("data:image/png;base64,AA=="))
				.andExpect(jsonPath("$.gift.elements[1].images[0].src").value("data:image/jpeg;base64,AA=="))
				.andExpect(jsonPath("$.gift.elements[2].url").value("https://open.spotify.com/embed/track/example"))
				.andExpect(jsonPath("$.gift.elements[3].color").value("#f349a5"));
	}

	@Test
	void rejectsGiftWithoutElementsArray() throws Exception {
		when(giftService.publish(any())).thenThrow(
				new InvalidGiftException("O presente deve ser um objeto com elements como uma lista."));

		mockMvc.perform(post("/api/presentes")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"title":"Sem elementos"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void returnsNotFoundForMissingOrExpiredGift() throws Exception {
		when(giftService.findPublished("missing")).thenThrow(new GiftNotFoundException());

		mockMvc.perform(get("/api/presentes/missing"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Presente não encontrado ou expirado."));
	}

	@Test
	void getDoesNotPublishGift() throws Exception {
		when(giftService.findPublished("missing")).thenThrow(new GiftNotFoundException());

		mockMvc.perform(get("/api/presentes/missing"))
				.andExpect(status().isNotFound());

		verify(giftService, never()).publish(any());
	}

	@Test
	void rejectsMalformedJson() throws Exception {
		mockMvc.perform(post("/api/presentes")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Corpo da requisição inválido."));
	}

	@Test
	void allowsPreflightFromConfiguredOriginForPostAndFrontendHeaders() throws Exception {
		mockMvc.perform(options("/api/presentes")
						.header("Origin", "http://localhost:5173")
						.header("Access-Control-Request-Method", "POST")
						.header("Access-Control-Request-Headers", "content-type"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
				.andExpect(header().doesNotExist("Access-Control-Allow-Credentials"))
				.andExpect(header().stringValues("Access-Control-Allow-Methods", "GET,POST,OPTIONS"))
				.andExpect(header().stringValues("Access-Control-Allow-Headers", "content-type"));
	}

	@Test
	void doesNotAllowUnconfiguredOrigins() throws Exception {
		mockMvc.perform(options("/api/presentes")
						.header("Origin", "https://untrusted.example")
						.header("Access-Control-Request-Method", "POST"))
				.andExpect(status().isForbidden())
				.andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
	}
}
