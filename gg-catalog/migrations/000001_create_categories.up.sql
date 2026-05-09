CREATE TABLE IF NOT EXISTS categories (
    id         TEXT        PRIMARY KEY,
    slug       TEXT        NOT NULL UNIQUE,
    label      TEXT        NOT NULL,
    icon       TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (id, slug, label, icon) VALUES
    ('gpus',         'gpus',         'GPUs',         '▣'),
    ('cpus',         'cpus',         'CPUs',         '◈'),
    ('motherboards', 'motherboards', 'Motherboards', '⊞'),
    ('memory',       'memory',       'Memory',       '▤'),
    ('storage',      'storage',      'Storage',      '◫'),
    ('peripherals',  'peripherals',  'Peripherals',  '◎'),
    ('cases',        'cases',        'Cases',        '□'),
    ('cooling',      'cooling',      'Cooling',      '◌')
ON CONFLICT (id) DO NOTHING;
