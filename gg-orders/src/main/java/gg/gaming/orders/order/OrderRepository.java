package gg.gaming.orders.order;

import gg.gaming.orders.common.OrderStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository
    extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

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

  // ── Admin read model (gg-admin console). The paginated list uses
  //    JpaSpecificationExecutor.findAll(Specification, Pageable) (see AdminOrderService) so
  //    null filters are simply omitted — avoids the untyped-null-parameter problem. Line
  //    items are not fetched: the list is a summary, which also keeps pagination off the
  //    collection join. ──

  /** Order counts grouped by status (dashboard metric). */
  @Query("SELECT o.status AS status, COUNT(o) AS count FROM Order o GROUP BY o.status")
  List<StatusCount> countByStatusGrouped();

  /** Total revenue = sum of totals over CONFIRMED (paid) orders. */
  @Query(
      "SELECT COALESCE(SUM(o.totalCents), 0) FROM Order o "
          + "WHERE o.status = gg.gaming.orders.common.OrderStatus.CONFIRMED")
  long sumConfirmedRevenueCents();

  long countByCreatedAtGreaterThanEqual(Instant since);

  /** Projection for {@link #countByStatusGrouped()}. */
  interface StatusCount {
    OrderStatus getStatus();

    long getCount();
  }
}
