package com.letterweb.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.hibernate.type.spi.TypeConfiguration;
import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class Jackson3JsonFormatMapperTests {

	@Test
	void preservesNestedGiftJsonDuringHibernateSerialization() {
		JsonMapper objectMapper = JsonMapper.builder().build();
		JsonNode gift = objectMapper.readTree("""
				{
				  "backgroundImage":"data:image/png;base64,AA==",
				  "elements":[
				    {"type":"carousel","images":[{"src":"data:image/jpeg;base64,AA=="}]},
				    {"type":"music","url":"https://open.spotify.com/embed/track/example"}
				  ]
				}
				""");
		var javaType = new TypeConfiguration().getJavaTypeRegistry().resolveDescriptor(JsonNode.class);
		Jackson3JsonFormatMapper formatMapper = new Jackson3JsonFormatMapper();

		String serialized = formatMapper.toString(gift, javaType, null);
		JsonNode restored = formatMapper.fromString(serialized, javaType, null);

		assertEquals(gift, restored);
	}
}
