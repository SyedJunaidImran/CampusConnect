package com.campusconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the CampusConnect backend application.
 *
 * @SpringBootApplication is a shortcut that combines three annotations:
 * 1. @Configuration — marks this class as a source of bean definitions
 * 2. @EnableAutoConfiguration — tells Spring Boot to auto-configure based on dependencies
 * 3. @ComponentScan — tells Spring to scan this package (and sub-packages) for components
 *
 * When you run this class, Spring Boot:
 * - Starts an embedded Tomcat server on port 8080
 * - Connects to MySQL using application.properties
 * - Creates/updates database tables based on our @Entity classes
 * - Registers all our controllers, services, and repositories
 */
@SpringBootApplication
public class CampusConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusConnectApplication.class, args);
    }
}
