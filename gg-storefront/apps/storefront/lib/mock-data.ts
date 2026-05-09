// Field names match the catalog REST API schema.
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface Product {
  id: number
  brand: string
  name: string
  slug: string
  category_id: string
  price_cents: number
  currency: string
  stock_status: StockStatus
  specs: Record<string, string>
  sku: string
  description: string
}

export interface Category {
  id: string
  label: string
  icon: string
}

export const PRODUCTS: Product[] = [
  {
    id: 1, brand: 'ASUS ROG', name: 'GeForce RTX 4080 Super 16G',
    slug: 'asus-rog-rtx-4080-super-16g', category_id: 'gpus',
    price_cents: 84999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { VRAM: '16 GB GDDR6X', TDP: '320W', 'Boost Clock': '2535 MHz', Outputs: '3× DP, 1× HDMI' },
    sku: 'NV-RTX4080S-16G',
  },
  {
    id: 2, brand: 'MSI', name: 'GeForce RTX 4090 Gaming X Trio 24G',
    slug: 'msi-rtx-4090-gaming-x-trio-24g', category_id: 'gpus',
    price_cents: 159999, currency: 'USD', stock_status: 'low-stock', description: '',
    specs: { VRAM: '24 GB GDDR6X', TDP: '450W', 'Boost Clock': '2610 MHz', Outputs: '3× DP, 1× HDMI' },
    sku: 'NV-RTX4090-24G',
  },
  {
    id: 3, brand: 'Gigabyte', name: 'RX 7900 XTX Gaming OC 24G',
    slug: 'gigabyte-rx-7900-xtx-gaming-oc-24g', category_id: 'gpus',
    price_cents: 94999, currency: 'USD', stock_status: 'out-of-stock', description: '',
    specs: { VRAM: '24 GB GDDR6', TDP: '355W', 'Boost Clock': '2615 MHz', Outputs: '2× DP, 2× HDMI' },
    sku: 'AMD-RX7900XTX-24G',
  },
  {
    id: 4, brand: 'Intel', name: 'Core i9-14900K',
    slug: 'intel-core-i9-14900k', category_id: 'cpus',
    price_cents: 41999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { Cores: '24 (8P+16E)', 'Boost Clock': '6.0 GHz', TDP: '125W', Socket: 'LGA1700' },
    sku: 'INT-i9-14900K',
  },
  {
    id: 5, brand: 'AMD', name: 'Ryzen 9 7950X',
    slug: 'amd-ryzen-9-7950x', category_id: 'cpus',
    price_cents: 54999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { Cores: '16', 'Boost Clock': '5.7 GHz', TDP: '170W', Socket: 'AM5' },
    sku: 'AMD-R9-7950X',
  },
  {
    id: 6, brand: 'Corsair', name: 'K100 RGB Mechanical Keyboard',
    slug: 'corsair-k100-rgb-keyboard', category_id: 'peripherals',
    price_cents: 22999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { Switch: 'Cherry MX Speed Silver', Layout: 'Full (100%)', Connectivity: 'USB-C', Backlight: 'Per-key RGB' },
    sku: 'COR-K100-RGB',
  },
  {
    id: 7, brand: 'Logitech G', name: 'G Pro X Superlight 2',
    slug: 'logitech-g-pro-x-superlight-2', category_id: 'peripherals',
    price_cents: 15999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { Sensor: 'HERO 25K', DPI: '25,600', Weight: '60g', Connectivity: '2.4 GHz Wireless' },
    sku: 'LOG-GPXSL2',
  },
  {
    id: 8, brand: 'Samsung', name: '990 Pro NVMe SSD 2TB',
    slug: 'samsung-990-pro-nvme-ssd-2tb', category_id: 'storage',
    price_cents: 17999, currency: 'USD', stock_status: 'in-stock', description: '',
    specs: { Capacity: '2 TB', Interface: 'PCIe 4.0 ×4', 'Seq Read': '7,450 MB/s', 'Seq Write': '6,900 MB/s' },
    sku: 'SAM-990PRO-2TB',
  },
]

export const CATEGORIES: Category[] = [
  { id: 'gpus',         label: 'GPUs',         icon: '▣' },
  { id: 'cpus',         label: 'CPUs',         icon: '◈' },
  { id: 'motherboards', label: 'Motherboards', icon: '⊞' },
  { id: 'memory',       label: 'Memory',       icon: '▤' },
  { id: 'storage',      label: 'Storage',      icon: '◫' },
  { id: 'peripherals',  label: 'Peripherals',  icon: '◎' },
  { id: 'cases',        label: 'Cases',        icon: '□' },
  { id: 'cooling',      label: 'Cooling',      icon: '◌' },
]

export const FEATURED_PRODUCTS = PRODUCTS.slice(0, 8)
