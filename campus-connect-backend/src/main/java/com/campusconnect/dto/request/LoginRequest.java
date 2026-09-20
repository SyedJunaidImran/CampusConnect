package com.campusconnect.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for login requests.
 *
 * WHAT IS A DTO?
 * DTO = Data Transfer Object. It's a simple class that carries data between
 * the client (React) and the server (Spring Boot).
 *
 * WHY NOT just use the User entity directly?
 * 1. The User entity has fields we don't want the client to set (id, createdAt, role).
 * 2. The User entity has fields we don't want to send back (password hash).
 * 3. DTOs let us validate input with @NotBlank, @Email, etc.
 * 4. If we change the database schema, the API contract stays stable.
 *
 * VALIDATION ANNOTATIONS:
 * @NotBlank — field cannot be null, empty, or whitespace only
 * @Email    — field must be a valid email format
 *
 * These are automatically checked when we use @Valid on the controller parameter.
 * If validation fails, Spring returns a 400 Bad Request with error details.
 */
@Getter
@Setter
@NoArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(max = 100, message = "Password must not exceed 100 characters")
    private String password;
}
