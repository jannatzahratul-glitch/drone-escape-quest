/**
 * Deferred localStorage writer.
 *
 * Serialising + writing a save synchronously inside a gameplay frame (e.g. the
 * moment a clue stone is picked up) caused a visible stutter on phones. Writes
 * are now coalesced and flushed off the frame, with a guaranteed flush when the
 * page is hidden or closed, so nothing can be lost.
 */
type Writer = () => void;

const pending = new Map<string, Writer>();
let scheduled = false;

function flush() {
  scheduled = false;
  const jobs = Array.from(pending.values());
  pending.clear();
  for (const job of jobs) {
    try {
      job();
    } catch {
      /* storage unavailable — state stays in memory for this session */
    }
  }
}

export function queuePersist(key: string, write: Writer) {
  pending.set(key, write);
  if (scheduled || typeof window === "undefined") return;
  scheduled = true;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => void })
    .requestIdleCallback;
  if (ric) ric(flush, { timeout: 400 });
  else setTimeout(flush, 120);
}

export function flushPersist() {
  if (pending.size) flush();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPersist);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersist();
  });
}
