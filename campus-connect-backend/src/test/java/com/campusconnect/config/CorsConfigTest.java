package com.campusconnect.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    @DisplayName("corsConfigurationSource should parse comma-separated origins and configure headers")
    void testCorsConfiguration() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", "https://campusconnect.vercel.app, http://localhost:5173");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        assertNotNull(source);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        assertNotNull(config.getAllowedOriginPatterns());
        assertEquals(2, config.getAllowedOriginPatterns().size());
        assertTrue(config.getAllowedOriginPatterns().contains("https://campusconnect.vercel.app"));
        assertTrue(config.getAllowedOriginPatterns().contains("http://localhost:5173"));

        assertTrue(config.getAllowCredentials());
        assertTrue(config.getAllowedMethods().contains("GET"));
        assertTrue(config.getAllowedMethods().contains("POST"));
        assertTrue(config.getAllowedMethods().contains("OPTIONS"));
        assertEquals(3600L, config.getMaxAge());
    }
}
