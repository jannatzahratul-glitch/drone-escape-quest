import { getSettings } from "../settings/SettingsManager";

/**
 * AudioManager — lightweight WebAudio placeholder tones. No asset files yet;
 * real SFX/music can be dropped in behind the same play() API later.
 */
type Cue = "gate-open" | "gate-locked" | "complete" | "ui";

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const CUES: Record<Cue, { freq: number[]; dur: number; type: OscillatorType; gain: number }> = {
  "gate-open": { freq: [330, 494, 659], dur: 0.5, type: "sine", gain: 0.16 },
  "gate-locked": { freq: [150, 110], dur: 0.22, type: "triangle", gain: 0.14 },
  complete: { freq: [392, 523, 659, 784], dur: 0.75, type: "sine", gain: 0.18 },
  ui: { freq: [520], dur: 0.07, type: "sine", gain: 0.08 },
};

export function playCue(cue: Cue) {
  if (!getSettings().sound) return;
  const ac = audio();
  if (!ac) return;
  const spec = CUES[cue];
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
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + step * 1.7);
  });
}

export function vibrate(pattern: number | number[]) {
  if (!getSettings().vibration) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}
