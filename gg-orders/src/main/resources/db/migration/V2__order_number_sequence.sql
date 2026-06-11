-- Human-friendly order numbers GMR-YYYY-NNNNN (PD-06). A single global sequence
-- backs NNNNN; uniqueness holds across years (the year segment is cosmetic).
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
