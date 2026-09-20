package com.campusconnect.controller;

import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.JwtAuthResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class AuthControllerTest {

    private AuthController authController;

    static class StubAuthService extends AuthService {
        public StubAuthService() {
            super(null, null, null, null, null, null, null);
        }

        @Override
        public JwtAuthResponse login(LoginRequest request) {
            if ("wrongpassword".equals(request.getPassword())) {
                throw new BadCredentialsException("Invalid email or password");
            }
            return new JwtAuthResponse(
                    "dummy.jwt.token",
                    "ADMIN",
                    "System Admin",
                    "admin@campusconnect.com"
            );
        }

        @Override
        public UserResponse getCurrentUser(String email) {
            return new UserResponse(
                    2L,
                    email,
                    "Alex Johnson",
                    "STUDENT",
                    "CS2024001",
                    "Computer Science",
                    3,
                    2024,
                    "+91 9876543210",
                    null,
                    null
            );
        }
    }

    @BeforeEach
    void setUp() {
        authController = new AuthController(new StubAuthService());
    }

    @Test
    @DisplayName("login should return 200 OK with JWT token for valid credentials")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@campusconnect.com");
        request.setPassword("admin123");

        ResponseEntity<ApiResponse<JwtAuthResponse>> response = authController.login(request);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("dummy.jwt.token", response.getBody().getData().getAccessToken());
    }

    @Test
    @DisplayName("login should propagate BadCredentialsException for invalid credentials")
    void testLoginBadCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@campusconnect.com");
        request.setPassword("wrongpassword");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authController.login(request));
        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @DisplayName("getCurrentUser should return current authenticated user profile")
    void testGetCurrentUser() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "student@campusconnect.com",
                "credentials",
                Collections.emptyList()
        );

        ResponseEntity<ApiResponse<UserResponse>> response = authController.getCurrentUser(auth);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Alex Johnson", response.getBody().getData().getFullName());
    }
}
