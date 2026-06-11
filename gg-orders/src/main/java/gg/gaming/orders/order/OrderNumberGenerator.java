package gg.gaming.orders.order;

import java.time.Year;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Produces human-friendly order numbers {@code GMR-YYYY-NNNNN} (PD-06). */
@Component
class OrderNumberGenerator {

  private final JdbcTemplate jdbc;

  OrderNumberGenerator(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  String next() {
    Long seq = jdbc.queryForObject("SELECT nextval('order_number_seq')", Long.class);
    return String.format("GMR-%d-%05d", Year.now().getValue(), seq);
  }
}
