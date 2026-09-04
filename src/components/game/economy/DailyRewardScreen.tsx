import { useEffect, useState } from "react";
import { Check, Coins, Gift } from "lucide-react";
import { economy, useEconomy } from "@/game/economy/EconomyService";
import { actions } from "@/game/state/gameStore";
import { playCue, vibrate } from "@/game/audio/AudioManager";
import { MenuButton, Panel, Screen } from "../ui";
import { CoinChip } from "./Wallet";

function countdown(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DailyRewardScreen() {
  // re-render on any economy change so the claim state stays live
  useEconomy((s) => s.daily.lastClaim);
  const [, tick] = useState(0);
  const [claimed, setClaimed] = useState<{ coins: number; xp: number } | null>(null);
  const status = economy.daily();

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const claim = () => {
    const g = economy.claimDailyReward();
    if (!g.granted) return;
    playCue("coin");
    vibrate([12, 30, 12]);
    setClaimed({ coins: g.coins, xp: g.xp });
  };

  return (
    <Screen dim={62}>
      <Panel wide>
        <div className="flex items-center justify-between">
          <Gift className="size-5 text-[#e0bd6b]" />
          <CoinChip compact />
        </div>
        <h2 className="mt-4 font-display text-2xl tracking-[0.28em]">DAILY REWARD</h2>
        <p className="mt-2 text-[0.6rem] tracking-[0.3em] text-muted-foreground">
          DAY {status.day} OF 7
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {status.cycle.map((amount, i) => {
            const day = i + 1;
            const past = day < status.day;
            const today = day === status.day;
            return (
              <div
                key={day}
                className={`rounded-2xl border px-1 py-3 ${
                  today && status.canClaim
                    ? "border-[#c9a24a]/70 bg-[#c9a24a]/10 shadow-[0_0_24px_-10px_#c9a24a]"
                    : past || (today && status.claimedToday)
                      ? "border-border/40 bg-background/20 opacity-60"
                      : "border-border/50 bg-background/25"
                } ${day === 7 ? "col-span-4" : ""}`}
              >
                <p className="text-[0.5rem] tracking-[0.24em] text-muted-foreground">DAY {day}</p>
                <p className="mt-1 flex items-center justify-center gap-1 font-display text-sm text-[#e8cd8a]">
                  {past ? <Check className="size-3.5 text-primary" /> : <Coins className="size-3.5" />}
                  {amount}
                </p>
                {day === 7 && (
                  <p className="mt-1 text-[0.5rem] tracking-[0.24em] text-muted-foreground">
                    + XP BONUS
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {claimed && (
          <p className="animate-in fade-in zoom-in-95 mt-5 font-display text-sm tracking-[0.2em] text-[#e8cd8a]">
            +{claimed.coins} COINS{claimed.xp ? ` · +${claimed.xp} XP` : ""}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <MenuButton onClick={claim} disabled={!status.canClaim}>
            {status.canClaim ? `CLAIM +${status.reward}` : "CLAIMED TODAY"}
          </MenuButton>
          {!status.canClaim && (
            <p className="text-[0.6rem] tracking-[0.28em] text-muted-foreground tabular-nums">
              NEXT REWARD IN {countdown(status.msUntilNext)}
            </p>
          )}
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            BACK
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}
