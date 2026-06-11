package gg.gaming.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GgOrdersApplication {

  public static void main(String[] args) {
    SpringApplication.run(GgOrdersApplication.class, args);
  }
}
