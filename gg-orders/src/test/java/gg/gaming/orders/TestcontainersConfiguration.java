package gg.gaming.orders;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Spins a real Postgres for tests and wires it into Spring via {@code @ServiceConnection} — no
 * mocked datasource. Flyway runs against it on context startup, so the migrations are exercised by
 * every {@code @SpringBootTest}.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

  @Bean
  @ServiceConnection
  PostgreSQLContainer<?> postgresContainer() {
    return new PostgreSQLContainer<>("postgres:17-alpine");
  }
}
