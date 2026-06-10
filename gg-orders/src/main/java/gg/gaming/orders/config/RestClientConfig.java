package gg.gaming.orders.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
class RestClientConfig {

  /**
   * RestClient pointed at Catalog. The OpenTelemetry Java agent instruments it, so the
   * Orders→Catalog hop joins the distributed trace automatically.
   */
  @Bean
  RestClient catalogRestClient(RestClient.Builder builder, CatalogProperties props) {
    return builder.baseUrl(props.baseUrl()).build();
  }
}
