import { getLevelConfig, getLevelLabel } from "@/game/levels/levels";
import { bestTime, useProgress } from "@/game/save/SaveManager";
import { actions, formatTime, useGame } from "@/game/state/gameStore";
import { STAR_LABEL } from "@/game/progression/scoring";
import { useEffect, useState } from "react";
import { MenuButton, Panel, Screen } from "./ui";
import { CoinChip, XpBar } from "./economy/Wallet";
import { RewardBreakdown } from "./economy/RewardBreakdown";
import { LevelUpBurst } from "./economy/LevelUpBurst";
import { TOTAL_LEVELS } from "@/game/levels/levels";
import { Unlock } from "lucide-react";

export function PauseScreen() {
  const level = useGame((s) => s.level);
  const confirmRestart = useGame((s) => s.confirmRestart);

  if (confirmRestart) {
    return (
      <Screen dim={65}>
        <Panel>
          <h2 className="font-display text-xl tracking-[0.28em]">RESTART LEVEL?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your current attempt will be lost. Coins, XP, stars, best time and best score are kept.
          </p>
          <div className="mt-7 space-y-3">
            <MenuButton variant="ghost" onClick={actions.cancelRestart}>
              CANCEL
            </MenuButton>
            <MenuButton onClick={actions.restart}>RESTART</MenuButton>
          </div>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen dim={55}>
      <Panel>
        <h2 className="font-display text-2xl tracking-[0.3em]">PAUSED</h2>
        <p className="mt-2 text-[0.65rem] tracking-[0.35em] text-muted-foreground">
          {getLevelConfig(level).name} · {getLevelLabel(level)}
        </p>
        <div className="mt-8 space-y-3">
          <MenuButton onClick={actions.resume}>RESUME</MenuButton>
          <MenuButton variant="ghost" onClick={actions.askRestart}>
            RESTART LEVEL
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.showLevels}>
            LEVEL MAP
          </MenuButton>
          <MenuButton variant="ghost" onClick={() => actions.showSettings("paused")}>
            SETTINGS
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            MAIN MENU
          </MenuButton>
        </div>
        <p className="mt-6 text-[0.6rem] text-muted-foreground">
          Your attempt is safe while paused.
        </p>
      </Panel>
    </Screen>
  );
}

export function LevelCompleteScreen() {
  const finalMs = useGame((s) => s.finalMs);
  const level = useGame((s) => s.level);
  const isNewBest = useGame((s) => s.isNewBest);
  const result = useGame((s) => s.result);
  const rewards = useGame((s) => s.rewards);
  const levelUp = useGame((s) => s.levelUp);
  const unlockedFlash = useGame((s) => s.unlockedFlash);
  const [showRewards, setShowRewards] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShowRewards(true), levelUp ? 2300 : 400);
    return () => window.clearTimeout(id);
  }, [levelUp]);
  useProgress((p) => p.bestMs[level]);
  const best = bestTime(level) ?? finalMs;
  const stars = result?.stars ?? 1;

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl border border-border/50 bg-background/30 px-2 py-3">
      <p className="text-[0.5rem] tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base tabular-nums">{value}</p>
    </div>
  );

  return (
    <Screen dim={50}>
      {levelUp !== null && <LevelUpBurst level={levelUp} onDone={actions.clearLevelUp} />}
      <Panel>
        <h2 className="font-display text-2xl tracking-[0.26em] text-primary">LEVEL COMPLETE</h2>
        <p className="mt-2 text-[0.6rem] tracking-[0.3em] text-muted-foreground">
          {getLevelConfig(level).name} · {getLevelConfig(level).subtitle}
        </p>

        <div className="animate-in zoom-in-90 mt-5 duration-500">
          <p className="font-display text-3xl tracking-[0.2em] text-primary">
            {"★★★".slice(0, stars)}
            <span className="text-muted-foreground/40">{"★★★".slice(stars)}</span>
          </p>
          <p className="mt-1 text-[0.6rem] tracking-[0.35em] text-muted-foreground">
            {STAR_LABEL[stars]}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-background/30 py-4">
            <p className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">TIME</p>
            <p className="font-display text-2xl tabular-nums">{formatTime(finalMs)}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/30 py-4">
            <p className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">BEST TIME</p>
            <p className="font-display text-2xl tabular-nums text-primary">{formatTime(best)}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="CLUES" value={`${result?.cluesFound ?? 0}/${result?.cluesTotal ?? 0}`} />
          <Stat label="HINTS" value={String(result?.hintsUsed ?? 0)} />
          <Stat label="WRONG GATES" value={String(result?.wrongGates ?? 0)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="SCORE" value={String(result?.score ?? 0)} />
          <Stat label="STARS" value={`${stars}/3`} />
        </div>

        {rewards && (
          <RewardBreakdown
            coinLines={rewards.coinLines}
            xpLines={rewards.xpLines}
            coinTotal={rewards.coinTotal}
            xpTotal={rewards.xpTotal}
            run={showRewards}
          />
        )}

        <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-background/30 p-4">
          <XpBar />
          <div className="flex justify-center">
            <CoinChip compact />
          </div>
        </div>

        {unlockedFlash !== null && (
          <div className="animate-in fade-in zoom-in-95 mt-4 rounded-2xl border border-[#c9a24a]/50 bg-[#c9a24a]/10 p-4">
            <p className="flex items-center justify-center gap-2 font-display text-xs tracking-[0.28em] text-[#e8cd8a]">
              <Unlock className="size-4" /> LEVEL {unlockedFlash} UNLOCKED
            </p>
            <button
              onClick={actions.clearUnlockedFlash}
              className="mt-3 w-full rounded-xl border border-[#c9a24a]/40 py-2 text-[0.6rem] tracking-[0.3em] text-[#e8cd8a] active:scale-[0.97]"
            >
              CONTINUE
            </button>
          </div>
        )}

        {isNewBest && (
          <p className="mt-3 text-[0.6rem] tracking-[0.3em] text-primary">NEW RECORD</p>
        )}

        <div className="mt-7 space-y-3">
          <MenuButton onClick={actions.nextLevel}>
            {level >= TOTAL_LEVELS ? "LEVEL MAP" : "NEXT LEVEL"}
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.restart}>
            RETRY
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.showLevels}>
            LEVEL MAP
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}

/** Short cinematic beat while the real gate swings open. */
export function EscapingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-24">
      <p className="animate-in fade-in slide-in-from-bottom-4 rounded-full border border-primary/40 bg-card/70 px-6 py-2 font-display text-sm tracking-[0.3em] text-primary backdrop-blur-md">
        THE GATE OPENS
      </p>
    </div>
  );
}
