package gg.gaming.orders.saga;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.order.OrderRepository;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class SagaRecoveryWorkerTest {

  private OrderRepository orders;
  private SagaOrchestrator saga;
  private SagaRecoveryWorker worker;

  @BeforeEach
  void setUp() {
    orders = mock(OrderRepository.class);
    saga = mock(SagaOrchestrator.class);
    worker = new SagaRecoveryWorker(orders, saga);
  }

  @Test
  void scansNonTerminalStatusesAndRecoversEach() {
    when(orders.findIdsByStatusIn(anyCollection())).thenReturn(List.of(1L, 2L, 3L));

    worker.recoverStuckOrders();

    // It asks only for non-terminal statuses.
    @SuppressWarnings("unchecked")
    ArgumentCaptor<Collection<OrderStatus>> statuses = ArgumentCaptor.forClass(Collection.class);
    verify(orders).findIdsByStatusIn(statuses.capture());
    org.assertj.core.api.Assertions.assertThat(statuses.getValue())
        .containsExactlyInAnyOrder(OrderStatus.PENDING, OrderStatus.RESERVING, OrderStatus.PAYING);

    verify(saga).recover(1L);
    verify(saga).recover(2L);
    verify(saga).recover(3L);
  }

  @Test
  void oneFailingOrderDoesNotBlockTheRest() {
    when(orders.findIdsByStatusIn(anyCollection())).thenReturn(List.of(1L, 2L, 3L));
    doThrow(new RuntimeException("boom")).when(saga).recover(2L);

    worker.recoverStuckOrders();

    verify(saga).recover(1L);
    verify(saga).recover(2L);
    verify(saga).recover(3L); // still reached despite #2 throwing
  }

  @Test
  void noStuckOrders_doesNothing() {
    when(orders.findIdsByStatusIn(anyCollection())).thenReturn(List.of());

    worker.recoverStuckOrders();

    verifyNoInteractions(saga);
  }

  @SuppressWarnings("unchecked")
  private static Collection<OrderStatus> anyCollection() {
    return org.mockito.ArgumentMatchers.any(Collection.class);
  }
}
