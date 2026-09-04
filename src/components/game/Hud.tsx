import { useEffect, useState } from "react";
import { BookOpen, Lightbulb, Pause } from "lucide-react";
import { getLevelLabel } from "@/game/levels/levels";
import { buildLevel } from "@/game/levels/levelBuilder";
import { SYMBOLS } from "@/game/clues/clueSystem";
import {
  actions,
  formatTime,
  getElapsedMs,
  getState,
  hintsLeft,
  useGame,
} from "@/game/state/gameStore";
import { playCue, vibrate } from "@/game/audio/AudioManager";
import { Joystick } from "./Joystick";
import { CluePanel } from "./CluePanel";

/** Cinematic in-game HUD: level + pause, timer, clue/hint tools, joystick. */
export function Hud() {
  const level = useGame((s) => s.level);
  const phase = useGame((s) => s.phase);
  const notice = useGame((s) => s.notice);
  const clueFlash = useGame((s) => s.clueFlash);
  const hintText = useGame((s) => s.hintText);
  const discovered = useGame((s) => s.discoveredClueIds);
  const panelOpen = useGame((s) => s.cluePanelOpen);
  const nearGate = useGame((s) => s.nearGate);
  const hints = useGame((s) => hintsLeft(s));
  const penaltyFlash = useGame((s) => s.penaltyFlash);
  const [time, setTime] = useState(0);

  const clueTotal = buildLevel(level).clues.length;

  useEffect(() => {
    const id = window.setInterval(() => setTime(getElapsedMs(getState())), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => actions.clearNotice(), 2600);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!clueFlash) return;
    const id = window.setTimeout(() => actions.clearClueFlash(), 4200);
    return () => window.clearTimeout(id);
  }, [clueFlash]);

  useEffect(() => {
    if (!hintText) return;
    const id = window.setTimeout(() => actions.clearHint(), 6000);
    return () => window.clearTimeout(id);
  }, [hintText]);

  const interactive = phase === "playing";
  const toneClass =
    notice?.tone === "warn"
      ? "border-destructive/50 text-foreground"
      : notice?.tone === "reward"
        ? "border-primary/50 text-primary"
        : "border-border/60 text-foreground";

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-between select-none"
        style={{
          padding:
            "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={actions.pause}
              disabled={!interactive}
              className="pointer-events-auto flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-card/50 text-foreground backdrop-blur-md transition-colors hover:bg-card/80"
              aria-label="Pause"
            >
              <Pause className="size-5" />
            </button>
            <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-2 backdrop-blur-md">
              <p className="text-[0.55rem] tracking-[0.25em] text-muted-foreground">
                LEVEL · {getLevelLabel(level)}
              </p>
              <p className="font-display text-lg leading-none">{String(level).padStart(2, "0")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-2 text-right backdrop-blur-md">
            <p className="text-[0.55rem] tracking-[0.25em] text-muted-foreground">TIME</p>
            <p className="font-display text-lg leading-none tabular-nums">{formatTime(time)}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 px-4">
          {clueFlash && (
            <div className="animate-in fade-in zoom-in-95 pointer-events-none max-w-xs rounded-2xl border border-primary/40 bg-card/85 px-5 py-3 text-center backdrop-blur-md">
              <p className="text-[0.55rem] tracking-[0.3em] text-primary">CLUE DISCOVERED</p>
              <p className="mt-1 font-display text-base tracking-[0.12em]">
                {SYMBOLS[clueFlash.symbol].glyph} {clueFlash.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{clueFlash.text}</p>
            </div>
          )}
          {hintText && (
            <div className="animate-in fade-in slide-in-from-bottom-2 pointer-events-none max-w-xs rounded-2xl border border-border/60 bg-card/85 px-5 py-3 text-center text-sm text-foreground backdrop-blur-md">
              💡 {hintText}
            </div>
          )}
          {notice && (
            <div
              className={`animate-in fade-in slide-in-from-bottom-2 rounded-full border bg-card/75 px-5 py-2 text-center text-sm backdrop-blur-md ${toneClass}`}
            >
              {notice.text}
            </div>
          )}
          {nearGate !== null && phase === "playing" && (
            <div className="animate-in fade-in pointer-events-none rounded-full border border-border/60 bg-card/80 px-5 py-1.5 font-display text-xs tracking-[0.3em] text-foreground backdrop-blur-md">
              ENTER
            </div>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <Joystick />
          <div className="pointer-events-auto flex flex-col gap-3">
            <button
              onClick={() => {
                playCue("hint");
                vibrate(10);
                actions.useHint();
              }}
              disabled={!interactive || hints <= 0}
              aria-label="Hint"
              className="flex size-16 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-foreground backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40"
            >
              <Lightbulb className="size-5" />
              <span className="mt-0.5 text-[0.55rem] tracking-[0.2em]">{hints}</span>
            </button>
            <button
              onClick={() => {
                playCue("ui");
                actions.toggleCluePanel();
              }}
              aria-label="Clues"
              className="flex size-16 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-foreground backdrop-blur-md transition-transform active:scale-95"
            >
              <BookOpen className="size-5" />
              <span className="mt-0.5 text-[0.55rem] tracking-[0.2em]">
                {discovered.length}/{clueTotal}
              </span>
            </button>
          </div>
        </div>
      </div>

      {penaltyFlash > 0 && (
        <div
          key={penaltyFlash}
          className="animate-out fade-out pointer-events-none absolute inset-0 bg-background/85 duration-1000 fill-mode-forwards"
        />
      )}

      {panelOpen && <CluePanel />}
    </>
  );
}
