# Backend Dockerfile - Spring MVC (embedded Tomcat)
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the WAR
RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S okane && adduser -S okane -G okane

# Copy the built WAR
COPY --from=builder /app/target/backend.war ./app.war

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R okane:okane /app

USER okane

EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV DB_URL=jdbc:mysql://mysql:3306/okane_transfer?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
ENV DB_USERNAME=root
ENV DB_PASSWORD=okane_password
ENV JWT_SECRET=OkaneTransferJwtSecretKeyChangeThisBeforeProduction-1234567890
ENV JWT_ISSUER="Okane Transfer"
ENV JWT_ACCESS_TOKEN_MINUTES=60
ENV JWT_REFRESH_TOKEN_DAYS=7
ENV FRONTEND_ALLOWED_ORIGINS=http://localhost,https://localhost
ENV AUTH_LOGIN_MAX_ATTEMPTS=5
ENV AUTH_LOGIN_WINDOW_MINUTES=10
ENV UPLOAD_DIR=/app/uploads
ENV UPLOAD_MAX_SIZE_MB=5

# Run with embedded Tomcat via Main class
ENTRYPOINT ["java", "-jar", "app.war"]
