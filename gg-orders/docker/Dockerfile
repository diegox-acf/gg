# syntax=docker/dockerfile:1

# ── Stage 1: build the boot jar ────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /src

# Cache the Gradle wrapper + dependency resolution as their own layers.
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# Fetch the OpenTelemetry Java agent (auto-instruments MVC, JDBC, RestClient).
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

# ── Stage 2: runtime ───────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /otel/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
COPY --from=builder /src/build/libs/*.jar /app/app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "-jar", "/app/app.jar"]
