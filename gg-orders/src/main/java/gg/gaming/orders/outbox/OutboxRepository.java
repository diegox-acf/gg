package gg.gaming.orders.outbox;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {

  /**
   * Oldest-first batch of rows awaiting publish. {@code PESSIMISTIC_WRITE} plus the Hibernate
   * SKIP-LOCKED hint ({@code jakarta.persistence.lock.timeout = -2}) emits {@code FOR UPDATE SKIP
   * LOCKED} on Postgres, so multiple poller instances claim disjoint rows without blocking each
   * other. The lock is held until the surrounding transaction commits — by then the rows are
   * stamped published. {@link Limit} is a special parameter (not query-bound) that caps the batch.
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
  @Query("SELECT e FROM OutboxEvent e WHERE e.publishedAt IS NULL ORDER BY e.createdAt")
  List<OutboxEvent> findUnpublishedBatch(Limit limit);
}
