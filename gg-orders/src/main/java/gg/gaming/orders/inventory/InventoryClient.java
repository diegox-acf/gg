package gg.gaming.orders.inventory;

import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Reserves stock in Inventory over synchronous REST (ADR-018: reserve is request/response so the
 * saga gets an immediate yes/no before taking payment). Idempotent on {@code order-<id>} so a retry
 * or saga-recovery re-reserve is a no-op in Inventory. Commit/release are NOT done here — they
 * happen asynchronously when Inventory consumes the terminal {@code OrderConfirmed}/{@code
 * OrderFailed} events.
 */
@Component
public class InventoryClient {

  private final RestClient http;

  InventoryClient(RestClient inventoryRestClient) {
    this.http = inventoryRestClient;
  }

  /**
   * Reserves every item of the order atomically.
   *
   * @throws InsufficientStockException if Inventory returns 409 (a line item is out of stock)
   * @throws InventoryUnavailableException if Inventory is unreachable or errors otherwise
   */
  public void reserve(long orderId, List<ReserveItem> items) {
    try {
      http.post()
          .uri("/v1/reservations")
          .header("Idempotency-Key", "order-" + orderId)
          .contentType(MediaType.APPLICATION_JSON)
          .body(new ReserveRequest(orderId, items))
          .retrieve()
          .toBodilessEntity();
    } catch (RestClientResponseException e) {
      if (e.getStatusCode().value() == 409) {
        throw new InsufficientStockException(orderId);
      }
      throw new InventoryUnavailableException(
          "inventory returned " + e.getStatusCode() + " for order " + orderId, e);
    } catch (RestClientException e) {
      throw new InventoryUnavailableException("inventory request failed for order " + orderId, e);
    }
  }

  /** One line of a reserve request. Serialized snake_case (global Jackson setting). */
  public record ReserveItem(long productId, int quantity) {}

  private record ReserveRequest(long orderId, List<ReserveItem> items) {}
}
