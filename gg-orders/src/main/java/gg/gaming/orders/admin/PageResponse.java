package gg.gaming.orders.admin;

import java.util.List;

/** Minimal pagination envelope for admin list endpoints. Serialized snake_case. */
public record PageResponse<T>(
    List<T> items, int page, int size, long totalElements, int totalPages) {}
