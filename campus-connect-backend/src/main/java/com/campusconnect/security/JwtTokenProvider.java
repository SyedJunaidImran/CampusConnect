package com.campusconnect.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Handles all JWT (JSON Web Token) operations: creating, validating, and parsing tokens.
 *
 * WHAT IS A JWT?
 * A JWT is a string like: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIn0.abc123
 *
 * It has 3 parts separated by dots:
 * 1. HEADER  — algorithm used (HS256) and token type (JWT)
 * 2. PAYLOAD — the data we store (user email, expiration time)
 *              Also called "claims"
 * 3. SIGNATURE — a hash of (header + payload + secret key)
 *                This proves the token hasn't been tampered with
 *
 * HOW JWT AUTH WORKS (stateless):
 * 1. User logs in → server creates a JWT signed with a secret key → sends it back
 * 2. Client stores the JWT (in localStorage) and sends it with every request
 *    via the Authorization header: "Bearer eyJhbG..."
 * 3. Server receives the request → extracts the JWT → verifies the signature
 *    → extracts the email → loads the user → allows/denies the request
 *
 * WHY IS IT "STATELESS"?
 * The server doesn't store sessions in memory. All the info needed to identify
 * the user is IN the token itself. This means any server instance can validate
 * the token — great for scaling.
 *
 * @Value reads from application.properties:
 *   app.jwt.secret → the signing key
 *   app.jwt.expiration-ms → how long the token is valid
 */
@Component
public class JwtTokenProvider {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey secretKey;
    private final long jwtExpirationMs;

    /**
     * Constructor — initializes the signing key from the configured secret.
     *
     * We decode the secret string to bytes and create an HMAC-SHA key.
     * The key must be at least 256 bits (32 characters) for HS256 algorithm.
     */
    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-ms}") long jwtExpirationMs
    ) {
        byte[] keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.jwtExpirationMs = jwtExpirationMs;
    }

    /**
     * Generate a JWT token after successful authentication.
     *
     * @param authentication the authenticated user's details (from Spring Security)
     * @return a signed JWT string
     */
    public String generateToken(Authentication authentication) {
        String email = authentication.getName(); // email is the "username" in our system
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(email)          // "sub" claim — who this token belongs to
                .issuedAt(now)           // "iat" claim — when the token was created
                .expiration(expiryDate)  // "exp" claim — when the token expires
                .signWith(secretKey)     // sign with our secret key
                .compact();              // build the final token string
    }

    /**
     * Extract the email (subject) from a JWT token.
     *
     * @param token the JWT string (without "Bearer " prefix)
     * @return the email stored in the token's subject claim
     */
    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)   // verify the signature first
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();           // extract the "sub" claim
    }

    /**
     * Validate a JWT token — checks signature and expiration.
     *
     * @param token the JWT string to validate
     * @return true if the token is valid, false if it's expired or tampered with
     */
    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SignatureException ex) {
            log.warn("Invalid JWT signature: {}", ex.getClass().getSimpleName());
        } catch (MalformedJwtException ex) {
            log.warn("Invalid JWT token format: {}", ex.getClass().getSimpleName());
        } catch (ExpiredJwtException ex) {
            log.warn("JWT token is expired");
        } catch (UnsupportedJwtException ex) {
            log.warn("JWT token is unsupported: {}", ex.getClass().getSimpleName());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty: {}", ex.getClass().getSimpleName());
        } catch (JwtException ex) {
            log.warn("JWT token processing error: {}", ex.getClass().getSimpleName());
        }
        return false;
    }
}
