import { useSyncExternalStore } from "react";

/**
 * SettingsManager — sound / music / vibration / graphics quality.
 * Graphics quality drives shadow resolution, particle counts, texture size
 * and pixel ratio so the game can scale down on weaker phones.
 */
export type GraphicsQuality = "low" | "medium" | "high";

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  graphics: GraphicsQuality;
}

const KEY = "maze-escape:settings:v1";

const DEFAULTS: Settings = { sound: true, music: true, vibration: true, graphics: "medium" };

let settings: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

export function loadSettings() {
  if (loaded || typeof window === "undefined") return settings;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) settings = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    settings = DEFAULTS;
  }
  // auto-downgrade on low-core devices unless the player already chose
  if (!localStorage.getItem(KEY) && (navigator.hardwareConcurrency ?? 4) <= 4) {
    settings = { ...settings, graphics: "low" };
  }
  listeners.forEach((l) => l());
  return settings;
}

export const getSettings = () => settings;

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  settings = { ...settings, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useSettings<T>(selector: (s: Settings) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(settings),
    () => selector(settings),
  );
}

/** Derived render budget for the current graphics setting. */
export interface QualityProfile {
  shadows: boolean;
  shadowMapSize: number;
  dpr: [number, number];
  textureSize: number;
  torchCount: number;
  particles: number;
  fogTightness: number;
  antialias: boolean;
}

export const QUALITY: Record<GraphicsQuality, QualityProfile> = {
  low: {
    shadows: false,
    shadowMapSize: 512,
    dpr: [1, 1],
    textureSize: 128,
    torchCount: 3,
    particles: 0,
    fogTightness: 1,
    antialias: false,
  },
  medium: {
    shadows: true,
    shadowMapSize: 1024,
    dpr: [1, 1.6],
    textureSize: 256,
    torchCount: 6,
    particles: 14,
    fogTightness: 1.1,
    antialias: true,
  },
  high: {
    shadows: true,
    shadowMapSize: 2048,
    dpr: [1, 2],
    textureSize: 512,
    torchCount: 10,
    particles: 26,
    fogTightness: 1.2,
    antialias: true,
  },
};

export const getQuality = () => QUALITY[settings.graphics];
