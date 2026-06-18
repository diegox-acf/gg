package gg.gaming.orders.saga;

import static gg.gaming.orders.common.OrderStatus.PAYING;
import static gg.gaming.orders.common.OrderStatus.PENDING;
import static gg.gaming.orders.common.OrderStatus.RESERVING;

import gg.gaming.orders.order.OrderRepository;
import java.util.EnumSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Resumes orders left in a non-terminal state by a crash (Milestone D3). Runs on a fixed delay; the
 * first scan fires shortly after startup (Spring's scheduler runs a {@code fixedDelay} task
 * immediately), so a crash mid-saga heals without manual intervention. Each order is recovered
 * independently — one failure never blocks the rest.
 *
 * <p>The heavy lifting is in {@link SagaOrchestrator#recover}: reserve/pay are idempotent, and a
 * PAYING order is reconciled against Stripe (covering a missed webhook). Disable with {@code
 * orders.recovery.enabled=false}.
 */
@Component
@ConditionalOnProperty(prefix = "orders.recovery", name = "enabled", matchIfMissing = true)
public class SagaRecoveryWorker {

  private static final Logger log = LoggerFactory.getLogger(SagaRecoveryWorker.class);

  private final OrderRepository orders;
  private final SagaOrchestrator saga;

  public SagaRecoveryWorker(OrderRepository orders, SagaOrchestrator saga) {
    this.orders = orders;
    this.saga = saga;
  }

  @Scheduled(fixedDelayString = "${orders.recovery.scan-interval-ms}")
  public void recoverStuckOrders() {
    List<Long> ids = orders.findIdsByStatusIn(EnumSet.of(PENDING, RESERVING, PAYING));
    if (ids.isEmpty()) {
      return;
    }
    log.info("recovery scan — {} non-terminal order(s) to reconcile", ids.size());
    for (Long id : ids) {
      try {
        saga.recover(id);
      } catch (Exception e) {
        log.warn("recovery of order {} failed; will retry next scan", id, e);
      }
    }
  }
}
