-- Seed stock for catalog products.
--
-- Inventory has no cross-DB visibility into the catalog, and the catalog products
-- id sequence is NOT reset on reseed, so we cannot assume ids are 1..N. We seed a
-- generous id range (1..1000) that comfortably covers all real product ids; phantom
-- rows for non-existent products are harmless (no FK; nothing reserves them).
--
-- The CASE gives a deterministic but varied distribution so reserve/insufficient
-- paths and the catalog's in/low/out-of-stock hints all have data to exercise.
INSERT INTO stock (product_id, available, reserved)
SELECT gs,
       CASE
           WHEN gs % 17 = 0 THEN 0               -- ~6%  out of stock
           WHEN gs % 7  = 0 THEN (gs % 5) + 1    -- ~14% low stock (1-5 units)
           ELSE 25 + (gs % 76)                   -- in stock (25-100 units)
       END,
       0
FROM generate_series(1, 1000) AS gs
ON CONFLICT (product_id) DO NOTHING;
