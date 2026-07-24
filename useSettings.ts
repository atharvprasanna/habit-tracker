import { useState, useEffect } from "react";

export type Theme = "light" | "dark";
export type FontChoice = "default" | "rounded" | "mono";

export interface AppSettings {
  theme: Theme;
  font: FontChoice;
  accentColor: string;
}

export const ACCENT_PRESETS = [
  { label: "Orange", value: "#f97316" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Green",  value: "#10b981" },
  { label: "Pink",   value: "#ec4899" },
  { label: "Red",    value: "#ef4444" },
  { label: "Teal",   value: "#14b8a6" },
  { label: "Amber",  value: "#f59e0b" },
];

const DEFAULTS: AppSettings = {
  theme: "light",
  font: "default",
  accentColor: "#f97316",
};

const STORAGE_KEY = "habit-tracker-settings";

export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function applySettings(s: AppSettings) {
  const root = document.documentElement;

  // Theme — toggle .dark on <html> (index.css uses @custom-variant dark (&:is(.dark *)))
  root.classList.toggle("dark", s.theme === "dark");

  // Font
  const fontMap: Record<FontChoice, string> = {
    default: "system-ui, -apple-system, sans-serif",
    rounded: '"Nunito", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  };
  document.body.style.fontFamily = fontMap[s.font];

  // Load Google Fonts on demand
  if (s.font === "rounded" && !document.getElementById("gfont-nunito")) {
    const link = document.createElement("link");
    link.id = "gfont-nunito";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
  if (s.font === "mono" && !document.getElementById("gfont-jbmono")) {
    const link = document.createElement("link");
    link.id = "gfont-jbmono";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }

  // Accent colour — inject a style tag that targets utility classes
  let el = document.getElementById("ht-accent-style") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "ht-accent-style";
    document.head.appendChild(el);
  }
  const a = s.accentColor;
  el.textContent = `
    .ht-accent-btn { background-color: ${a} !important; }
    .ht-accent-btn:hover { filter: brightness(0.88); }
    .ht-accent-text { color: ${a} !important; }
    input[type="checkbox"] { accent-color: ${a}; width: 1.15rem; height: 1.15rem; border-radius: 5px; cursor: pointer; }
  `;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Persist + apply on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  // Apply on first mount (handles page reload with saved prefs)
  useEffect(() => {
    applySettings(settings);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<AppSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return { settings, update };
}
