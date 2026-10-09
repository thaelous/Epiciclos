/**
 * High-definition procedural antique parchment & burned wood texture generator
 * Provides realistic fibrous paper grain, charred scorch marks, organic mottling,
 * and heat-singed vignette for the 'burned' theme and HD video export.
 */

let cachedTextureCanvas: HTMLCanvasElement | null = null;
let cachedHDTextureCanvas: HTMLCanvasElement | null = null;

// Multi-octave pseudo-random noise for deterministic, reproducible grain
function createNoiseBuffer(width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Simple LCG PRNG for consistent organic patterns
  let seed = 42891;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(rnd() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  return imgData;
}

export function generateBurnedTexture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Warm antique parchment / aged paper base gradient
  const baseGrad = ctx.createRadialGradient(
    width * 0.48, height * 0.52, Math.min(width, height) * 0.15,
    width * 0.5, height * 0.5, Math.max(width, height) * 0.75
  );
  baseGrad.addColorStop(0, '#f2e5cb');
  baseGrad.addColorStop(0.35, '#ebd4aa');
  baseGrad.addColorStop(0.7, '#dfc498');
  baseGrad.addColorStop(0.9, '#c69d67');
  baseGrad.addColorStop(1, '#8b5a2b');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Organic stains and tea/coffee mottling
  let seed = 91823;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 28; i++) {
    const cx = rnd() * width;
    const cy = rnd() * height;
    const rx = (0.08 + rnd() * 0.25) * width;
    const ry = (0.08 + rnd() * 0.25) * height;
    const rot = rnd() * Math.PI;

    const stainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    const alpha = 0.04 + rnd() * 0.08;
    stainGrad.addColorStop(0, `rgba(180, 130, 80, ${alpha * 1.5})`);
    stainGrad.addColorStop(0.6, `rgba(140, 90, 45, ${alpha})`);
    stainGrad.addColorStop(1, 'rgba(140, 90, 45, 0)');

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.fillStyle = stainGrad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 3. Charred burned perimeter and singed edge patches
  ctx.save();
  const burnEdge = ctx.createRadialGradient(
    width * 0.5, height * 0.5, Math.min(width, height) * 0.32,
    width * 0.5, height * 0.5, Math.max(width, height) * 0.72
  );
  burnEdge.addColorStop(0, 'rgba(60, 25, 6, 0)');
  burnEdge.addColorStop(0.55, 'rgba(80, 35, 10, 0.15)');
  burnEdge.addColorStop(0.8, 'rgba(60, 22, 5, 0.45)');
  burnEdge.addColorStop(0.95, 'rgba(35, 12, 3, 0.75)');
  burnEdge.addColorStop(1, 'rgba(18, 6, 1, 0.92)');

  ctx.fillStyle = burnEdge;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 4. Fine wood-grain / fibrous paper micro-streaks
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.strokeStyle = 'rgba(120, 75, 30, 0.06)';
  ctx.lineWidth = 1;
  const numFibers = Math.floor(Math.min(width, height) * 0.6);
  for (let i = 0; i < numFibers; i++) {
    const y = rnd() * height;
    const len = (0.2 + rnd() * 0.6) * width;
    const startX = rnd() * (width - len);
    const wobble = (rnd() - 0.5) * 4;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(startX + len * 0.5, y + wobble, startX + len, y);
    ctx.stroke();
  }
  ctx.restore();

  // 5. High-resolution organic paper pulp grain
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const gCtx = grainCanvas.getContext('2d');
  if (gCtx) {
    const noiseData = createNoiseBuffer(256, 256);
    gCtx.putImageData(noiseData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.22;
    const pattern = ctx.createPattern(grainCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  // 6. Occasional vintage scorch specks / embers
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 40; i++) {
    const sx = rnd() * width;
    const sy = rnd() * height;
    const rad = 0.8 + rnd() * 2.2;
    const distFromCenter = Math.hypot(sx - width / 2, sy - height / 2) / (Math.max(width, height) * 0.5);
    // More scorch specks closer to the charred edges
    if (rnd() < distFromCenter * 1.4) {
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${30 + Math.floor(rnd() * 20)}, ${12 + Math.floor(rnd() * 10)}, 4, ${0.3 + rnd() * 0.4})`;
      ctx.fill();
    }
  }
  ctx.restore();

  return canvas;
}

/**
 * Renders the realistic aged parchment / burned wood background onto the canvas
 */
export function drawBurnedBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (!cachedTextureCanvas || cachedTextureCanvas.width !== width || cachedTextureCanvas.height !== height) {
    cachedTextureCanvas = generateBurnedTexture(width, height);
  }
  ctx.drawImage(cachedTextureCanvas, 0, 0, width, height);
}

/**
 * Applies the realistic burned paper texture as an authentic physical overlay mask over the canvas,
 * embedding the drawn strokes and epicircles into the physical fibers of the burnt parchment.
 */
export function drawBurnedOverlayMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number = 0.35
): void {
  if (!cachedTextureCanvas) {
    cachedTextureCanvas = generateBurnedTexture(width, height);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = alpha;
  ctx.drawImage(cachedTextureCanvas, 0, 0, width, height);
  ctx.restore();
}

/**
 * HD Export specialized texture rendering
 */
export function drawBurnedBackgroundHD(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (!cachedHDTextureCanvas || cachedHDTextureCanvas.width !== width || cachedHDTextureCanvas.height !== height) {
    cachedHDTextureCanvas = generateBurnedTexture(width, height);
  }
  ctx.drawImage(cachedHDTextureCanvas, 0, 0, width, height);
}

export function drawBurnedOverlayMaskHD(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  if (!cachedHDTextureCanvas) {
    cachedHDTextureCanvas = generateBurnedTexture(width, height);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.35;
  ctx.drawImage(cachedHDTextureCanvas, 0, 0, width, height);
  ctx.restore();
}
