import { useMemo, useState } from "react";
import { Check, Coins, Crown, Lock, Sparkles, Star } from "lucide-react";
import { getLevelConfig, getLevelLabel } from "@/game/levels/levels";
import { useProgress } from "@/game/save/SaveManager";
import { actions, formatTime } from "@/game/state/gameStore";
import { playCue } from "@/game/audio/AudioManager";
import { useEconomy } from "@/game/economy/EconomyService";
import { levelFromXp, ECONOMY } from "@/game/economy/config";
import { CoinChip, XpBar } from "../economy/Wallet";
import { MenuButton } from "../ui";
import {
  CHAPTERS,
  chapterLevels,
  chapterProgress,
  isFinale,
  type Chapter,
} from "@/game/chapters/chapters";

/** Serpentine horizontal offset so the nodes read as a path, not a list. */
const offsetFor = (i: number) => Math.sin((i / 2) * Math.PI) * 26;

function Stars({ count, size = "text-xs" }: { count: number; size?: string }) {
  return (
    <p className={`${size} tracking-[0.18em] text-[#e0bd6b]`}>
      {"★★★".slice(0, count)}
      <span className="text-muted-foreground/35">{count ? "★★★".slice(count) : "———"}</span>
    </p>
  );
}

function MapBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* stone / blueprint surface */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(120% 70% at 50% 30%, #000 30%, transparent 85%)",
        }}
      />
      {/* labyrinth glyph */}
      <svg
        className="absolute left-1/2 top-16 size-[520px] -translate-x-1/2 opacity-[0.07]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden
      >
        {[6, 14, 22, 30, 38].map((r) => (
          <rect key={r} x={r} y={r} width={100 - r * 2} height={100 - r * 2} rx="2" />
        ))}
      </svg>
      {/* torch light */}
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#c9a24a]/10 blur-[80px]" />
      {/* drifting motes */}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="absolute size-[3px] rounded-full bg-[#e0bd6b]/50 animate-pulse"
          style={{
            left: `${(i * 37) % 96}%`,
            top: `${(i * 53) % 92}%`,
            animationDuration: `${2.4 + (i % 5) * 0.7}s`,
            animationDelay: `${i * 0.23}s`,
          }}
        />
      ))}
    </div>
  );
}

