package com.campusconnect.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class ProductionConfigValidatorTest {

    @Test
    @DisplayName("validateProductionConfig should succeed with complete valid production properties")
    void testValidProductionConfig() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "SuperSecureProductionKeyThatIsAtLeast32CharsLong2024!");
        ReflectionTestUtils.setField(validator, "dbUrl", "jdbc:mysql://production-host:3306/campus_connect");
        ReflectionTestUtils.setField(validator, "dbUsername", "cloud_admin");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://campusconnect.vercel.app");

        assertDoesNotThrow(validator::validateProductionConfig);
    }

    @Test
    @DisplayName("validateProductionConfig should fail if JWT_SECRET is missing")
    void testMissingJwtSecret() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "");
        ReflectionTestUtils.setField(validator, "dbUrl", "jdbc:mysql://host:3306/db");
        ReflectionTestUtils.setField(validator, "dbUsername", "user");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://campusconnect.vercel.app");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionConfig);
        assertTrue(ex.getMessage().contains("JWT_SECRET"));
    }

    @Test
    @DisplayName("validateProductionConfig should fail if default development JWT secret is used")
    void testDefaultJwtSecretRejection() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "CampusConnectSecretKeyForJwtSigningMustBeAtLeast32CharsLong2024");
        ReflectionTestUtils.setField(validator, "dbUrl", "jdbc:mysql://host:3306/db");
        ReflectionTestUtils.setField(validator, "dbUsername", "user");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://campusconnect.vercel.app");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionConfig);
        assertTrue(ex.getMessage().contains("default development JWT secret"));
    }

    @Test
    @DisplayName("validateProductionConfig should fail if JWT_SECRET is shorter than 32 characters")
    void testShortJwtSecret() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "short_secret_key");
        ReflectionTestUtils.setField(validator, "dbUrl", "jdbc:mysql://host:3306/db");
        ReflectionTestUtils.setField(validator, "dbUsername", "user");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://campusconnect.vercel.app");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionConfig);
        assertTrue(ex.getMessage().contains("at least 32 characters"));
    }

    @Test
    @DisplayName("validateProductionConfig should fail if DB_URL is missing or not MySQL")
    void testInvalidDbUrl() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "SuperSecureProductionKeyThatIsAtLeast32CharsLong2024!");
        ReflectionTestUtils.setField(validator, "dbUrl", "http://invalid-url");
        ReflectionTestUtils.setField(validator, "dbUsername", "user");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://campusconnect.vercel.app");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionConfig);
        assertTrue(ex.getMessage().contains("DB_URL"));
    }

    @Test
    @DisplayName("validateProductionConfig should fail if CORS_ALLOWED_ORIGINS is missing or wildcard")
    void testInvalidCorsOrigins() {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", "SuperSecureProductionKeyThatIsAtLeast32CharsLong2024!");
        ReflectionTestUtils.setField(validator, "dbUrl", "jdbc:mysql://host:3306/db");
        ReflectionTestUtils.setField(validator, "dbUsername", "user");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "*");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionConfig);
        assertTrue(ex.getMessage().contains("Wildcard '*'"));
    }
}
