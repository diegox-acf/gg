package gg.gaming.orders.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

  // open-in-view is disabled, so read paths eager-load line items for DTO mapping
  // outside the transaction.

  @EntityGraph(attributePaths = "lineItems")
  Optional<Order> findByIdempotencyKey(String idempotencyKey);

  @EntityGraph(attributePaths = "lineItems")
  Optional<Order> findWithItemsById(Long id);

  @EntityGraph(attributePaths = "lineItems")
  List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
}
