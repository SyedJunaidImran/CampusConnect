package com.campusconnect.controller;

import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.RegisterStudentRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.JwtAuthResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — REST endpoints for authentication.
 *
 * This is the top layer of our backend. It:
 * 1. Receives HTTP requests from React (via Axios)
 * 2. Validates the request body (@Valid)
 * 3. Delegates to AuthService (business logic)
 * 4. Returns the response with the correct HTTP status code
 *
 * ANNOTATIONS EXPLAINED:
 * @RestController — combines @Controller + @ResponseBody
 *   Means: "this class handles HTTP requests, and every method's return value
 *   is serialized to JSON and sent in the response body."
 *
 * @RequestMapping("/api/auth") — all endpoints in this controller start with /api/auth
 *
 * @PostMapping — handles HTTP POST requests (used for creating resources / login)
 * @GetMapping  — handles HTTP GET requests (used for reading data)
 *
 * @Valid — triggers validation on the request DTO. If any @NotBlank/@Email/@Size
 *          fails, Spring throws MethodArgumentNotValidException → 400 Bad Request.
 *
 * @RequestBody — tells Spring to deserialize the JSON request body into our DTO.
 *   When React sends: { "email": "john@test.com", "password": "123456" }
 *   Spring automatically creates a LoginRequest object with those values.
 *
 * ResponseEntity — lets us set both the response body AND the HTTP status code.
 *   ResponseEntity.ok(data) → 200 OK
 *   new ResponseEntity<>(data, HttpStatus.CREATED) → 201 Created
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register/student
     * Register a new student account.
     *
     * Request body: RegisterStudentRequest (validated)
     * Response: 201 Created with JWT token
     */
    @PostMapping("/register/student")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> registerStudent(
            @Valid @RequestBody RegisterStudentRequest request) {

        JwtAuthResponse authResponse = authService.registerStudent(request);

        return new ResponseEntity<>(
                ApiResponse.success("Student registered successfully", authResponse),
                HttpStatus.CREATED // 201 — a new resource was created
        );
    }

    /**
     * POST /api/auth/login
     * Login for all user types (student, faculty, admin).
     *
     * Request body: LoginRequest (email + password)
     * Response: 200 OK with JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        JwtAuthResponse authResponse = authService.login(request);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", authResponse)
        );
    }

    /**
     * GET /api/auth/me
     * Get the currently authenticated user's profile.
     *
     * This endpoint requires a valid JWT token in the Authorization header.
     * Spring Security's Authentication object is automatically injected —
     * it contains the user's email (extracted from the JWT by our filter).
     *
     * Response: 200 OK with user profile
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated"), HttpStatus.UNAUTHORIZED);
        }

        // authentication.getName() returns the email (set as "subject" in the JWT)
        UserResponse userResponse = authService.getCurrentUser(authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success("User profile retrieved successfully", userResponse)
        );
    }
}
