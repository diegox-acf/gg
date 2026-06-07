// Accent (primary) color personalization. The brand default is #ff3500; users
// may override it — we persist the hex and re-derive every primary-* token from
// it, including a luminance-aware "ink" so on-primary text stays readable.

export const ACCENT_STORAGE_KEY = "gg-accent";
export const DEFAULT_ACCENT = "#ff3500";

export interface AccentPreset {
  label: string;
  value: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { label: "Inferno Red", value: "#ff3500" },
  { label: "Ember Orange", value: "#ff6600" },
  { label: "Solar Gold", value: "#ffb800" },
  { label: "Toxic Yellow", value: "#d4ff00" },
  { label: "Volt Green", value: "#00ff88" },
  { label: "Cyber Cyan", value: "#00e5ff" },
  { label: "Plasma Blue", value: "#4a8bff" },
  { label: "Synth Purple", value: "#a855f7" },
  { label: "Hot Magenta", value: "#ff00cc" },
  { label: "Neon Coral", value: "#ff3d57" },
];

// Tokens re-derived from the accent. Mirrored by THEME_INIT_SCRIPT for FOUC-free
// first paint — keep the two in sync.
const ACCENT_VAR_KEYS = [
  "--color-primary",
  "--color-primary-hover",
  "--color-primary-muted",
  "--color-border-accent",
  "--color-fg-inverse",
  "--shadow-accent",
] as const;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase();
}

export function isDefaultAccent(hex: string): boolean {
  return normalizeHex(hex) === DEFAULT_ACCENT;
}

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darken(hex: string, amount: number): string {
  const f = 1 - amount;
  const hp = (c: number) => clamp(c * f).toString(16).padStart(2, "0");
  const [r, g, b] = channels(hex);
  return `#${hp(r)}${hp(g)}${hp(b)}`;
}

function relativeLuminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = channels(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Highest-contrast text/icon color to place on top of the accent. */
export function accentInk(hex: string): string {
  return relativeLuminance(hex) > 0.179 ? "#070a0e" : "#f0f4f8";
}

function accentVars(hex: string): Record<string, string> {
  return {
    "--color-primary": hex,
    "--color-primary-hover": darken(hex, 0.12),
    "--color-primary-muted": rgba(hex, 0.15),
    "--color-border-accent": rgba(hex, 0.4),
    "--color-fg-inverse": accentInk(hex),
    "--shadow-accent": `0 4px 20px ${rgba(hex, 0.25)}`,
  };
}

/**
 * Apply (or, for the brand default, clear) the accent override on an element.
 * Clearing for the default lets the stylesheet's own tokens win — important so
 * the light theme keeps its constant on-primary text rule.
 */
export function applyAccent(
  hex: string,
  el: HTMLElement = document.documentElement,
): void {
  if (isDefaultAccent(hex)) {
    clearAccent(el);
    return;
  }
  const vars = accentVars(hex);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}

export function clearAccent(el: HTMLElement = document.documentElement): void {
  for (const key of ACCENT_VAR_KEYS) el.style.removeProperty(key);
}
