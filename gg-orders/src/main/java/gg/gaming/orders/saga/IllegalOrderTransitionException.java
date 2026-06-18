package gg.gaming.orders.saga;

import gg.gaming.orders.common.OrderStatus;

/** A saga step attempted a status transition the state machine does not allow. */
class IllegalOrderTransitionException extends RuntimeException {

  IllegalOrderTransitionException(long orderId, OrderStatus from, OrderStatus to) {
    super("order " + orderId + ": illegal transition " + from + " -> " + to);
  }
}
