package com.letterweb.config;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class ClientIpResolver {

	private final List<String> trustedProxyIps;

	public ClientIpResolver(@Value("${letterweb.proxy.trusted-ips:}") String trustedProxyIps) {
		this.trustedProxyIps = Arrays.stream(trustedProxyIps.split(","))
				.map(String::trim)
				.filter(value -> !value.isEmpty())
				.map(ClientIpResolver::normalizeIp)
				.toList();
	}

	public String resolve(HttpServletRequest request) {
		String remoteAddress = normalizeIp(request.getRemoteAddr());
		if (!trustedProxyIps.contains(remoteAddress)) {
			return remoteAddress;
		}

		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor == null || forwardedFor.isBlank()) {
			return remoteAddress;
		}

		List<String> forwardedAddresses = Arrays.stream(forwardedFor.split(","))
				.map(String::trim)
				.map(ClientIpResolver::tryNormalizeIp)
				.toList();
		if (forwardedAddresses.stream().anyMatch(address -> address == null)) {
			return remoteAddress;
		}

		for (int index = forwardedAddresses.size() - 1; index >= 0; index--) {
			String address = forwardedAddresses.get(index);
			if (!trustedProxyIps.contains(address)) {
				return address;
			}
		}

		return remoteAddress;
	}

	private static String normalizeIp(String address) {
		String normalized = tryNormalizeIp(address);
		if (normalized == null) {
			throw new IllegalArgumentException("Endereço IP inválido.");
		}
		return normalized;
	}

	private static String tryNormalizeIp(String address) {
		if (address == null) {
			return null;
		}
		String value = address.trim();
		if (value.isEmpty() || value.contains("%")) {
			return null;
		}

		try {
			if (value.matches("\\d{1,3}(\\.\\d{1,3}){3}")) {
				String[] parts = value.split("\\.");
				byte[] octets = new byte[4];
				for (int index = 0; index < parts.length; index++) {
					int octet = Integer.parseInt(parts[index]);
					if (octet > 255) {
						return null;
					}
					octets[index] = (byte) octet;
				}
				return InetAddress.getByAddress(octets).getHostAddress();
			}
			if (value.contains(":") && value.matches("[0-9a-fA-F:.]+")) {
				InetAddress parsed = InetAddress.getByName(value);
				return parsed.getHostAddress().toLowerCase();
			}
		}
		catch (NumberFormatException | UnknownHostException exception) {
			return null;
		}
		return null;
	}
}
