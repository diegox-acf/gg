package gg.gaming.orders.admin;

import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only order queries for the admin console (list + dashboard stats). */
@Service
public class AdminOrderService {

  private final OrderRepository orders;

  AdminOrderService(OrderRepository orders) {
    this.orders = orders;
  }

  @Transactional(readOnly = true)
  public PageResponse<OrderSummaryResponse> listOrders(
      OrderStatus status, Instant from, Instant to, Pageable pageable) {
    Page<Order> page = orders.findAll(filter(status, from, to), pageable);
    List<OrderSummaryResponse> items = page.map(OrderSummaryResponse::from).getContent();
    return new PageResponse<>(
        items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  /** Builds a predicate from only the non-null filters (Criteria omits the rest). */
  private static Specification<Order> filter(OrderStatus status, Instant from, Instant to) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      if (from != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
      }
      if (to != null) {
        predicates.add(cb.lessThan(root.get("createdAt"), to));
      }
      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  @Transactional(readOnly = true)
  public OrderStatsResponse stats(Instant startOfToday) {
    Map<String, Long> byStatus = new LinkedHashMap<>();
    // Seed every status at 0 so the dashboard always shows the full set.
    for (OrderStatus s : OrderStatus.values()) {
      byStatus.put(s.name(), 0L);
    }
    long total = 0;
    for (OrderRepository.StatusCount sc : orders.countByStatusGrouped()) {
      byStatus.put(sc.getStatus().name(), sc.getCount());
      total += sc.getCount();
    }
    long revenue = orders.sumConfirmedRevenueCents();
    long today = orders.countByCreatedAtGreaterThanEqual(startOfToday);
    return new OrderStatsResponse(total, byStatus, revenue, today);
  }
}
