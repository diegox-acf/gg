package gg.gaming.orders.outbox;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {}
