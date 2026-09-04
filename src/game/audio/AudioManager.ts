import { getSettings, subscribeSettings } from "../settings/SettingsManager";

/**
 * AudioManager — centralised, mixer-based audio.
 *
 * Everything is generated with WebAudio (no copyrighted assets). The public
 * API is asset-agnostic: real sound files can later be decoded and routed
 * through the same `sfxBus` / `musicBus` gains without touching call sites.
 *
 *   master ─┬─ musicBus ── (ambient drone)
 *           └─ sfxBus   ── (one-shot cues)
 */
export type SoundEvent =
  | "ui"
  | "button"
  | "level-select"
  | "gate-open"
  | "gate-locked"
  | "clue"
  | "hint"
  | "coin"
  | "xp"
  | "complete"
  | "star"
  | "levelup"
  | "daily"
  | "unlock"
  | "chapter"
  | "secret"
  | "footstep";

/** Back-compat alias used across the existing game code. */
type Cue = SoundEvent;

interface CueSpec {
  freq: number[];
  dur: number;
  type: OscillatorType;
  gain: number;
}

const CUES: Record<SoundEvent, CueSpec> = {
  ui: { freq: [520], dur: 0.07, type: "sine", gain: 0.08 },
  button: { freq: [480], dur: 0.06, type: "sine", gain: 0.08 },
  "level-select": { freq: [440, 660], dur: 0.18, type: "sine", gain: 0.1 },
  "gate-open": { freq: [330, 494, 659], dur: 0.5, type: "sine", gain: 0.16 },
  "gate-locked": { freq: [150, 110], dur: 0.22, type: "triangle", gain: 0.14 },
  clue: { freq: [660, 880], dur: 0.3, type: "sine", gain: 0.12 },
  hint: { freq: [587, 784], dur: 0.24, type: "triangle", gain: 0.1 },
  coin: { freq: [880, 1175], dur: 0.16, type: "sine", gain: 0.1 },
  xp: { freq: [700, 940], dur: 0.16, type: "sine", gain: 0.08 },
  complete: { freq: [392, 523, 659, 784], dur: 0.75, type: "sine", gain: 0.18 },
  star: { freq: [988, 1319], dur: 0.22, type: "sine", gain: 0.1 },
  levelup: { freq: [523, 659, 784, 1047], dur: 0.7, type: "sine", gain: 0.14 },
  daily: { freq: [587, 784, 988], dur: 0.5, type: "sine", gain: 0.12 },
  unlock: { freq: [494, 740], dur: 0.34, type: "sine", gain: 0.12 },
  chapter: { freq: [392, 587, 784, 1175], dur: 0.9, type: "sine", gain: 0.15 },
  secret: { freq: [740, 988, 1245], dur: 0.42, type: "sine", gain: 0.11 },
  footstep: { freq: [90], dur: 0.06, type: "triangle", gain: 0.05 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicNodes: { osc: OscillatorNode; lfo: OscillatorNode }[] = [];
let musicPlaying = false;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(ctx.destination);
    applyVolumes();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function applyVolumes() {
  if (!ctx || !master || !musicBus || !sfxBus) return;
  const s = getSettings();
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(s.masterVolume, t, 0.05);
  musicBus.gain.setTargetAtTime(s.music ? s.musicVolume : 0, t, 0.15);
  sfxBus.gain.setTargetAtTime(s.sound ? s.sfxVolume : 0, t, 0.05);
}

if (typeof window !== "undefined") {
  subscribeSettings(() => {
    applyVolumes();
    const s = getSettings();
    if (!s.music) AudioManager.stopMusic();
  });
}

export const AudioManager = {
  /** Must be called from a user gesture on mobile to unlock audio. */
  unlock() {
    ensureContext();
  },

  playSFX(event: SoundEvent) {
    const s = getSettings();
    if (!s.sound || s.masterVolume <= 0 || s.sfxVolume <= 0) return;
    const ac = ensureContext();
    if (!ac || !sfxBus) return;
    const spec = CUES[event] ?? CUES.ui;
    const step = spec.dur / spec.freq.length;
    spec.freq.forEach((f, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = spec.type;
      osc.frequency.value = f;
      const t0 = ac.currentTime + i * step;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(spec.gain, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step * 1.6);
      osc.connect(gain).connect(sfxBus!);
      osc.start(t0);
      osc.stop(t0 + step * 1.7);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          /* already gone */
        }
      };
    });
  },

  /** Subtle two-note ancient drone — a placeholder for a real music bed. */
  playMusic() {
    const s = getSettings();
    if (!s.music || musicPlaying) return;
    const ac = ensureContext();
    if (!ac || !musicBus) return;
    musicPlaying = true;
    [55, 82.4, 110].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.05 / (i + 1);
      lfo.frequency.value = 0.05 + i * 0.03;
      lfoGain.gain.value = 0.02 / (i + 1);
      lfo.connect(lfoGain).connect(gain.gain);
      osc.connect(gain).connect(musicBus!);
      osc.start();
      lfo.start();
      musicNodes.push({ osc, lfo });
    });
  },

  stopMusic() {
    musicNodes.forEach(({ osc, lfo }) => {
      try {
        osc.stop();
        lfo.stop();
        osc.disconnect();
        lfo.disconnect();
      } catch {
        /* already stopped */
      }
    });
    musicNodes = [];
    musicPlaying = false;
  },

  setMasterVolume(v: number) {
    void v;
    applyVolumes();
  },
  setMusicVolume(v: number) {
    void v;
    applyVolumes();
  },
  setSFXVolume(v: number) {
    void v;
    applyVolumes();
  },
  toggleMusic(on: boolean) {
    applyVolumes();
    if (on) AudioManager.playMusic();
    else AudioManager.stopMusic();
  },
  toggleSFX() {
    applyVolumes();
  },
  /** Release everything (called when the game shell unmounts). */
  dispose() {
    AudioManager.stopMusic();
    try {
      void ctx?.close();
    } catch {
      /* ignore */
    }
    ctx = null;
    master = musicBus = sfxBus = null;
  },
};

/** Legacy helper kept so existing call sites stay untouched. */
export function playCue(cue: Cue) {
  AudioManager.playSFX(cue);
}

export function vibrate(pattern: number | number[]) {
  if (!getSettings().vibration) return;
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* unsupported device — fail silently */
  }
}
