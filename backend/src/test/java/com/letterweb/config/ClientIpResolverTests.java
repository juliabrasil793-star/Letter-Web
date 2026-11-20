package com.letterweb.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

import jakarta.servlet.http.HttpServletRequest;

class ClientIpResolverTests {

	@Test
	void ignoresForwardedForFromUntrustedRemoteAddress() {
		ClientIpResolver resolver = new ClientIpResolver("");
		HttpServletRequest request = request("198.51.100.8", "203.0.113.99");

		assertEquals("198.51.100.8", resolver.resolve(request));
	}

	@Test
	void resolvesForwardedChainOnlyWhenImmediateProxyIsTrusted() {
		ClientIpResolver resolver = new ClientIpResolver("10.0.0.2, 10.0.0.3");
		HttpServletRequest request = request("10.0.0.3", "203.0.113.5, 10.0.0.2");

		assertEquals("203.0.113.5", resolver.resolve(request));
	}

	@Test
	void ignoresMalformedForwardedChain() {
		ClientIpResolver resolver = new ClientIpResolver("10.0.0.2");
		HttpServletRequest request = request("10.0.0.2", "203.0.113.5, unknown");

		assertEquals("10.0.0.2", resolver.resolve(request));
	}

	private HttpServletRequest request(String remoteAddress, String forwardedFor) {
		HttpServletRequest request = mock(HttpServletRequest.class);
		when(request.getRemoteAddr()).thenReturn(remoteAddress);
		when(request.getHeader("X-Forwarded-For")).thenReturn(forwardedFor);
		return request;
	}
}
