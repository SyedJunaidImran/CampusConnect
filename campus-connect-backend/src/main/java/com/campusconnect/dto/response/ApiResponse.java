package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A generic wrapper for ALL API responses.
 *
 * Every endpoint in our API returns data in this consistent format:
 *
 * Success example:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": { "accessToken": "eyJhbG...", "role": "STUDENT" },
 *   "timestamp": "2026-08-16T12:00:00"
 * }
 *
 * Error example:
 * {
 *   "success": false,
 *   "message": "Email already registered",
 *   "data": null,
 *   "timestamp": "2026-08-16T12:00:00"
 * }
 *
 * WHY USE A WRAPPER?
 * Without it, every endpoint returns data in a different shape. The React frontend
 * would need special handling for each endpoint. With a wrapper, the frontend always
 * knows: check response.data.success, read response.data.message, etc.
 *
 * The <T> generic type means "data" can be any type — a User, a list, a token, etc.
 *
 * @JsonInclude(NON_NULL) — don't include fields that are null in the JSON output.
 * So if data is null (on errors), the JSON won't have a "data" key at all.
 */
@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    // Private constructor — use the static factory methods below instead
    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    /** Create a success response WITH data */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /** Create a success response WITHOUT data (e.g., for deletes) */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    /** Create an error response */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
