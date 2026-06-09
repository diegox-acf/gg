// Catalog seed generator.
//
// Reads gg-product-images/, groups files by category prefix, and emits:
//   1. gg-catalog/migrations/000004_reseed_catalog.up.sql  (+ .down.sql)
//   2. scripts/_mockdata.snippet.ts — the 14 MOCK_CATEGORIES + a trimmed
//      MOCK_PRODUCTS fallback to splice into the storefront's lib/mock-data.ts
//
// Mock data only: images are reused freely across products. Run from repo root:
//   node scripts/gen-catalog-seed.mjs
//
// The migration (not this script) is the source of truth once generated.

import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const IMG_DIR = join(ROOT, "gg-product-images");
const IMAGE_BASE_URL = "http://localhost:8080";

// ---- image pools (normalize the powersuplly2 typo to the served key) ----
const fixKey = (f) => f.replace("powersuplly", "powersupply");
const files = readdirSync(IMG_DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
const pools = {};
for (const f of files) {
  const key = fixKey(f);
  const prefix = key.match(/^[a-z]+/i)[0].toLowerCase();
  (pools[prefix] ||= []).push(key);
}
for (const k of Object.keys(pools)) pools[k].sort();

// Categories with no dedicated images reuse a neighbor pool.
const imagesFor = (id) => {
  if (id === "cooler") return [...(pools.case ?? []), ...(pools.motherboard ?? [])];
  if (id === "storage") return pools.memory ?? [];
  return pools[id] ?? [];
};

// ---- 14 categories ----
const CATS = [
  { id: "case", label: "Cases", icon: "□", desc: "ATX, mATX, and ITX enclosures",
    brands: ["NZXT", "Corsair", "Lian Li", "Fractal Design", "be quiet!"], lines: ["H7 Flow", "5000D", "O11 Dynamic", "Meshify", "Pure Base"],
    price: [6999, 29999], sku: "CASE", specs: (i) => ({ "Form Factor": ["ATX", "mATX", "ITX"][i % 3], "Side Panel": "Tempered Glass", "Fans Included": `${2 + (i % 4)}`, "Max GPU Length": `${330 + (i % 5) * 10} mm` }) },
  { id: "controller", label: "Controllers", icon: "✦", desc: "Gamepads for PC and console",
    brands: ["Xbox", "Sony", "8BitDo", "Razer", "SCUF"], lines: ["Elite Series 2", "DualSense Edge", "Ultimate", "Wolverine V2", "Instinct Pro"],
    price: [4999, 19999], sku: "CTRL", specs: (i) => ({ Connectivity: i % 2 ? "Bluetooth + USB-C" : "2.4 GHz Wireless", "Battery Life": `${15 + (i % 10)} h`, "Hall-Effect Sticks": i % 2 ? "Yes" : "No" }) },
  { id: "cooler", label: "Coolers", icon: "◌", desc: "Air and liquid CPU cooling",
    brands: ["Noctua", "Corsair", "be quiet!", "Arctic", "NZXT"], lines: ["NH-D15", "iCUE H150i", "Dark Rock Pro", "Liquid Freezer III", "Kraken Elite"],
    price: [3999, 27999], sku: "COOL", specs: (i) => ({ Type: i % 2 ? "360 mm AIO" : "Dual-Tower Air", TDP: `${180 + (i % 6) * 20} W`, "Fan Speed": `${1500 + (i % 5) * 100} RPM`, Socket: i % 2 ? "AM5 / LGA1700" : "LGA1700" }) },
  { id: "cpu", label: "CPUs", icon: "◈", desc: "Processors from AMD and Intel",
    brands: ["Intel", "AMD"], lines: ["Core i9", "Core i7", "Core i5", "Ryzen 9", "Ryzen 7", "Ryzen 5"],
    price: [18999, 79999], sku: "CPU", specs: (i) => ({ Cores: `${6 + (i % 12) * 2}`, "Boost Clock": `${(5.0 + (i % 11) * 0.1).toFixed(1)} GHz`, TDP: `${65 + (i % 4) * 35} W`, Socket: i % 2 ? "AM5" : "LGA1700" }) },
  { id: "gpu", label: "GPUs", icon: "▣", desc: "Graphics cards for gaming and creation",
    brands: ["ASUS ROG", "MSI", "Gigabyte", "NVIDIA", "Sapphire"], lines: ["RTX 4090", "RTX 4080 Super", "RTX 4070 Ti", "RX 7900 XTX", "RX 7800 XT"],
    price: [49999, 199999], sku: "GPU", specs: (i) => ({ VRAM: `${12 + (i % 4) * 4} GB GDDR6X`, TDP: `${250 + (i % 6) * 30} W`, "Boost Clock": `${(2.3 + (i % 8) * 0.05).toFixed(2)} GHz`, Outputs: "3× DP, 1× HDMI" }) },
  { id: "headset", label: "Headsets", icon: "◯", desc: "Gaming headsets and audio",
    brands: ["SteelSeries", "Logitech G", "HyperX", "Razer", "Corsair"], lines: ["Arctis Nova Pro", "Astro A50", "Cloud III", "BlackShark V2", "Virtuoso"],
    price: [4999, 34999], sku: "HEAD", specs: (i) => ({ Driver: `${40 + (i % 3) * 10} mm`, Connectivity: i % 2 ? "Wireless 2.4 GHz" : "USB + 3.5 mm", Microphone: "Detachable", Surround: "Spatial Audio" }) },
  { id: "keyboard", label: "Keyboards", icon: "▦", desc: "Mechanical and low-profile keyboards",
    brands: ["Corsair", "Razer", "Keychron", "Logitech G", "SteelSeries"], lines: ["K100 RGB", "Huntsman V3", "Q1 Pro", "G915", "Apex Pro"],
    price: [7999, 24999], sku: "KEYB", specs: (i) => ({ Switch: ["Cherry MX Red", "Optical", "Hall-Effect", "Tactile Brown"][i % 4], Layout: ["Full (100%)", "TKL (80%)", "75%", "65%"][i % 4], Backlight: "Per-key RGB", Connectivity: i % 2 ? "USB-C" : "Wireless + USB-C" }) },
  { id: "laptop", label: "Laptops", icon: "▭", desc: "Gaming and creator laptops",
    brands: ["ASUS ROG", "Razer", "Lenovo Legion", "Alienware", "MSI"], lines: ["Zephyrus G16", "Blade 16", "Legion Pro 7", "m18", "Raider GE78"],
    price: [129999, 349999], sku: "LAPT", specs: (i) => ({ CPU: i % 2 ? "Ryzen 9" : "Core i9", GPU: ["RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090"][i % 4], Display: `${["16", "17.3", "18"][i % 3]}" ${["165", "240", "300"][i % 3]} Hz`, RAM: `${16 + (i % 4) * 16} GB` }) },
  { id: "memory", label: "Memory", icon: "▤", desc: "DDR5 and DDR4 RAM kits",
    brands: ["Corsair", "G.Skill", "Kingston", "Crucial", "TeamGroup"], lines: ["Vengeance", "Trident Z5", "Fury Beast", "Pro OC", "T-Force Delta"],
    price: [5999, 29999], sku: "MEM", specs: (i) => ({ Capacity: `${[16, 32, 64, 96][i % 4]} GB`, Type: i % 3 ? "DDR5" : "DDR4", Speed: `${[5600, 6000, 6400, 7200][i % 4]} MT/s`, Latency: `CL${30 + (i % 6)}` }) },
  { id: "monitor", label: "Monitors", icon: "▥", desc: "High-refresh gaming displays",
    brands: ["LG", "Samsung", "ASUS ROG", "Dell", "Gigabyte"], lines: ["UltraGear", "Odyssey OLED", "Swift PG", "Alienware AW", "AORUS FO"],
    price: [19999, 99999], sku: "MON", specs: (i) => ({ Size: `${[27, 32, 34, 49][i % 4]}"`, Resolution: ["1440p", "4K", "Ultrawide 1440p", "DQHD"][i % 4], Refresh: `${[144, 165, 240, 360][i % 4]} Hz`, Panel: i % 2 ? "OLED" : "IPS" }) },
  { id: "motherboard", label: "Motherboards", icon: "⊞", desc: "Boards for every platform",
    brands: ["ASUS ROG", "MSI", "Gigabyte", "ASRock", "Biostar"], lines: ["Maximus Z790", "MEG X670E", "AORUS Master", "Taichi", "Valkyrie"],
    price: [14999, 64999], sku: "MOBO", specs: (i) => ({ Socket: i % 2 ? "AM5" : "LGA1700", Chipset: ["Z790", "X670E", "B650", "B760"][i % 4], "Memory Slots": "4× DDR5", "M.2 Slots": `${3 + (i % 3)}` }) },
  { id: "mouse", label: "Mice", icon: "◑", desc: "Gaming mice and sensors",
    brands: ["Logitech G", "Razer", "SteelSeries", "Glorious", "Pulsar"], lines: ["G Pro X Superlight 2", "Viper V3 Pro", "Aerox 5", "Model O", "X2V2"],
    price: [3999, 16999], sku: "MOUSE", specs: (i) => ({ Sensor: "Optical 30K", DPI: `${["18,000", "25,600", "30,000", "35,000"][i % 4]}`, Weight: `${55 + (i % 6) * 3} g`, Connectivity: i % 2 ? "2.4 GHz Wireless" : "Wired USB-C" }) },
  { id: "powersupply", label: "Power Supplies", icon: "◧", desc: "Efficient, quiet PSUs",
    brands: ["Corsair", "Seasonic", "be quiet!", "EVGA", "Cooler Master"], lines: ["RM1000x", "PRIME TX", "Dark Power 13", "SuperNOVA", "V Platinum"],
    price: [8999, 32999], sku: "PSU", specs: (i) => ({ Wattage: `${[650, 750, 850, 1000, 1200][i % 5]} W`, Rating: ["80+ Gold", "80+ Platinum", "80+ Titanium"][i % 3], Modular: "Fully Modular", Fan: i % 2 ? "135 mm FDB" : "120 mm" }) },
  { id: "storage", label: "Storage", icon: "◫", desc: "NVMe SSDs and drives",
    brands: ["Samsung", "WD", "Crucial", "Seagate", "Kingston"], lines: ["990 Pro", "Black SN850X", "T700", "FireCuda 530", "KC3000"],
    price: [8999, 39999], sku: "STOR", specs: (i) => ({ Capacity: `${[1, 2, 4][i % 3]} TB`, Interface: "PCIe 4.0 ×4", "Seq Read": `${7000 + (i % 5) * 100} MB/s`, "Seq Write": `${6300 + (i % 6) * 100} MB/s` }) },
];

const STOCK = (i) => (i % 13 === 0 ? "out-of-stock" : i % 7 === 0 ? "low-stock" : "in-stock");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sql = (s) => "'" + String(s).replace(/'/g, "''") + "'";
// deterministic count 20..30 per category
const countFor = (idx) => 20 + ((idx * 7 + 3) % 11);
const price = (lo, hi, i) => lo + ((i * 521) % (hi - lo + 1));

const products = []; // {sku,slug,name,brand,desc,cat,priceCents,specs,stock,key}
for (let c = 0; c < CATS.length; c++) {
  const cat = CATS[c];
  const imgs = imagesFor(cat.id);
  const n = countFor(c);
  for (let i = 0; i < n; i++) {
    const brand = cat.brands[i % cat.brands.length];
    const line = cat.lines[i % cat.lines.length];
    const name = `${brand} ${line} ${String.fromCharCode(65 + (i % 26))}${100 + i}`;
    const slug = `${slugify(`${brand}-${line}`)}-${cat.id}-${i + 1}`;
    products.push({
      sku: `${cat.sku}-${String(c * 100 + i).padStart(4, "0")}`,
      slug,
      name,
      brand,
      desc: `${name} — ${cat.desc.toLowerCase()}.`,
      cat: cat.id,
      priceCents: price(cat.price[0], cat.price[1], i + 1),
      specs: cat.specs(i),
      stock: STOCK(c + i),
      key: imgs.length ? imgs[i % imgs.length] : null,
    });
  }
}

// ---- emit SQL ----
let up = `-- GENERATED by scripts/gen-catalog-seed.mjs — do not edit by hand.\n`;
up += `-- Full catalog reseed: 14 categories, ${products.length} products (mock; images reused).\n\n`;
up += `DELETE FROM product_images;\nDELETE FROM products;\nDELETE FROM categories;\n\n`;
up += `-- A single mock image backs many products, so the per-key UNIQUE no longer holds.\n`;
up += `ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_key_key;\n\n`;
up += `INSERT INTO categories (id, slug, label, icon) VALUES\n`;
up += CATS.map((c) => `    (${sql(c.id)}, ${sql(c.id)}, ${sql(c.label)}, ${sql(c.icon)})`).join(",\n") + ";\n\n";

for (let c = 0; c < CATS.length; c++) {
  const cat = CATS[c];
  const rows = products.filter((p) => p.cat === cat.id);
  up += `-- ${cat.label}\n`;
  up += `INSERT INTO products (sku, slug, name, brand, description, category_id, price_cents, specs, stock_status) VALUES\n`;
  up += rows.map((p) =>
    `    (${sql(p.sku)}, ${sql(p.slug)}, ${sql(p.name)}, ${sql(p.brand)}, ${sql(p.desc)}, ${sql(p.cat)}, ${p.priceCents}, ${sql(JSON.stringify(p.specs))}, ${sql(p.stock)})`
  ).join(",\n") + ";\n";
  const withImg = rows.filter((p) => p.key);
  if (withImg.length) {
    up += `INSERT INTO product_images (product_id, key, position)\n`;
    up += `SELECT p.id, v.key, 0 FROM (VALUES\n`;
    up += withImg.map((p) => `    (${sql(p.slug)}, ${sql(p.key)})`).join(",\n");
    up += `\n) AS v(slug, key) JOIN products p ON p.slug = v.slug;\n`;
  }
  up += `\n`;
}

const down = `-- GENERATED by scripts/gen-catalog-seed.mjs\n-- Reverts the reseed by clearing all seeded rows (dev mock data).\nDELETE FROM product_images;\nDELETE FROM products;\nDELETE FROM categories;\n`;

const migDir = join(ROOT, "gg-catalog", "migrations");
writeFileSync(join(migDir, "000004_reseed_catalog.up.sql"), up);
writeFileSync(join(migDir, "000004_reseed_catalog.down.sql"), down);

// ---- emit storefront fallback snippet (4 per category) ----
const cats = CATS.map((c, i) => ({ id: String(i + 1), slug: c.id, name: c.label, description: c.desc, productCount: countFor(i), icon: c.icon }));
const fallback = [];
for (const c of CATS) {
  fallback.push(...products.filter((p) => p.cat === c.id).slice(0, 4));
}
const mp = fallback.map((p, idx) => ({
  id: String(idx + 1),
  sku: p.sku, slug: p.slug, name: p.name, brand: p.brand, description: p.desc,
  categorySlug: p.cat, priceCents: p.priceCents, stockStatus: p.stock,
  specs: p.specs, imageUrl: p.key ? `${IMAGE_BASE_URL}/images/${p.key}` : undefined,
}));

const ts =
  `// GENERATED by scripts/gen-catalog-seed.mjs — do not edit by hand.\n` +
  `// Storefront fallback data (used only when the catalog service is unreachable).\n` +
  `import type { MockCategory, MockProduct } from "./mock-data";\n\n` +
  `export const MOCK_CATEGORIES: MockCategory[] = ${JSON.stringify(cats, null, 2)};\n\n` +
  `export const MOCK_PRODUCTS: MockProduct[] = ${JSON.stringify(mp, null, 2)};\n`;
const tsOut = join(ROOT, "gg-storefront", "apps", "storefront", "lib", "mock-catalog.generated.ts");
mkdirSync(dirname(tsOut), { recursive: true });
writeFileSync(tsOut, ts);

console.log(`categories: ${CATS.length}`);
console.log(`products:   ${products.length}`);
console.log(`with image: ${products.filter((p) => p.key).length}`);
console.log(`pools:      ${Object.keys(pools).sort().join(", ")}`);
console.log(`wrote: gg-catalog/migrations/000004_reseed_catalog.{up,down}.sql`);
console.log(`wrote: gg-storefront/apps/storefront/lib/mock-catalog.generated.ts (fallback ${mp.length} products)`);
