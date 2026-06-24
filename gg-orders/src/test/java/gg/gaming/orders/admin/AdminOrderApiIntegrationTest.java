package gg.gaming.orders.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.gaming.orders.TestcontainersConfiguration;
import gg.gaming.orders.common.OrderStatus;
import gg.gaming.orders.order.Order;
import gg.gaming.orders.order.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin read API + the {@code /admin/**} role guard. Orders are seeded straight through the
 * repository (no saga) so the read endpoints are exercised in isolation. Each test rolls back.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminOrderApiIntegrationTest {

  private static final String ROLES = "X-User-Roles";

  @Autowired private MockMvc mvc;
  @Autowired private OrderRepository orders;

  @BeforeEach
  void seed() {
    save("GMR-2026-90001", "admin-it-confirmed", OrderStatus.CONFIRMED, 22_599);
    save("GMR-2026-90002", "admin-it-paying", OrderStatus.PAYING, 1_000);
  }

  private void save(String number, String key, OrderStatus status, long total) {
    Order o = new Order(number, "user-x", key, "USD");
    o.setShippingAddress("Jane", "1 Main St", null, "LA", "CA", "90001", "US");
    o.setAmounts(total, 0, 0);
    o.setStatus(status);
    orders.save(o);
  }

  @Test
  void listRequiresAdminRole() throws Exception {
    mvc.perform(get("/admin/orders")).andExpect(status().isForbidden());
    mvc.perform(get("/admin/orders").header(ROLES, "customer")).andExpect(status().isForbidden());
  }

  @Test
  void statsRequiresAdminRole() throws Exception {
    mvc.perform(get("/admin/orders/stats")).andExpect(status().isForbidden());
  }

  @Test
  void listsAllOrdersForAdmin() throws Exception {
    mvc.perform(get("/admin/orders").header(ROLES, "customer,admin"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total_elements").value(2))
        .andExpect(jsonPath("$.items.length()").value(2));
  }

  @Test
  void filtersByStatus() throws Exception {
    mvc.perform(get("/admin/orders").param("status", "confirmed").header(ROLES, "admin"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total_elements").value(1))
        .andExpect(jsonPath("$.items[0].status").value("CONFIRMED"))
        .andExpect(jsonPath("$.items[0].total_cents").value(22_599));
  }

  @Test
  void invalidStatusIsBadRequest() throws Exception {
    mvc.perform(get("/admin/orders").param("status", "bogus").header(ROLES, "admin"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void statsAggregateCountsAndRevenue() throws Exception {
    mvc.perform(get("/admin/orders/stats").header(ROLES, "admin"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total_orders").value(2))
        .andExpect(jsonPath("$.by_status.CONFIRMED").value(1))
        .andExpect(jsonPath("$.by_status.PAYING").value(1))
        .andExpect(jsonPath("$.revenue_cents").value(22_599));
  }
}
