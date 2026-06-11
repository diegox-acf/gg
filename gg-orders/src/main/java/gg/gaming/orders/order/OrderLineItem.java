package gg.gaming.orders.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * An ordered product, with price/name snapshotted from Catalog at order creation. Immutable after
 * creation.
 */
@Entity
@Table(name = "order_line_items")
public class OrderLineItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @Column(name = "product_id", nullable = false)
  private long productId;

  @Column(nullable = false)
  private String sku;

  @Column(name = "name_snapshot", nullable = false)
  private String nameSnapshot;

  @Column(name = "unit_price_cents", nullable = false)
  private long unitPriceCents;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "total_cents", nullable = false)
  private long totalCents;

  protected OrderLineItem() {
    // JPA
  }

  public OrderLineItem(
      long productId, String sku, String nameSnapshot, long unitPriceCents, int quantity) {
    this.productId = productId;
    this.sku = sku;
    this.nameSnapshot = nameSnapshot;
    this.unitPriceCents = unitPriceCents;
    this.quantity = quantity;
    this.totalCents = unitPriceCents * quantity;
  }

  void setOrder(Order order) {
    this.order = order;
  }

  public Long getId() {
    return id;
  }

  public long getProductId() {
    return productId;
  }

  public String getSku() {
    return sku;
  }

  public String getNameSnapshot() {
    return nameSnapshot;
  }

  public long getUnitPriceCents() {
    return unitPriceCents;
  }

  public int getQuantity() {
    return quantity;
  }

  public long getTotalCents() {
    return totalCents;
  }
}
