import * as THREE from "three";

/**
 * Procedural stone textures (canvas based) — no heavy assets to download.
 * Each generator returns a colour map plus a matching bump map so surfaces
 * catch torch light with real relief instead of looking flat.
 */

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  return canvas;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, amount: number) {
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] = Math.max(0, Math.min(255, (img.data[i] ?? 0) + n));
    img.data[i + 1] = Math.max(0, Math.min(255, (img.data[i + 1] ?? 0) + n));
    img.data[i + 2] = Math.max(0, Math.min(255, (img.data[i + 2] ?? 0) + n));
  }
  ctx.putImageData(img, 0, 0);
}

/** Hairline cracks and chips, drawn as short branching strokes. */
function cracks(ctx: CanvasRenderingContext2D, size: number, count: number, colour: string) {
  ctx.strokeStyle = colour;
  for (let i = 0; i < count; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    let a = Math.random() * Math.PI * 2;
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 4 + Math.floor(Math.random() * 6);
    for (let s = 0; s < segs; s++) {
      a += (Math.random() - 0.5) * 1.1;
      x += Math.cos(a) * (size * 0.04);
      y += Math.sin(a) * (size * 0.04);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function finish(canvas: HTMLCanvasElement, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(repeat, repeat);
  return tex;
}

function bumpFrom(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size: number) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Rough hewn block wall — the main maze material. */
export function createWallTextures(size = 256) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(96,90,80)";
  ctx.fillRect(0, 0, size, size);

  const rows = 5;
  const h = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * h;
    const offset = r % 2 ? h * 0.9 : 0;
    for (let x = -h; x < size; x += h * 1.8) {
      const bx = x + offset;
      const bw = h * 1.8 - 4;
      // each block gets its own tone so the wall never reads as one flat slab
      const tone = 78 + Math.random() * 42;
      ctx.fillStyle = `rgb(${tone},${tone * 0.95},${tone * 0.86})`;
      ctx.fillRect(bx + 2, y + 2, bw, h - 4);
      // top-lit bevel + bottom shade
      ctx.fillStyle = "rgba(255,236,205,0.10)";
      ctx.fillRect(bx + 2, y + 2, bw, h * 0.18);
      ctx.fillStyle = "rgba(12,10,8,0.28)";
      ctx.fillRect(bx + 2, y + h - h * 0.2, bw, h * 0.18);
    }
  }
  // mortar
  ctx.strokeStyle = "rgba(26,22,18,0.85)";
  ctx.lineWidth = 3;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * h);
    ctx.lineTo(size, r * h);
    ctx.stroke();
  }
  cracks(ctx, size, Math.round(size / 12), "rgba(20,16,13,0.55)");
  // damp patches
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(30,36,32,${0.04 + Math.random() * 0.07})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      size * 0.08,
      size * 0.14,
      Math.random(),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  speckle(ctx, size, 30);

  const bump = bumpFrom((bctx, s) => {
    const bh = s / rows;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 ? bh * 0.9 : 0;
      for (let x = -bh; x < s; x += bh * 1.8) {
        bctx.fillStyle = `rgb(${170 + Math.random() * 50},${170},${170})`;
        bctx.fillRect(x + offset + 3, r * bh + 3, bh * 1.8 - 6, bh - 6);
      }
    }
    bctx.strokeStyle = "rgb(40,40,40)";
    bctx.lineWidth = 4;
    for (let r = 0; r <= rows; r++) {
      bctx.beginPath();
      bctx.moveTo(0, r * bh);
      bctx.lineTo(s, r * bh);
      bctx.stroke();
    }
    cracks(bctx, s, Math.round(s / 12), "rgb(50,50,50)");
  }, size);

  return { map: finish(canvas), bumpMap: bump };
}

/** Worn flagstone floor. */
export function createFloorTextures(size = 256) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(58,54,49)";
  ctx.fillRect(0, 0, size, size);

  const tiles = 3;
  const t = size / tiles;
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const tone = 52 + Math.random() * 30;
      ctx.fillStyle = `rgb(${tone},${tone * 0.96},${tone * 0.9})`;
      ctx.fillRect(tx * t + 3, ty * t + 3, t - 6, t - 6);
      ctx.fillStyle = "rgba(255,240,215,0.05)";
      ctx.fillRect(tx * t + 3, ty * t + 3, t - 6, 4);
    }
  }
  ctx.strokeStyle = "rgba(20,17,14,0.9)";
  ctx.lineWidth = 5;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath();
    ctx.moveTo(i * t, 0);
    ctx.lineTo(i * t, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * t);
    ctx.lineTo(size, i * t);
    ctx.stroke();
  }
  cracks(ctx, size, Math.round(size / 16), "rgba(18,15,12,0.6)");
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(210,200,180,${Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, Math.random() * size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, size, 24);

  const bump = bumpFrom((bctx, s) => {
    const bt = s / tiles;
    for (let ty = 0; ty < tiles; ty++) {
      for (let tx = 0; tx < tiles; tx++) {
        const v = 160 + Math.random() * 50;
        bctx.fillStyle = `rgb(${v},${v},${v})`;
        bctx.fillRect(tx * bt + 4, ty * bt + 4, bt - 8, bt - 8);
      }
    }
    cracks(bctx, s, Math.round(s / 16), "rgb(60,60,60)");
  }, size);

  return { map: finish(canvas), bumpMap: bump };
}

