// Single source for the category nav links (was duplicated in nav.tsx + nav-client.tsx).
// 14 categories overflow the horizontal bar — for now the desktop bar scrolls and the
// mobile menu lists them vertically. A mega-menu redesign is a deliberate follow-up.
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "GPUs", href: "/category/gpu" },
  { label: "CPUs", href: "/category/cpu" },
  { label: "Motherboards", href: "/category/motherboard" },
  { label: "Memory", href: "/category/memory" },
  { label: "Storage", href: "/category/storage" },
  { label: "Coolers", href: "/category/cooler" },
  { label: "Power Supplies", href: "/category/powersupply" },
  { label: "Cases", href: "/category/case" },
  { label: "Monitors", href: "/category/monitor" },
  { label: "Laptops", href: "/category/laptop" },
  { label: "Keyboards", href: "/category/keyboard" },
  { label: "Mice", href: "/category/mouse" },
  { label: "Headsets", href: "/category/headset" },
  { label: "Controllers", href: "/category/controller" },
];
