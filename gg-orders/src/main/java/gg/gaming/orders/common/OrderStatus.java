package gg.gaming.orders.common;

/**
 * Order lifecycle (gg-docs/02-business-logic UC-05 state diagram). The saga drives the transitions;
 * Milestone B only ever creates orders in {@link #PENDING}.
 */
public enum OrderStatus {
  PENDING,
  RESERVING,
  PAYING,
  CONFIRMED,
  FAILED
}