function LevelNode({
  id,
  index,
  state,
  stars,
  best,
  onSelect,
}: {
  id: number;
  index: number;
  state: "locked" | "unlocked" | "current" | "completed";
  stars: number;
  best?: number;
  onSelect: () => void;
}) {
  const finale = isFinale(id);
  const locked = state === "locked";
  const tone =
    state === "completed"
      ? "border-[#c9a24a]/70 bg-[#c9a24a]/10 shadow-[0_0_34px_-12px_#e0bd6b]"
      : state === "current"
        ? "border-primary/80 bg-card/70 shadow-[0_0_42px_-10px_var(--primary)]"
        : locked
          ? "border-border/30 bg-background/25"
          : "border-border/70 bg-card/50";

  return (
    <button
      disabled={locked}
      onClick={onSelect}
      style={{ transform: `translateX(${offsetFor(index)}px)` }}
      className={`relative flex w-full max-w-[19rem] items-center gap-4 rounded-2xl border ${tone} px-4 py-3 text-left backdrop-blur-md transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed ${
        locked ? "opacity-50 grayscale" : "hover:border-primary/60"
      } ${finale ? "py-5" : ""}`}
    >
      {state === "current" && (
        <span className="absolute inset-0 -z-10 animate-pulse rounded-2xl bg-primary/15 blur-md" />
      )}
      <div
        className={`grid shrink-0 place-items-center rounded-xl border ${
          finale ? "size-14 border-[#c9a24a]/60" : "size-11 border-border/60"
        } bg-background/50`}
      >
        {locked ? (
          <Lock className="size-4 text-muted-foreground" />
        ) : finale ? (
          <Crown className="size-6 text-[#e0bd6b]" />
        ) : state === "completed" ? (
          <Check className="size-5 text-[#e0bd6b]" />
        ) : (
          <span className="font-display text-base">{String(id).padStart(2, "0")}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-sm tracking-[0.18em]">LEVEL {id}</p>
        <p className="mt-0.5 text-[0.5rem] tracking-[0.26em] text-muted-foreground">
          {finale ? "CHAPTER FINALE" : locked ? "LOCKED" : getLevelLabel(id)}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <Stars count={locked ? 0 : stars} size="text-[0.7rem]" />
          {best !== undefined && (
            <span className="text-[0.55rem] tabular-nums tracking-[0.16em] text-primary">
              BEST {formatTime(best)}
            </span>
          )}
        </div>
      </div>

      {state === "current" && (
        <span className="font-display text-[0.55rem] tracking-[0.3em] text-primary">PLAY</span>
      )}
      {finale && !locked && (
        <Sparkles className="absolute -right-1 -top-1 size-4 animate-pulse text-[#e0bd6b]" />
      )}
    </button>
  );
}

function LevelPreview({ id, onClose }: { id: number; onClose: () => void }) {
  const unlocked = useProgress((p) => p.unlocked);
  const stars = useProgress((p) => p.stars[id] ?? 0);
  const best = useProgress((p) => p.bestMs[id]);
  const bestScore = useProgress((p) => p.bestScore[id]);
  const completed = useProgress((p) => p.completed.includes(id));
  const locked = id > unlocked;
  const cfg = getLevelConfig(id);
  const xpEstimate = ECONOMY.xp.completionBase + ECONOMY.xp.completionPerLevel * (id - 1);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-background/70 p-4 backdrop-blur-md sm:items-center">
      <div className="animate-in slide-in-from-bottom-6 fade-in w-full max-w-sm rounded-3xl border border-border/60 bg-card/85 p-6 shadow-2xl duration-300">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl tracking-[0.22em]">LEVEL {id}</h3>
          <span className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">
            {isFinale(id) ? "CHAPTER FINALE" : getLevelLabel(id)}
          </span>
        </div>
        <p className="mt-1 text-[0.6rem] tracking-[0.22em] text-primary">{cfg.subtitle}</p>

        {locked ? (
          <>
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-background/40 p-6">
              <Lock className="size-6 text-muted-foreground" />
              <p className="font-display text-xs tracking-[0.3em] text-muted-foreground">LOCKED</p>
              <p className="text-center text-[0.65rem] text-muted-foreground">
                Complete Level {id - 1} to unlock this level.
              </p>
            </div>
            <div className="mt-6">
              <MenuButton variant="ghost" onClick={onClose}>
                BACK
              </MenuButton>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-border/50 bg-background/30 py-3">
                <p className="text-[0.45rem] tracking-[0.2em] text-muted-foreground">BEST TIME</p>
                <p className="mt-1 font-display text-sm tabular-nums">
                  {best !== undefined ? formatTime(best) : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/30 py-3">
                <p className="text-[0.45rem] tracking-[0.2em] text-muted-foreground">BEST SCORE</p>
                <p className="mt-1 font-display text-sm tabular-nums">{bestScore ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/30 py-3">
                <p className="text-[0.45rem] tracking-[0.2em] text-muted-foreground">STARS</p>
                <div className="mt-1.5">
                  <Stars count={stars} size="text-[0.7rem]" />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 rounded-2xl border border-border/50 bg-background/30 py-3 text-[0.6rem] tracking-[0.18em]">
              <span className="flex items-center gap-1.5 text-[#e8cd8a]">
                <Coins className="size-3.5" /> {ECONOMY.coins.byStars[1]}–
                {ECONOMY.coins.byStars[3] + ECONOMY.coins.noHintBonus} COINS
              </span>
              <span className="text-primary">XP {xpEstimate}+</span>
            </div>

            <ul className="mt-3 space-y-1 rounded-2xl border border-border/50 bg-background/30 p-3 text-[0.6rem] tracking-[0.14em] text-muted-foreground">
              <li>✓ Find the correct exit</li>
              <li>✓ Discover clues</li>
              <li>✓ Explore the maze</li>
            </ul>

            <div className="mt-6 space-y-3">
              <MenuButton
                onClick={() => {
                  actions.startLevel(id);
                }}
              >
                {completed ? "PLAY AGAIN" : "PLAY"}
              </MenuButton>
              <MenuButton variant="ghost" onClick={onClose}>
                BACK
              </MenuButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChapterCompleteBanner({ chapter }: { chapter: Chapter }) {
  const prog = chapterProgress(chapter);
  return (
    <div className="mt-4 rounded-2xl border border-[#c9a24a]/50 bg-[#c9a24a]/10 p-4 text-center">
      <p className="font-display text-sm tracking-[0.3em] text-[#e8cd8a]">CHAPTER COMPLETE</p>
      <p className="mt-1 text-[0.6rem] tracking-[0.28em] text-muted-foreground">{chapter.name}</p>
      <p className="mt-2 font-display text-xs tracking-[0.2em]">
        {prog.total} / {prog.total} LEVELS COMPLETE
      </p>
      <p className="mt-1 text-[0.65rem] tracking-[0.2em] text-[#e0bd6b]">
        ★ {prog.stars} / {prog.maxStars} STARS
      </p>
    </div>
  );
}

export function LevelMapScreen() {
  const unlocked = useProgress((p) => p.unlocked);
  const completed = useProgress((p) => p.completed);
  const bestMs = useProgress((p) => p.bestMs);
  const starMap = useProgress((p) => p.stars);
  const xp = useEconomy((e) => e.xp);
  const [selected, setSelected] = useState<number | null>(null);

  const chapter = CHAPTERS[0]!;
  const levels = useMemo(() => chapterLevels(chapter), [chapter]);
  const prog = chapterProgress(chapter);
  const current = Math.min(unlocked, chapter.to);

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain bg-background/80 backdrop-blur-[6px]">
      <MapBackdrop />

      <div className="relative mx-auto w-full max-w-md px-5 pb-10 pt-6">
        {/* chapter header */}
        <div className="text-center">
          <p className="text-[0.5rem] tracking-[0.45em] text-muted-foreground">CHAPTER 1</p>
          <h2 className="mt-2 font-display text-2xl tracking-[0.26em]">{chapter.name}</h2>
          <p className="mt-1 text-[0.55rem] tracking-[0.24em] text-muted-foreground">
            {chapter.subtitle}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-[0.6rem] tracking-[0.2em]">
            <span className="text-foreground/80">
              {prog.completed} / {prog.total} LEVELS
            </span>
            <span className="flex items-center gap-1 text-[#e0bd6b]">
              <Star className="size-3" fill="currentColor" /> {prog.stars} / {prog.maxStars}
            </span>
            <span className="text-primary">{prog.percent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-border/50 bg-background/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-[#e0bd6b] transition-[width] duration-700"
              style={{ width: `${prog.percent}%` }}
            />
          </div>
        </div>

        {/* player profile */}
        <div className="mt-5 space-y-3 rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
          <XpBar />
          <div className="flex justify-center">
            <CoinChip compact />
          </div>
        </div>

        {prog.finished && <ChapterCompleteBanner chapter={chapter} />}

        {/* the path */}
        <div className="relative mt-6 flex flex-col items-center gap-3">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
          {levels.map((id, i) => {
            const state =
              id > unlocked
                ? "locked"
                : completed.includes(id)
                  ? "completed"
                  : id === current
                    ? "current"
                    : "unlocked";
            return (
              <LevelNode
                key={id}
                id={id}
                index={i}
                state={state}
                stars={starMap[id] ?? 0}
                best={bestMs[id]}
                onSelect={() => {
                  playCue("ui");
                  setSelected(id);
                }}
              />
            );
          })}
        </div>

        {/* future chapters */}
        <div className="mt-8 space-y-2">
          {CHAPTERS.filter((c) => !c.active).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-dashed border-border/40 bg-background/20 px-4 py-3 opacity-60"
            >
              <div>
                <p className="font-display text-[0.7rem] tracking-[0.2em] text-muted-foreground">
                  {c.name}
                </p>
                <p className="text-[0.5rem] tracking-[0.24em] text-muted-foreground/70">
                  LEVELS {c.from}–{c.to}
                </p>
              </div>
              <span className="text-[0.5rem] tracking-[0.3em] text-muted-foreground">
                COMING SOON
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            BACK
          </MenuButton>
        </div>
      </div>

      {selected !== null && <LevelPreview id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
