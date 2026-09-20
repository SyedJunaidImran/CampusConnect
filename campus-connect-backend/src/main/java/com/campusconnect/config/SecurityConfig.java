package com.campusconnect.config;

import com.campusconnect.security.CustomAccessDeniedHandler;
import com.campusconnect.security.JwtAuthEntryPoint;
import com.campusconnect.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Main Spring Security configuration.
 *
 * This class answers THREE questions:
 * 1. Which endpoints are public vs protected?
 * 2. How do we handle authentication errors?
 * 3. How do we hash passwords?
 *
 * KEY CONCEPTS:
 *
 * CSRF (Cross-Site Request Forgery):
 *   We DISABLE it because we use JWT tokens instead of cookies.
 *   CSRF protection is for cookie-based sessions — irrelevant for JWT APIs.
 *
 * Session Management:
 *   Set to STATELESS — the server doesn't create HTTP sessions.
 *   Every request must include a JWT token. This is the core of stateless auth.
 *
 * Filter Chain:
 *   We add our JwtAuthenticationFilter BEFORE Spring's default username/password filter.
 *   This means our JWT filter runs first on every request.
 *
 * @EnableMethodSecurity allows us to use @PreAuthorize("hasRole('ADMIN')") on
 * individual controller methods for fine-grained access control.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthEntryPoint authEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthEntryPoint authEntryPoint,
                          CustomAccessDeniedHandler accessDeniedHandler,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.authEntryPoint = authEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * The security filter chain — defines the security rules for all endpoints.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Enable CORS with configured CorsConfigurationSource
                .cors(Customizer.withDefaults())

                // 2. Disable CSRF (not needed for stateless JWT auth)
                .csrf(csrf -> csrf.disable())

                // 3. Set up exception handling (401 unauthenticated + 403 forbidden)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )

                // 4. HTTP Security Headers
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.sameOrigin())
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                )

                // 5. No sessions — every request must carry its own JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 6. Define which endpoints are public vs protected
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (health check, login & registration only)
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/register/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // Everything else (including /api/auth/me) requires authentication
                        .anyRequest().authenticated()
                );

        // 7. Add our JWT filter before Spring's default auth filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Password encoder — uses BCrypt hashing algorithm.
     *
     * BCrypt is a one-way hash: you can hash "password123" → "$2a$10$abc...",
     * but you CANNOT reverse it back to "password123".
     *
     * When a user logs in, BCrypt hashes the submitted password and compares
     * it with the stored hash. If they match → correct password.
     *
     * BCrypt also adds a random "salt" to each hash, so the same password
     * produces a different hash every time. This prevents rainbow table attacks.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication manager — used in AuthService to authenticate login requests.
     * Spring Boot auto-configures this; we just expose it as a bean.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
