package com.campusconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter — runs on EVERY incoming HTTP request.
 *
 * This is the core of JWT-based authentication. Here's the flow:
 *
 * 1. React sends a request with header: "Authorization: Bearer eyJhbG..."
 * 2. This filter intercepts the request BEFORE it reaches the controller
 * 3. We extract the token from the header
 * 4. We validate the token (signature + expiration)
 * 5. We extract the email from the token
 * 6. We load the user from the database
 * 7. We tell Spring Security: "this user is authenticated"
 * 8. The request continues to the controller
 *
 * OncePerRequestFilter guarantees this filter runs exactly ONCE per request
 * (some filters can accidentally run multiple times due to internal dispatches).
 *
 * WHY SET SecurityContextHolder?
 * Spring Security checks SecurityContextHolder to decide if a user is authenticated.
 * If we set it here, downstream code (controllers, @PreAuthorize, etc.) can access
 * the authenticated user's details.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                   CustomUserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Step 1: Extract the JWT token from the "Authorization" header
        String token = getTokenFromRequest(request);

        // Step 2: If a token exists and it's valid, authenticate the user
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {

            // Step 3: Extract the email from the token
            String email = jwtTokenProvider.getEmailFromToken(token);

            // Step 4: Load the full user details from the database
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            // Step 5: Create an authentication token and set it in the security context
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,                // the authenticated user
                            null,                       // no credentials needed (JWT already verified)
                            userDetails.getAuthorities() // roles: ROLE_STUDENT, etc.
                    );

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Step 6: Tell Spring Security "this user is authenticated"
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Step 7: Continue the filter chain (pass to next filter or controller)
        filterChain.doFilter(request, response);
    }

    /**
     * Extract the JWT from the Authorization header.
     *
     * Expected format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
     * We strip "Bearer " and return just the token.
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix (7 characters)
        }
        return null;
    }
}
