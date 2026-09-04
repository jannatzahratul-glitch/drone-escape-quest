import type { ReactNode } from "react";
import { playCue } from "@/game/audio/AudioManager";
import { haptics } from "@/game/haptics/HapticManager";

/** Shared dark-glass UI primitives used by every screen. */
export function Panel({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`animate-in fade-in zoom-in-95 w-full ${
        wide ? "max-w-md" : "max-w-sm"
      } rounded-3xl border border-border/60 bg-card/70 p-7 text-center shadow-2xl backdrop-blur-xl duration-300`}
    >
      {children}
    </div>
  );
}

export function Screen({ children, dim = 45 }: { children: ReactNode; dim?: number }) {
  return (
    <div
      className="absolute inset-0 overflow-y-auto overscroll-contain backdrop-blur-[6px]"
      style={{
        background: `color-mix(in oklab, var(--background) ${dim}%, transparent)`,
        padding:
          "max(1.25rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left))",
      }}
    >
      {/* min-h-full keeps short panels centred while tall panels stay scrollable */}
      <div className="flex min-h-full w-full items-center justify-center">{children}</div>
    </div>
  );
}

export function MenuButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "w-full min-h-13 rounded-2xl px-6 py-3.5 font-display text-sm tracking-[0.22em] transition-all duration-200 active:scale-[0.97] disabled:opacity-40";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-[0_0_30px_-8px_var(--primary)] hover:brightness-110"
      : "border border-border/70 bg-background/30 text-foreground hover:bg-background/60";
  return (
    <button
      disabled={disabled}
      onClick={() => {
        playCue("button");
        haptics.light();
        onClick();
      }}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}
