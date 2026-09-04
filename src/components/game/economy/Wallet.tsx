import { Coins } from "lucide-react";
import { levelFromXp } from "@/game/economy/config";
import { useEconomy } from "@/game/economy/EconomyService";

/** Gold coin chip — used in the HUD and on the menus. */
export function CoinChip({ compact = false }: { compact?: boolean }) {
  const coins = useEconomy((s) => s.coins);
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-[#c9a24a]/40 bg-card/60 backdrop-blur-md ${
        compact ? "px-3 py-1.5" : "px-4 py-2"
      }`}
    >
      <Coins className="size-4 text-[#e0bd6b]" />
      <span className="font-display text-sm tabular-nums text-[#e8cd8a]">
        {coins.toLocaleString()}
      </span>
    </div>
  );
}

/** Player level + XP progress bar. */
export function XpBar({ className = "" }: { className?: string }) {
  const xp = useEconomy((s) => s.xp);
  const { level, into, needed } = levelFromXp(xp);
  const pct = Math.min(100, (into / needed) * 100);
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">
          PLAYER LEVEL {level}
        </p>
        <p className="text-[0.55rem] tabular-nums text-muted-foreground">
          {into} / {needed} XP
        </p>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-border/60 bg-background/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c9a24a] to-[#f0d79a] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
