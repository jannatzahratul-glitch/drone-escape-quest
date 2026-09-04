import { useSyncExternalStore } from "react";

/**
 * SettingsManager — audio, haptics, gameplay feel and graphics quality.
 * Graphics quality drives shadow resolution, particle counts, texture size
 * and pixel ratio so the game can scale down on weaker phones.
 *
 * All fields are merged over DEFAULTS on load, so saves written by older
 * builds keep working and only gain the new fields.
 */
export type GraphicsQuality = "low" | "medium" | "high";

export interface Settings {
  sound: boolean;
  music: boolean;
  /** haptic feedback (kept under the original key for save compatibility) */
  vibration: boolean;
  graphics: GraphicsQuality;
  /** 0..1 */
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  /** 0.5..1.5 */
  cameraSensitivity: number;
  joystickSensitivity: number;
  /** show contextual hint prompts / tutorial nudges */
  hintPrompts: boolean;
}

const KEY = "maze-escape:settings:v1";

const DEFAULTS: Settings = {
  sound: true,
  music: true,
  vibration: true,
  graphics: "medium",
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.9,
  cameraSensitivity: 1,
  joystickSensitivity: 1,
  hintPrompts: true,
};

const clampN = (n: number, lo = 0, hi = 1) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;

/** Repairs partial / corrupted saves without ever throwing. */
function sanitize(raw: Partial<Settings>): Settings {
  const s = { ...DEFAULTS, ...raw };
  return {
    ...s,
    sound: !!s.sound,
    music: !!s.music,
    vibration: !!s.vibration,
    hintPrompts: s.hintPrompts !== false,
    graphics: (["low", "medium", "high"] as GraphicsQuality[]).includes(s.graphics)
      ? s.graphics
      : "medium",
    masterVolume: clampN(Number(s.masterVolume)),
    musicVolume: clampN(Number(s.musicVolume)),
    sfxVolume: clampN(Number(s.sfxVolume)),
    cameraSensitivity: clampN(Number(s.cameraSensitivity), 0.5, 1.5),
    joystickSensitivity: clampN(Number(s.joystickSensitivity), 0.5, 1.5),
  };
}

let settings: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

export function loadSettings() {
  if (loaded || typeof window === "undefined") return settings;
  loaded = true;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
    settings = sanitize(stored ? (JSON.parse(stored) as Partial<Settings>) : {});
  } catch {
    settings = DEFAULTS;
  }
  // auto-downgrade on low-core devices unless the player already chose
  if (!stored && (navigator.hardwareConcurrency ?? 4) <= 4) {
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

/** Imperative subscription (used by the AudioManager, outside React). */
export function subscribeSettings(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
