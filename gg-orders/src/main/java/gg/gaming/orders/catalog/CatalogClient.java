package gg.gaming.orders.catalog;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/** Reads authoritative product data from Catalog over REST. */
@Component
public class CatalogClient {

  private final RestClient http;

  CatalogClient(RestClient catalogRestClient) {
    this.http = catalogRestClient;
  }

  /**
   * Fetches a single product. Catalog wraps it as {@code {"product": {...}}}.
   *
   * @throws CatalogProductNotFoundException if Catalog returns 404
   * @throws CatalogUnavailableException if Catalog is unreachable or errors otherwise
   */
  public CatalogProduct getProduct(long productId) {
    try {
      ProductEnvelope envelope =
          http.get().uri("/v1/products/{id}", productId).retrieve().body(ProductEnvelope.class);
      if (envelope == null || envelope.product() == null) {
        throw new CatalogUnavailableException("empty product response for id " + productId, null);
      }
      return envelope.product();
    } catch (RestClientResponseException e) {
      if (e.getStatusCode().value() == 404) {
        throw new CatalogProductNotFoundException(productId);
      }
      throw new CatalogUnavailableException(
          "catalog returned " + e.getStatusCode() + " for product " + productId, e);
    } catch (RestClientException e) {
      throw new CatalogUnavailableException("catalog request failed for product " + productId, e);
    }
  }

  private record ProductEnvelope(@JsonProperty("product") CatalogProduct product) {}
}
