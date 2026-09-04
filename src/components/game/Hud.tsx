import { useEffect, useState } from "react";
import { Pause, Lightbulb } from "lucide-react";
import { actions, formatTime, getElapsedMs, getState, useGame } from "@/game/state/gameStore";
import { Joystick } from "./Joystick";

/** Cinematic in-game HUD: level + pause, timer, joystick, hint placeholder. */
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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 select-none">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={actions.pause}
            disabled={!interactive}
            className="pointer-events-auto flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-card/50 text-foreground backdrop-blur-md transition-colors hover:bg-card/80"
            aria-label="Pause"
          >
            <Pause className="size-5" />
          </button>
          <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-2 backdrop-blur-md">
            <p className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">LEVEL</p>
            <p className="font-display text-lg leading-none">{String(level).padStart(2, "0")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-2 text-right backdrop-blur-md">
          <p className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">TIME</p>
          <p className="font-display text-lg leading-none tabular-nums">{formatTime(time)}</p>
        </div>
      </div>

      {notice && (
        <div className="animate-in fade-in mx-auto rounded-full border border-destructive/40 bg-card/70 px-5 py-2 text-sm text-foreground backdrop-blur-md">
          {notice.text}
        </div>
      )}

      <div className="flex items-end justify-between">
        <Joystick />
        <button
          className="pointer-events-auto flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-card/50 text-muted-foreground backdrop-blur-md"
          aria-label="Hint (coming soon)"
          title="Hints coming soon"
        >
          <Lightbulb className="size-6" />
        </button>
      </div>
    </div>
  );
}
