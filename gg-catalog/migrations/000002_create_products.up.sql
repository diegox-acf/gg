CREATE TABLE IF NOT EXISTS products (
    id          BIGSERIAL   PRIMARY KEY,
    sku         TEXT        NOT NULL UNIQUE,
    slug        TEXT        NOT NULL UNIQUE,
    name        TEXT        NOT NULL,
    brand       TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    category_id TEXT        NOT NULL REFERENCES categories(id),
    price_cents BIGINT      NOT NULL CHECK (price_cents >= 0),
    currency    TEXT        NOT NULL DEFAULT 'USD',
    specs       JSONB       NOT NULL DEFAULT '{}',
    stock_status TEXT       NOT NULL DEFAULT 'in-stock'
                            CHECK (stock_status IN ('in-stock', 'low-stock', 'out-of-stock')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON products (sku);

-- Seed data: 8 representative products (mirrors storefront mock data)
INSERT INTO products (sku, slug, name, brand, category_id, price_cents, specs, stock_status) VALUES
('NV-RTX4080S-16G',  'asus-rog-rtx-4080-super-16g',       'GeForce RTX 4080 Super 16G',       'ASUS ROG',   'gpus',        84999, '{"VRAM":"16 GB GDDR6X","TDP":"320W","Boost Clock":"2535 MHz","Outputs":"3× DP, 1× HDMI"}', 'in-stock'),
('NV-RTX4090-24G',   'msi-rtx-4090-gaming-x-trio-24g',    'GeForce RTX 4090 Gaming X Trio 24G','MSI',        'gpus',       159999, '{"VRAM":"24 GB GDDR6X","TDP":"450W","Boost Clock":"2610 MHz","Outputs":"3× DP, 1× HDMI"}', 'low-stock'),
('AMD-RX7900XTX-24G','gigabyte-rx-7900-xtx-gaming-oc-24g','RX 7900 XTX Gaming OC 24G',        'Gigabyte',   'gpus',        94999, '{"VRAM":"24 GB GDDR6","TDP":"355W","Boost Clock":"2615 MHz","Outputs":"2× DP, 2× HDMI"}',  'out-of-stock'),
('INT-i9-14900K',    'intel-core-i9-14900k',              'Core i9-14900K',                   'Intel',      'cpus',        41999, '{"Cores":"24 (8P+16E)","Boost Clock":"6.0 GHz","TDP":"125W","Socket":"LGA1700"}',           'in-stock'),
('AMD-R9-7950X',     'amd-ryzen-9-7950x',                 'Ryzen 9 7950X',                    'AMD',        'cpus',        54999, '{"Cores":"16","Boost Clock":"5.7 GHz","TDP":"170W","Socket":"AM5"}',                       'in-stock'),
('COR-K100-RGB',     'corsair-k100-rgb-keyboard',         'K100 RGB Mechanical Keyboard',     'Corsair',    'peripherals', 22999, '{"Switch":"Cherry MX Speed Silver","Layout":"Full (100%)","Connectivity":"USB-C","Backlight":"Per-key RGB"}', 'in-stock'),
('LOG-GPXSL2',       'logitech-g-pro-x-superlight-2',     'G Pro X Superlight 2',             'Logitech G', 'peripherals', 15999, '{"Sensor":"HERO 25K","DPI":"25,600","Weight":"60g","Connectivity":"2.4 GHz Wireless"}',     'in-stock'),
('SAM-990PRO-2TB',   'samsung-990-pro-nvme-ssd-2tb',      '990 Pro NVMe SSD 2TB',             'Samsung',    'storage',     17999, '{"Capacity":"2 TB","Interface":"PCIe 4.0 ×4","Seq Read":"7,450 MB/s","Seq Write":"6,900 MB/s"}', 'in-stock')
ON CONFLICT (sku) DO NOTHING;