/** Heavy timber door with iron banding, used on every gate. */
export function createDoorTextures(size = 256) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(58,40,26)";
  ctx.fillRect(0, 0, size, size);
  const planks = 5;
  const w = size / planks;
  for (let i = 0; i < planks; i++) {
    const tone = 48 + Math.random() * 26;
    ctx.fillStyle = `rgb(${tone + 12},${tone * 0.72},${tone * 0.45})`;
    ctx.fillRect(i * w + 2, 0, w - 4, size);
    // wood grain
    ctx.strokeStyle = "rgba(28,18,10,0.35)";
    ctx.lineWidth = 1;
    for (let g = 0; g < 7; g++) {
      const gx = i * w + 4 + Math.random() * (w - 8);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      for (let y = 0; y < size; y += 16) ctx.lineTo(gx + Math.sin(y * 0.05) * 2.5, y);
      ctx.stroke();
    }
  }
  // iron bands + rivets
  [0.18, 0.78].forEach((p) => {
    ctx.fillStyle = "rgb(46,44,45)";
    ctx.fillRect(0, size * p, size, size * 0.09);
    ctx.fillStyle = "rgba(150,148,145,0.25)";
    ctx.fillRect(0, size * p, size, 3);
    for (let r = 0; r < 8; r++) {
      ctx.fillStyle = "rgb(96,92,88)";
      ctx.beginPath();
      ctx.arc(size * 0.07 + r * size * 0.125, size * (p + 0.045), size * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  speckle(ctx, size, 20);
  return { map: finish(canvas) };
}

/** Glowing carved rune plaque used by clue stones and gate lintels. */
export function createSymbolTexture(glyph: string, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#151109";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "#3a2f1f";
  g.lineWidth = size * 0.05;
  g.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
  g.shadowColor = "#ffc06a";
  g.shadowBlur = size * 0.18;
  g.fillStyle = "#ffcf92";
  g.font = `${Math.floor(size * 0.6)}px serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(glyph, size / 2, size * 0.54);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ *
 * Shared texture cache
 *
 * Canvas texture generation (and the first GPU upload) is the single most
 * expensive thing that can happen mid-gameplay. Every texture is therefore
 * created once per (kind,size) and reused by every object that needs it —
 * clue stones, gates and walls all share the same GPU resources.
 * ------------------------------------------------------------------ */
type WallSet = ReturnType<typeof createWallTextures>;
const wallCache = new Map<number, WallSet>();
const floorCache = new Map<number, WallSet>();
const doorCache = new Map<number, ReturnType<typeof createDoorTextures>>();
const symbolCache = new Map<string, THREE.Texture>();

export function getWallTextures(size = 256) {
  let t = wallCache.get(size);
  if (!t) wallCache.set(size, (t = createWallTextures(size)));
  return t;
}
export function getFloorTextures(size = 256) {
  let t = floorCache.get(size);
  if (!t) floorCache.set(size, (t = createFloorTextures(size)));
  return t;
}
export function getDoorTextures(size = 256) {
  let t = doorCache.get(size);
  if (!t) doorCache.set(size, (t = createDoorTextures(size)));
  return t;
}
export function getSymbolTexture(glyph: string, size = 128) {
  const key = `${glyph}@${size}`;
  let t = symbolCache.get(key);
  if (!t) symbolCache.set(key, (t = createSymbolTexture(glyph, size)));
  return t;
}

/**
 * Warm every texture a level needs *before* gameplay starts, so walking up to
 * a clue stone never triggers a canvas draw or a texture upload mid-frame.
 */
export function preloadSceneTextures(textureSize: number, glyphs: string[]) {
  if (typeof document === "undefined") return;
  getWallTextures(textureSize);
  getFloorTextures(textureSize);
  getDoorTextures(textureSize);
  const s = Math.min(256, textureSize);
  for (const g of glyphs) getSymbolTexture(g, s);
}
