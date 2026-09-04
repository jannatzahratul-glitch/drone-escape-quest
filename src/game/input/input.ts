/**
 * Unified movement input: virtual joystick (touch) + WASD/arrows (desktop).
 * The 3D player controller polls `getMoveVector()` each frame, so input
 * sources can be added later (gamepad, tilt) without touching gameplay.
 */
const joystick = { x: 0, y: 0 };
const keys = new Set<string>();

export function setJoystick(x: number, y: number) {
  joystick.x = x;
  joystick.y = y;
}

export function resetInput() {
  joystick.x = 0;
  joystick.y = 0;
  keys.clear();
}

const KEY_MAP: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export function installKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (KEY_MAP[e.code]) {
      keys.add(e.code);
      e.preventDefault();
    }
  };
  const up = (e: KeyboardEvent) => keys.delete(e.code);
  const blur = () => keys.clear();
  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}

/** Returns a vector in maze space: x = right, y = "down"/south (+Z). */
export function getMoveVector(): { x: number; y: number } {
  let x = joystick.x;
  let y = joystick.y;
  if (Math.hypot(x, y) < 0.05) {
    x = 0;
    y = 0;
    for (const code of keys) {
      const v = KEY_MAP[code];
      if (v) {
        x += v[0];
        y += v[1];
      }
    }
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}
