package com.campusconnect.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String testSecret = "TestSecretKeyThatIsAtLeast32CharactersLongForHS256Algorithm2024!";
    private final long testExpirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(testSecret, testExpirationMs);
    }

    @Test
    @DisplayName("generateToken and getEmailFromToken should succeed for valid credentials")
    void testGenerateAndParseToken() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "student@campusconnect.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );

        String token = jwtTokenProvider.generateToken(auth);
        assertNotNull(token);
        assertFalse(token.isBlank());

        String email = jwtTokenProvider.getEmailFromToken(token);
        assertEquals("student@campusconnect.com", email);
    }

    @Test
    @DisplayName("validateToken should return true for valid token")
    void testValidateValidToken() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "faculty@campusconnect.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_FACULTY"))
        );

        String token = jwtTokenProvider.generateToken(auth);
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("validateToken should return false for null, empty or blank tokens")
    void testValidateEmptyTokens() {
        assertFalse(jwtTokenProvider.validateToken(null));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken("   "));
    }

    @Test
    @DisplayName("validateToken should return false for tampered token")
    void testValidateTamperedToken() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "admin@campusconnect.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        String token = jwtTokenProvider.generateToken(auth);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";
        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("validateToken should return false for expired token")
    void testValidateExpiredToken() {
        // Create a provider with immediate expiration (1 ms)
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(testSecret, 1);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "admin@campusconnect.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        String token = shortLivedProvider.generateToken(auth);
        try {
            Thread.sleep(10); // Wait for token to expire
        } catch (InterruptedException ignored) {}

        assertFalse(shortLivedProvider.validateToken(token));
    }
}
