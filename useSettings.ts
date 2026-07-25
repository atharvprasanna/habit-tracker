import { useState, useEffect } from "react";

export type Theme = "light" | "dark";
export type FontChoice = "default" | "rounded" | "mono";

export interface AppSettings {
  theme: Theme;
  font: FontChoice;
  accentColor: string;
}

export const ACCENT_PRESETS = [
  // Warm
  { label: "Rose",    value: "#f43f5e" },
  { label: "Red",     value: "#ef4444" },
  { label: "Orange",  value: "#f97316" },
  { label: "Amber",   value: "#f59e0b" },
  { label: "Yellow",  value: "#eab308" },
  // Nature
  { label: "Lime",    value: "#84cc16" },
  { label: "Green",   value: "#22c55e" },
  { label: "Emerald", value: "#10b981" },
  { label: "Teal",    value: "#14b8a6" },
  // Cool
  { label: "Cyan",    value: "#06b6d4" },
  { label: "Sky",     value: "#0ea5e9" },
  { label: "Blue",    value: "#3b82f6" },
  { label: "Indigo",  value: "#6366f1" },
  // Purple
  { label: "Violet",  value: "#8b5cf6" },
  { label: "Purple",  value: "#a855f7" },
  { label: "Fuchsia", value: "#d946ef" },
  { label: "Pink",    value: "#ec4899" },
  // Neutral
  { label: "Slate",   value: "#64748b" },
  { label: "Stone",   value: "#78716c" },
  { label: "Zinc",    value: "#71717a" },
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
  // White-tick SVG checkmark encoded for use in background-image
  const checkSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.707 4.293a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414L6 10.586l6.293-6.293a1 1 0 0 1 1.414 0z' fill='white'/%3E%3C/svg%3E")`;
  el.textContent = `
    .ht-accent-btn { background-color: ${a} !important; }
    .ht-accent-btn:hover { filter: brightness(0.88); }
    .ht-accent-text { color: ${a} !important; }
    input[type="checkbox"] {
      -webkit-appearance: none;
      appearance: none;
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 5px;
      border: 2px solid #d1d5db;
      cursor: pointer;
      background-color: white;
      vertical-align: middle;
      transition: background-color 0.15s, border-color 0.15s;
    }
    input[type="checkbox"]:checked {
      background-color: var(--cb-color, ${a});
      border-color: var(--cb-color, ${a});
      background-image: ${checkSvg};
      background-repeat: no-repeat;
      background-position: center;
      background-size: 75%;
    }
    input[type="checkbox"]:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
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
