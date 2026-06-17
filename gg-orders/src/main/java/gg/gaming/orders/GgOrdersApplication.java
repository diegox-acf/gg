package gg.gaming.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling // outbox poller (Milestone C)
public class GgOrdersApplication {

  public static void main(String[] args) {
    SpringApplication.run(GgOrdersApplication.class, args);
  }
}
