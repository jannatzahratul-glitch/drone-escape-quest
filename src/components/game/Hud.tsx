import { useEffect, useState } from "react";
import { Pause } from "lucide-react";
import { getLevelLabel } from "@/game/levels/levels";
import { actions, formatTime, getElapsedMs, getState, useGame } from "@/game/state/gameStore";
import { Joystick } from "./Joystick";

/** Cinematic in-game HUD: level + pause (top-left), timer (top-right), joystick. */
export function Hud() {
  const level = useGame((s) => s.level);
  const phase = useGame((s) => s.phase);
  const notice = useGame((s) => s.notice);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTime(getElapsedMs(getState())), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => actions.clearNotice(), 2600);
    return () => window.clearTimeout(id);
  }, [notice]);

  const interactive = phase === "playing";

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-between select-none"
      style={{
        padding: "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))",
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

      <div className="flex justify-center px-4">
        {notice && (
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-full border border-border/60 bg-card/75 px-5 py-2 text-center text-sm text-foreground backdrop-blur-md">
            {notice.text}
          </div>
        )}
      </div>

      <div className="flex items-end justify-start">
        <Joystick />
      </div>
    </div>
  );
}
