package com.campusconnect.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HealthControllerTest {

    private final HealthController healthController = new HealthController();

    @Test
    @DisplayName("GET /api/health should return HTTP 200 with status UP")
    void testHealthCheckEndpoint() {
        ResponseEntity<Map<String, String>> response = healthController.healthCheck();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
        // Confirm no secrets or database information leaked
        assertEquals(1, response.getBody().size());
    }
}
