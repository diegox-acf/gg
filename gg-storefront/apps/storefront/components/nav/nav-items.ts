// Single source for category navigation, grouped for the "Shop All" mega-menu
// (desktop) and the mobile menu. Icons mirror the catalog category glyphs.
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const CATEGORY_GROUPS: NavGroup[] = [
  {
    title: "Components",
    items: [
      { label: "CPUs", href: "/category/cpu", icon: "◈" },
      { label: "GPUs", href: "/category/gpu", icon: "▣" },
      { label: "Motherboards", href: "/category/motherboard", icon: "⊞" },
      { label: "Memory", href: "/category/memory", icon: "▤" },
      { label: "Storage", href: "/category/storage", icon: "◫" },
      { label: "Power Supplies", href: "/category/powersupply", icon: "◧" },
      { label: "Coolers", href: "/category/cooler", icon: "◌" },
      { label: "Cases", href: "/category/case", icon: "□" },
    ],
  },
  {
    title: "Peripherals",
    items: [
      { label: "Keyboards", href: "/category/keyboard", icon: "▦" },
      { label: "Mice", href: "/category/mouse", icon: "◑" },
      { label: "Headsets", href: "/category/headset", icon: "◯" },
      { label: "Controllers", href: "/category/controller", icon: "✦" },
    ],
  },
  {
    title: "Displays & Systems",
    items: [
      { label: "Monitors", href: "/category/monitor", icon: "▥" },
      { label: "Laptops", href: "/category/laptop", icon: "▭" },
    ],
  },
];

// Flat list (e.g. for the mobile menu fallback / any non-grouped use).
export const NAV_ITEMS: NavItem[] = CATEGORY_GROUPS.flatMap((g) => g.items);
