package gg.gaming.orders.admin;

import java.util.Map;

/** Dashboard metrics. Serialized snake_case. */
public record OrderStatsResponse(
    long totalOrders, Map<String, Long> byStatus, long revenueCents, long ordersToday) {}
