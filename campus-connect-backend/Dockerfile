# ============================================================
# Stage 1: Build Stage
# ============================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Pre-fetch dependencies to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production package
COPY src ./src
RUN mvn clean package -DskipTests

# ============================================================
# Stage 2: Production Runtime Stage
# ============================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Security: Create non-root system group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directory for file uploads with appropriate ownership
RUN mkdir -p /app/uploads/study-materials && chown -R appuser:appgroup /app

# Copy the compiled JAR artifact from the builder stage
COPY --from=builder /build/target/campus-connect-backend-*.jar /app/app.jar

# Run as non-root user
USER appuser

# Expose default HTTP port
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Launch Spring Boot with dynamic PORT support
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar /app/app.jar"]
