import { useMemo } from "react";

/**
 * Lightweight cinematic menu backdrop.
 *
 * Pure CSS/DOM (no WebGL) so the first screen paints instantly and no maze
 * geometry is loaded while the player browses menus: distant stone walls,
 * drifting fog, a slow light sweep and a few dust motes.
 */
export function MenuBackdrop() {
  const dust = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 61) % 100,
        size: 1 + ((i * 7) % 3),
        delay: (i * 1.7) % 12,
        dur: 16 + ((i * 5) % 14),
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
      {/* distant maze walls */}
      <div
        className="absolute inset-0 opacity-[0.5] animate-[menu-drift_60s_ease-in-out_infinite_alternate]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in oklab, var(--muted) 55%, transparent) 0 2px, transparent 2px 46px), repeating-linear-gradient(0deg, color-mix(in oklab, var(--muted) 35%, transparent) 0 2px, transparent 2px 46px)",
          maskImage: "radial-gradient(ellipse at 50% 60%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 60%, black 0%, transparent 72%)",
          transform: "perspective(600px) rotateX(58deg) scale(1.6)",
          transformOrigin: "50% 100%",
        }}
      />
      {/* fog banks */}
      <div className="absolute -inset-x-1/4 bottom-0 h-2/3 animate-[menu-fog_28s_ease-in-out_infinite_alternate] bg-[radial-gradient(ellipse_at_30%_100%,color-mix(in_oklab,var(--card)_75%,transparent),transparent_65%)] blur-2xl" />
      <div className="absolute -inset-x-1/4 top-0 h-1/2 animate-[menu-fog_36s_ease-in-out_infinite_alternate-reverse] bg-[radial-gradient(ellipse_at_70%_0%,color-mix(in_oklab,var(--card)_60%,transparent),transparent_70%)] blur-3xl" />
      {/* slow moving light */}
      <div className="absolute inset-0 animate-[menu-sweep_22s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_58%)]" />
      {/* dust motes */}
      {dust.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-foreground/25"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animation: `menu-dust ${d.dur}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
      {/* vignette keeps text readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--background)_100%)]" />
    </div>
  );
}
