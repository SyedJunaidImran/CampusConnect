package com.campusconnect.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standard error response body.
 * This is what the client receives when something goes wrong.
 *
 * Example JSON:
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": ["Email is required", "Password must be at least 6 characters"],
 *   "timestamp": "2026-08-16T12:00:00"
 * }
 */
@Getter
@Setter
@AllArgsConstructor
public class ErrorDetails {

    private boolean success;
    private String message;
    private List<String> errors;
    private LocalDateTime timestamp;

    /** Constructor for single error (no list needed) */
    public ErrorDetails(String message) {
        this.success = false;
        this.message = message;
        this.errors = null;
        this.timestamp = LocalDateTime.now();
    }

    /** Constructor for validation errors (multiple field errors) */
    public ErrorDetails(String message, List<String> errors) {
        this.success = false;
        this.message = message;
        this.errors = errors;
        this.timestamp = LocalDateTime.now();
    }
}
