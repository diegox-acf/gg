export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface MockProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  stockStatus: StockStatus;
  specs?: Record<string, string>;
}

export interface MockCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  productCount: number;
  icon: string;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "1", slug: "gpus", name: "GPUs", description: "Graphics cards for gaming and creation", productCount: 24, icon: "▣" },
  { id: "2", slug: "cpus", name: "CPUs", description: "Processors from AMD and Intel", productCount: 18, icon: "◈" },
  { id: "3", slug: "motherboards", name: "Motherboards", description: "Boards for every platform", productCount: 22, icon: "⊞" },
  { id: "4", slug: "memory", name: "Memory", description: "DDR5 and DDR4 RAM kits", productCount: 16, icon: "▤" },
  { id: "5", slug: "storage", name: "Storage", description: "SSDs and NVMe drives", productCount: 14, icon: "◫" },
  { id: "6", slug: "peripherals", name: "Peripherals", description: "Keyboards, mice, and headsets", productCount: 31, icon: "◎" },
  { id: "7", slug: "cases", name: "Cases", description: "ATX, mATX, and ITX enclosures", productCount: 12, icon: "□" },
  { id: "8", slug: "cooling", name: "Cooling", description: "Air and liquid cooling solutions", productCount: 19, icon: "◌" },
];

export function getCategoryBySlug(slug: string): MockCategory | undefined {
  return MOCK_CATEGORIES.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}

export function getProductBySlug(slug: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(
  product: MockProduct,
  limit = 4,
): MockProduct[] {
  return MOCK_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit);
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    sku: "NV-RTX4090-24G",
    slug: "asus-rog-strix-rtx-4090-24g",
    name: "GeForce RTX 4090 ROG Strix OC 24GB",
    brand: "ASUS ROG",
    description: "The ultimate GPU for 4K gaming and content creation.",
    categorySlug: "gpus",
    priceCents: 159999,
    stockStatus: "in-stock",
  },
  {
    id: "2",
    sku: "NV-RTX4080S-16G",
    slug: "msi-rtx-4080-super-16g",
    name: "GeForce RTX 4080 Super Gaming X Trio 16GB",
    brand: "MSI",
    description: "High-performance 1440p and 4K gaming card.",
    categorySlug: "gpus",
    priceCents: 99999,
    stockStatus: "in-stock",
  },
  {
    id: "3",
    sku: "AMD-RX7900XTX-24G",
    slug: "gigabyte-rx-7900-xtx-gaming-oc",
    name: "RX 7900 XTX Gaming OC 24GB",
    brand: "Gigabyte",
    description: "AMD's flagship Radeon card for maxed-out gaming.",
    categorySlug: "gpus",
    priceCents: 94999,
    stockStatus: "out-of-stock",
  },
  {
    id: "4",
    sku: "AMD-R9-7950X3D",
    slug: "amd-ryzen-9-7950x3d",
    name: "Ryzen 9 7950X3D 16-Core",
    brand: "AMD",
    description: "World's fastest gaming CPU with 3D V-Cache technology.",
    categorySlug: "cpus",
    priceCents: 69999,
    stockStatus: "low-stock",
  },
  {
    id: "5",
    sku: "INTEL-I9-14900KS",
    slug: "intel-core-i9-14900ks",
    name: "Core i9-14900KS 24-Core",
    brand: "Intel",
    description: "Intel's highest-clocked desktop processor.",
    categorySlug: "cpus",
    priceCents: 58999,
    stockStatus: "in-stock",
  },
  {
    id: "6",
    sku: "CORSAIR-K100-AIR",
    slug: "corsair-k100-air-wireless",
    name: "K100 Air Wireless Mechanical Keyboard",
    brand: "Corsair",
    description: "Ultra-thin wireless mechanical keyboard for serious gamers.",
    categorySlug: "peripherals",
    priceCents: 22999,
    stockStatus: "in-stock",
  },
  {
    id: "7",
    sku: "SAMSUNG-990PRO-2T",
    slug: "samsung-990-pro-2tb",
    name: "990 Pro NVMe SSD 2TB",
    brand: "Samsung",
    description: "PCIe 4.0 NVMe with up to 7,450 MB/s sequential read.",
    categorySlug: "storage",
    priceCents: 14999,
    stockStatus: "in-stock",
  },
  {
    id: "8",
    sku: "CORSAIR-DDR5-32GB",
    slug: "corsair-dominator-titanium-ddr5-32gb",
    name: "Dominator Titanium DDR5-6000 32GB",
    brand: "Corsair",
    description: "High-performance DDR5 memory with aluminum DHX fins.",
    categorySlug: "memory",
    priceCents: 18999,
    stockStatus: "low-stock",
  },
];
