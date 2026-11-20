package com.letterweb.config;

import org.hibernate.type.descriptor.WrapperOptions;
import org.hibernate.type.descriptor.java.JavaType;
import org.hibernate.type.format.FormatMapper;

import tools.jackson.databind.json.JsonMapper;

public class Jackson3JsonFormatMapper implements FormatMapper {

	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Override
	public <T> T fromString(CharSequence charSequence, JavaType<T> javaType, WrapperOptions wrapperOptions) {
		return objectMapper.readValue(charSequence.toString(), objectMapper.constructType(javaType.getJavaType()));
	}

	@Override
	public <T> String toString(T value, JavaType<T> javaType, WrapperOptions wrapperOptions) {
		return objectMapper.writeValueAsString(value);
	}
}
