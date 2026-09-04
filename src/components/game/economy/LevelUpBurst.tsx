import { useEffect } from "react";
import { playCue, vibrate } from "@/game/audio/AudioManager";

/** Short, premium "LEVEL UP" beat shown over the results screen. */
export function LevelUpBurst({ level, onDone }: { level: number; onDone: () => void }) {
  useEffect(() => {
    playCue("levelup");
    vibrate([15, 40, 25]);
    const id = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(id);
  }, [level, onDone]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-md">
      <div className="animate-in fade-in zoom-in-90 text-center duration-500">
        <div className="mx-auto size-24 rounded-full border border-[#c9a24a]/50 bg-[#c9a24a]/10 shadow-[0_0_60px_-10px_#c9a24a]">
          <p className="flex h-full items-center justify-center font-display text-3xl text-[#e8cd8a]">
            {level}
          </p>
        </div>
        <p className="mt-5 font-display text-2xl tracking-[0.35em] text-[#e8cd8a]">LEVEL UP!</p>
        <p className="mt-2 text-[0.6rem] tracking-[0.35em] text-muted-foreground">
          PLAYER LEVEL {level} REACHED
        </p>
      </div>
    </div>
  );
}
