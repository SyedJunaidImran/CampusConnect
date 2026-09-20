package com.campusconnect.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Validates critical production configuration on application startup.
 *
 * This validator ONLY runs when the 'prod' profile is active.
 * If any mandatory production environment variable is missing, invalid,
 * or using a development default, the application fails to start immediately
 * with a clear error message rather than running with an insecure configuration.
 */
@Component
@Profile("prod")
public class ProductionConfigValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionConfigValidator.class);
    private static final String DEV_JWT_FALLBACK = "CampusConnectSecretKeyForJwtSigningMustBeAtLeast32CharsLong2024";

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${app.cors.allowed-origins:}")
    private String corsAllowedOrigins;

    @PostConstruct
    public void validateProductionConfig() {
        log.info("Running ProductionConfigValidator for 'prod' profile...");

        // 1. Validate JWT Secret
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: JWT_SECRET environment variable is missing. " +
                    "Generate a secure 256-bit (at least 32 characters) key and set the JWT_SECRET environment variable."
            );
        }

        if (DEV_JWT_FALLBACK.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: The default development JWT secret was provided in production. " +
                    "You must supply a unique, secure JWT_SECRET environment variable in production."
            );
        }

        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters (256 bits) long. " +
                    "Current key length is " + jwtSecret.length() + " characters."
            );
        }

        // 2. Validate Database URL
        if (dbUrl == null || dbUrl.isBlank()) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: DB_URL environment variable is missing. " +
                    "Set DB_URL to your production MySQL JDBC connection string (e.g. jdbc:mysql://host:port/dbname)."
            );
        }

        if (!dbUrl.startsWith("jdbc:mysql:")) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: DB_URL must be a valid MySQL JDBC URL starting with 'jdbc:mysql:'."
            );
        }

        // 3. Validate Database Username
        if (dbUsername == null || dbUsername.isBlank()) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: DB_USERNAME environment variable is missing."
            );
        }

        // 4. Validate CORS Allowed Origins
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: CORS_ALLOWED_ORIGINS environment variable is missing. " +
                    "Set CORS_ALLOWED_ORIGINS to your deployed frontend URL (e.g. https://campusconnect.vercel.app)."
            );
        }

        if (corsAllowedOrigins.contains("*")) {
            throw new IllegalStateException(
                    "PRODUCTION CONFIGURATION ERROR: Wildcard '*' origin is not allowed when credentials are true. " +
                    "Specify exact domain(s) in CORS_ALLOWED_ORIGINS."
            );
        }

        log.info("Production configuration validation PASSED.");
    }
}
