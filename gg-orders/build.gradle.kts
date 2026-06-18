plugins {
	java
	id("org.springframework.boot") version "3.5.14"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "7.0.4"
}

group = "gg.gaming"
version = "0.1.0"
description = "GG Gaming Orders service (saga orchestrator)"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	// Kafka — outbox poller publishes events; consumers arrive in Milestone D.
	implementation("org.springframework.kafka:spring-kafka")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.flywaydb:flyway-core")
	implementation("org.flywaydb:flyway-database-postgresql")
	runtimeOnly("org.postgresql:postgresql")

	// Stripe — PaymentIntent creation at PAYING + webhook signature verification (Milestone D2).
	implementation("com.stripe:stripe-java:33.0.0")

	// OpenTelemetry API — read the active trace id in app code to stamp outbox rows.
	// The runtime trace context is supplied by the OTel Java agent (-javaagent); this
	// is just the compile/link surface. BOM version stays at/below the agent's bundled
	// API (agent 2.28.x) so we never call a method the agent's SDK doesn't implement.
	implementation(platform("io.opentelemetry:opentelemetry-bom:1.50.0"))
	implementation("io.opentelemetry:opentelemetry-api")

	// Structured JSON logging with MDC (trace_id, order_id) for Loki.
	implementation("net.logstash.logback:logstash-logback-encoder:8.0")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	// Integration tests run against a real Postgres in Docker (no DB mocking).
	// Versions are managed by Spring Boot's BOM.
	testImplementation("org.springframework.boot:spring-boot-testcontainers")
	testImplementation("org.testcontainers:junit-jupiter")
	testImplementation("org.testcontainers:postgresql")
	testImplementation("org.testcontainers:kafka")
	testImplementation("org.springframework.kafka:spring-kafka-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()

	// Java Testcontainers can't auto-detect Docker Desktop's named pipe on Windows
	// (unlike testcontainers-go, it doesn't read the Docker CLI context). Point it at
	// the standard Docker Desktop pipe when DOCKER_HOST isn't already set. No-op on
	// Linux/CI, where the unix socket is auto-detected.
	if (System.getenv("DOCKER_HOST").isNullOrBlank() &&
		org.gradle.internal.os.OperatingSystem.current().isWindows) {
		environment("DOCKER_HOST", "npipe:////./pipe/dockerDesktopLinuxEngine")
	}
}

// Google Java Format — the build fails on style violations; `spotlessApply` fixes them.
spotless {
	java {
		googleJavaFormat("1.25.2")
		importOrder()
		removeUnusedImports()
		formatAnnotations()
		trimTrailingWhitespace()
		endWithNewline()
	}
}
