// GG Gaming — Shared Data & State
// Exported to window for cross-file access

const PRODUCTS = [
  { id: 1, brand: 'ASUS ROG', name: 'GeForce RTX 4080 Super 16G', category: 'gpus', price: 849.99, stock: 'in-stock', specs: { VRAM: '16 GB GDDR6X', TDP: '320W', 'Boost Clock': '2535 MHz', Outputs: '3× DP, 1× HDMI' }, sku: 'NV-RTX4080S-16G' },
  { id: 2, brand: 'MSI', name: 'GeForce RTX 4090 Gaming X Trio 24G', category: 'gpus', price: 1599.99, stock: 'low-stock', specs: { VRAM: '24 GB GDDR6X', TDP: '450W', 'Boost Clock': '2610 MHz', Outputs: '3× DP, 1× HDMI' }, sku: 'NV-RTX4090-24G' },
  { id: 3, brand: 'Gigabyte', name: 'RX 7900 XTX Gaming OC 24G', category: 'gpus', price: 949.99, stock: 'out-of-stock', specs: { VRAM: '24 GB GDDR6', TDP: '355W', 'Boost Clock': '2615 MHz', Outputs: '2× DP, 2× HDMI' }, sku: 'AMD-RX7900XTX-24G' },
  { id: 4, brand: 'Intel', name: 'Core i9-14900K', category: 'cpus', price: 419.99, stock: 'in-stock', specs: { Cores: '24 (8P+16E)', 'Boost Clock': '6.0 GHz', TDP: '125W', Socket: 'LGA1700' }, sku: 'INT-i9-14900K' },
  { id: 5, brand: 'AMD', name: 'Ryzen 9 7950X', category: 'cpus', price: 549.99, stock: 'in-stock', specs: { Cores: '16', 'Boost Clock': '5.7 GHz', TDP: '170W', Socket: 'AM5' }, sku: 'AMD-R9-7950X' },
  { id: 6, brand: 'Corsair', name: 'K100 RGB Mechanical Keyboard', category: 'peripherals', price: 229.99, stock: 'in-stock', specs: { Switch: 'Cherry MX Speed Silver', Layout: 'Full (100%)', Connectivity: 'USB-C', Backlight: 'Per-key RGB' }, sku: 'COR-K100-RGB' },
  { id: 7, brand: 'Logitech G', name: 'G Pro X Superlight 2', category: 'peripherals', price: 159.99, stock: 'in-stock', specs: { Sensor: 'HERO 25K', DPI: '25,600', Weight: '60g', Connectivity: '2.4 GHz Wireless' }, sku: 'LOG-GPXSL2' },
  { id: 8, brand: 'Samsung', name: '990 Pro NVMe SSD 2TB', category: 'storage', price: 179.99, stock: 'in-stock', specs: { Capacity: '2 TB', Interface: 'PCIe 4.0 ×4', 'Seq Read': '7,450 MB/s', 'Seq Write': '6,900 MB/s' }, sku: 'SAM-990PRO-2TB' },
];

const CATEGORIES = [
  { id: 'gpus', label: 'GPUs', icon: '▣' },
  { id: 'cpus', label: 'CPUs', icon: '◈' },
  { id: 'motherboards', label: 'Motherboards', icon: '⊞' },
  { id: 'memory', label: 'Memory', icon: '▤' },
  { id: 'storage', label: 'Storage', icon: '◫' },
  { id: 'peripherals', label: 'Peripherals', icon: '◎' },
  { id: 'cases', label: 'Cases', icon: '□' },
  { id: 'cooling', label: 'Cooling', icon: '◌' },
];

const STOCK_LABEL = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };
const STOCK_CLASS = { 'in-stock': 'badge-success', 'low-stock': 'badge-warning', 'out-of-stock': 'badge-danger' };

// Global cart state (simple array of {product, qty})
const createCartStore = () => {
  let items = [];
  let listeners = [];
  const notify = () => listeners.forEach(fn => fn([...items]));
  return {
    subscribe: fn => { listeners.push(fn); fn([...items]); return () => { listeners = listeners.filter(l => l !== fn); }; },
    add: (product) => {
      const ex = items.find(i => i.product.id === product.id);
      if (ex) ex.qty++; else items.push({ product, qty: 1 });
      notify();
    },
    update: (productId, qty) => {
      if (qty <= 0) items = items.filter(i => i.product.id !== productId);
      else { const ex = items.find(i => i.product.id === productId); if (ex) ex.qty = qty; }
      notify();
    },
    remove: (productId) => { items = items.filter(i => i.product.id !== productId); notify(); },
    clear: () => { items = []; notify(); },
    get: () => [...items],
  };
};

const cartStore = createCartStore();

/* ── Theming helpers (shared across files) ── */
function hexToGlow(hex, alpha = 0.22) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const COLOR_PRESETS = [
  { label: 'Toxic Yellow', value: '#d4ff00' },
  { label: 'Volt Green',   value: '#00ff88' },
  { label: 'Cyber Cyan',   value: '#00e5ff' },
  { label: 'Plasma Blue',  value: '#4a8bff' },
  { label: 'Hot Magenta',  value: '#ff00cc' },
  { label: 'Synth Purple', value: '#a855f7' },
  { label: 'Neon Coral',   value: '#ff3d57' },
  { label: 'Inferno',      value: '#ff6600' },
  { label: 'Solar Gold',   value: '#ffb800' },
  { label: 'Off-White',    value: '#f0f0ec' },
];

/* ── Image map: product-category → atmospheric photo ── */
/* Using Unsplash photo-ID pattern. onError swaps in a CSS gradient. */
const IMG = {
  hero:        'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=1800&q=80&auto=format&fit=crop',
  heroAlt:     'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1800&q=80&auto=format&fit=crop',
  gpu:         'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=900&q=80&auto=format&fit=crop',
  cpu:         'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=900&q=80&auto=format&fit=crop',
  motherboard: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80&auto=format&fit=crop',
  memory:      'https://images.unsplash.com/photo-1562976540-1502c2145186?w=900&q=80&auto=format&fit=crop',
  storage:     'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=900&q=80&auto=format&fit=crop',
  peripherals: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=900&q=80&auto=format&fit=crop',
  keyboard:    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&q=80&auto=format&fit=crop',
  mouse:       'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=900&q=80&auto=format&fit=crop',
  cases:       'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=900&q=80&auto=format&fit=crop',
  cooling:     'https://images.unsplash.com/photo-1623934199716-dc28818a8bdc?w=900&q=80&auto=format&fit=crop',
  gallery1:    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80&auto=format&fit=crop',
  gallery2:    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&q=80&auto=format&fit=crop',
  gallery3:    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=80&auto=format&fit=crop',
};

function imageForProduct(product) {
  // Per-product overrides by name keyword first, then category
  const n = (product.name || '').toLowerCase();
  if (n.includes('keyboard')) return IMG.keyboard;
  if (n.includes('mouse') || n.includes('superlight')) return IMG.mouse;
  return IMG[product.category] || IMG.gpu;
}

Object.assign(window, {
  PRODUCTS, CATEGORIES, STOCK_LABEL, STOCK_CLASS, cartStore,
  hexToGlow, COLOR_PRESETS, IMG, imageForProduct,
});
