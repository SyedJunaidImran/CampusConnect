package com.campusconnect.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.campusconnect.exception.ErrorDetails;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Handles what happens when an UNAUTHENTICATED user tries to access a protected endpoint.
 *
 * Without this, Spring Security returns a default HTML error page.
 * Since we're building a REST API, we need to return JSON instead.
 *
 * WHEN DOES THIS TRIGGER?
 * - A request hits a protected endpoint (anything not /api/auth/**)
 * - The request has no JWT token, or the token is invalid
 * - Spring Security calls this entry point to send a 401 response
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        // Set response type to JSON (not HTML)
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Build our standard error response
        ErrorDetails error = new ErrorDetails(
                "You must be logged in to access this resource"
        );

        // Write JSON to the response body
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Register JavaTimeModule for LocalDateTime
        mapper.writeValue(response.getOutputStream(), error);
    }
}
