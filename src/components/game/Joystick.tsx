import { useCallback, useRef, useState } from "react";
import { setJoystick } from "@/game/input/input";

/** Touch/mouse virtual joystick, bottom-left. Writes into the input module. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const update = useCallback((clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob({ x: dx, y: dy });
    setJoystick(dx / max, dy / max);
  }, []);

  const end = useCallback(() => {
    pointerId.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    setJoystick(0, 0);
  }, []);

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        setActive(true);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerId.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      className="pointer-events-auto relative size-36 touch-none rounded-full border border-border/60 bg-card/40 backdrop-blur-md transition-opacity select-none"
      style={{ opacity: active ? 1 : 0.75 }}
      aria-label="Movement joystick"
    >
      <div className="absolute inset-4 rounded-full border border-border/40" />
      <div
        className="absolute top-1/2 left-1/2 size-14 rounded-full border border-primary/50 bg-primary/70 shadow-lg"
        style={{
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          transition: active ? "none" : "transform 160ms ease-out",
        }}
      />
    </div>
  );
}
