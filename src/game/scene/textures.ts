import * as THREE from "three";

/**
 * Lightweight procedural stone textures (canvas based) so the prototype ships
 * no heavy assets while still avoiding flat untextured surfaces.
 */
function noiseCanvas(
  size: number,
  base: [number, number, number],
  draw?: (ctx: CanvasRenderingContext2D, size: number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, size, size);
  draw?.(ctx, size);
  // speckled weathering
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 34;
    img.data[i] = Math.max(0, Math.min(255, (img.data[i] ?? 0) + n));
    img.data[i + 1] = Math.max(0, Math.min(255, (img.data[i + 1] ?? 0) + n));
    img.data[i + 2] = Math.max(0, Math.min(255, (img.data[i + 2] ?? 0) + n));
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function createWallTexture() {
  const canvas = noiseCanvas(256, [104, 98, 88], (ctx, size) => {
    // stacked brick courses
    const rows = 6;
    const h = size / rows;
    ctx.strokeStyle = "rgba(30,26,22,0.75)";
    ctx.lineWidth = 3;
    for (let r = 0; r < rows; r++) {
      const y = r * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
      const offset = r % 2 ? h : 0;
      for (let x = offset; x < size; x += h * 2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,240,220,${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(0, y + 2, size, h * 0.35);
    }
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFloorTexture() {
  const canvas = noiseCanvas(256, [62, 58, 53], (ctx, size) => {
    const tiles = 4;
    const t = size / tiles;
    ctx.strokeStyle = "rgba(24,21,18,0.8)";
    ctx.lineWidth = 4;
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
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
