package gg.gaming.orders.payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, Long> {

  boolean existsByStripeEventId(String stripeEventId);
}
