"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  applyAccent,
  isValidHex,
  normalizeHex,
} from "@/lib/theme/appearance";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "gg-theme";

/**
 * Blocking script injected in <head> so the correct theme AND accent are
 * applied before first paint (no flash of the wrong theme/color). Mirrors the
 * resolution logic in this file and lib/theme/appearance.ts — keep them in
 * sync. Kept dependency-free since it runs as a raw string.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var de=document.documentElement;var p=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=p==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;de.setAttribute('data-theme',d);var a=localStorage.getItem('${ACCENT_STORAGE_KEY}');if(a&&/^#[0-9a-fA-F]{6}$/.test(a)&&a.toLowerCase()!=='${DEFAULT_ACCENT}'){var r=parseInt(a.slice(1,3),16),g=parseInt(a.slice(3,5),16),b=parseInt(a.slice(5,7),16);var f=function(x){x=x/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);};var L=0.2126*f(r)+0.7152*f(g)+0.0722*f(b);var dk=function(c){return Math.max(0,Math.min(255,Math.round(c*0.88))).toString(16).padStart(2,'0');};var s=de.style;s.setProperty('--color-primary',a);s.setProperty('--color-primary-hover','#'+dk(r)+dk(g)+dk(b));s.setProperty('--color-primary-muted','rgba('+r+','+g+','+b+',0.15)');s.setProperty('--color-border-accent','rgba('+r+','+g+','+b+',0.4)');s.setProperty('--color-fg-inverse',L>0.179?'#070a0e':'#f0f4f8');s.setProperty('--shadow-accent','0 4px 20px rgba('+r+','+g+','+b+',0.25)');}}catch(e){}})();`;

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  accent: string;
  setAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to "system" so server and first client render match (the blocking
  // script already set the real data-theme on <html>); real preference is read
  // from storage in the effect below to avoid a hydration mismatch.
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  const apply = useCallback((next: ThemePreference) => {
    const r = resolve(next);
    document.documentElement.setAttribute("data-theme", r);
    setResolved(r);
  }, []);

  // Hydrate from storage after mount.
  useEffect(() => {
    const stored =
      (localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null) ??
      "system";
    setPreferenceState(stored);
    apply(stored);

    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (storedAccent && isValidHex(storedAccent)) {
      setAccentState(normalizeHex(storedAccent));
      // DOM was already set by the blocking script; this keeps React state in sync.
    }
  }, [apply]);

  const setAccent = useCallback((hex: string) => {
    if (!isValidHex(hex)) return;
    const next = normalizeHex(hex);
    setAccentState(next);
    applyAccent(next);
    try {
      if (next === DEFAULT_ACCENT) localStorage.removeItem(ACCENT_STORAGE_KEY);
      else localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable — accent still applies for the session */
    }
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* storage may be unavailable (private mode) — theme still applies for the session */
      }
      apply(next);
    },
    [apply],
  );

  // While following the OS, react to live changes of the system color scheme.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, apply]);

  return (
    <ThemeContext.Provider
      value={{ preference, resolved, setPreference, accent, setAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** Custom Hook — read/update the active theme from any client component. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
