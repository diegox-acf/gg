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

Object.assign(window, { PRODUCTS, CATEGORIES, STOCK_LABEL, STOCK_CLASS, cartStore });
