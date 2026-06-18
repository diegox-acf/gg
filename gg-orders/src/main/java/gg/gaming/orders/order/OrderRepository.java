package gg.gaming.orders.order;

import gg.gaming.orders.common.OrderStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {

  // open-in-view is disabled, so read paths eager-load line items for DTO mapping
  // outside the transaction.

  @EntityGraph(attributePaths = "lineItems")
  Optional<Order> findByIdempotencyKey(String idempotencyKey);

  @EntityGraph(attributePaths = "lineItems")
  Optional<Order> findWithItemsById(Long id);

  @EntityGraph(attributePaths = "lineItems")
  List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

  /** Ids of orders in the given statuses — the recovery worker's work set (non-terminal). */
  @Query("SELECT o.id FROM Order o WHERE o.status IN :statuses")
  List<Long> findIdsByStatusIn(Collection<OrderStatus> statuses);
}
