import { useEffect, useState } from "react";
import { Coins, Sparkles } from "lucide-react";
import type { RewardLine } from "@/game/economy/levelRewards";
import { playCue } from "@/game/audio/AudioManager";

/** Counts a number up so the payout feels earned rather than printed. */
function useCountUp(target: number, run: boolean, ms = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return value;
}

function Column({
  title,
  icon,
  lines,
  total,
  run,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  lines: RewardLine[];
  total: number;
  run: boolean;
  accent: string;
}) {
  const shown = useCountUp(total, run);
  return (
    <div className="rounded-2xl border border-border/50 bg-background/30 p-3 text-left">
      <p className="flex items-center gap-1.5 text-[0.5rem] tracking-[0.28em] text-muted-foreground">
        {icon}
        {title}
      </p>
      <div className="mt-2 space-y-1">
        {lines.map((l, i) => (
          <div
            key={l.label}
            className="animate-in fade-in slide-in-from-bottom-1 flex justify-between text-[0.65rem]"
            style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
          >
            <span className="text-muted-foreground">{l.label}</span>
            <span className="tabular-nums text-foreground">+{l.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t border-border/50 pt-2">
        <span className="text-[0.55rem] tracking-[0.2em] text-muted-foreground">TOTAL</span>
        <span className="font-display text-sm tabular-nums" style={{ color: accent }}>
          +{shown}
        </span>
      </div>
    </div>
  );
}

export function RewardBreakdown({
  coinLines,
  xpLines,
  coinTotal,
  xpTotal,
  run,
}: {
  coinLines: RewardLine[];
  xpLines: RewardLine[];
  coinTotal: number;
  xpTotal: number;
  run: boolean;
}) {
  useEffect(() => {
    if (run) playCue("coin");
  }, [run]);
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Column
        title="COINS"
        icon={<Coins className="size-3 text-[#e0bd6b]" />}
        lines={coinLines}
        total={coinTotal}
        run={run}
        accent="#e8cd8a"
      />
      <Column
        title="XP"
        icon={<Sparkles className="size-3 text-primary" />}
        lines={xpLines}
        total={xpTotal}
        run={run}
        accent="var(--primary)"
      />
    </div>
  );
}
