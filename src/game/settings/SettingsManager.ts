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

/**
 * Best-effort device tier. Phones default to MEDIUM, weak phones to LOW,
 * desktops / high-core devices to HIGH.
 */
export function detectTier(): GraphicsQuality {
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (cores <= 4 || mem <= 3) return "low";
  if (mobile) return cores >= 8 && mem >= 6 ? "high" : "medium";
  return cores >= 8 ? "high" : "medium";
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
  // auto-pick a device tier the first time only — the player's own choice
  // is never overridden on later launches
  if (!stored) settings = { ...settings, graphics: detectTier() };
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
  // LOW — no shadows, native resolution capped at 1x, minimal effects.
  low: {
    shadows: false,
    shadowMapSize: 512,
    dpr: [0.75, 1],
    textureSize: 128,
    torchCount: 3,
    particles: 0,
    fogTightness: 1.15,
    antialias: false,
  },
  // MEDIUM — the mobile default: cheap shadows, moderate resolution.
  medium: {
    shadows: true,
    shadowMapSize: 768,
    dpr: [1, 1.4],
    textureSize: 256,
    torchCount: 5,
    particles: 10,
    fogTightness: 1.2,
    antialias: false,
  },
  // HIGH — desktops and flagship phones.
  high: {
    shadows: true,
    shadowMapSize: 1536,
    dpr: [1, 1.75],
    textureSize: 512,
    torchCount: 8,
    particles: 20,
    fogTightness: 1.3,
    antialias: true,
  },
};

export const getQuality = () => QUALITY[settings.graphics];

/** Imperative subscription (used by the AudioManager, outside React). */
export function subscribeSettings(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
