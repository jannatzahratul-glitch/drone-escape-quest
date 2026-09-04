/**
 * Lightweight loading screen — only rendered while the 3D gameplay chunk and
 * the maze are actually being prepared (Suspense fallback). No fake delay.
 */
export function LoadingScreen({ label = "Preparing the maze…" }: { label?: string }) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background"
      role="status"
      aria-live="polite"
    >
      <h1 className="font-display text-2xl tracking-[0.32em] text-foreground">MAZE ESCAPE</h1>
      <p className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">{label}</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted/50">
        <div className="h-full w-1/3 animate-[menu-sweep_1.4s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>
    </div>
  );
}
