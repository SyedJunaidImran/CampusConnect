package com.campusconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

/**
 * Public health check controller.
 *
 * Used by cloud deployment platforms, load balancers, and monitoring systems
 * (e.g., Render, Railway, AWS ECS, Kubernetes) to verify service availability.
 *
 * Security: This endpoint is unauthenticated and returns strictly minimal status
 * without exposing internal implementation details, database passwords, or env vars.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Collections.singletonMap("status", "UP"));
    }
}
