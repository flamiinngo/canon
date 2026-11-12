/**
 * Canon generative art engine (Canvas 2D).
 *
 * A work's genome is a seed, a base style, a palette and an ordered list of
 * transforms. A derivative copies its parent's genome and appends one
 * transform, so every derivative visibly descends from its parent.
 */

export type Style = "flow" | "rings" | "strata";
export type Transform = "relief" | "motion" | "recolor" | "fragment" | "pixel";

export interface Genome {
  seed: number;
  style: Style;
  palette: PaletteName;
  transforms: Transform[];
}

export const PALETTES = {
  ember: ["#0d0a09", "#ff5b2e", "#ffb35c", "#f4e9da", "#8a2f1c", "#ffd9a8"],
  nocturne: ["#05070d", "#4b6bff", "#9ab8ff", "#e8eeff", "#1b2a6b", "#7cf2e0"],
  violet: ["#0b0714", "#b57bff", "#ff7ad9", "#f5e8ff", "#3d1e6b", "#7a5cff"],
  tidal: ["#03100f", "#2fe0c0", "#9bffe8", "#e6fff8", "#0f5c55", "#ffd36b"],
  quarry: ["#12100d", "#d9c3a0", "#8c6e4a", "#f2e6d0", "#4a3b2a", "#ff7a45"],
  neon: ["#07060a", "#ff2e88", "#00f0ff", "#ffffff", "#5a00ff", "#ffe600"],
} as const;
export type PaletteName = keyof typeof PALETTES;

// ── Seeded randomness and noise ─────────────────────────────────────────
export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rand: () => number) {
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number, x: number, y: number) => {
    const g = h & 7;
    const u = g < 4 ? x : y;
    const v = g < 4 ? y : x;
    return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v);
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    return (
      lerp(
        lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
        lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u),
        v,
      ) * 0.5
    );
  };
}

// ── Base styles ─────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D;

function drawFlow(ctx: Ctx, S: number, pal: readonly string[], rand: () => number, noise: (x: number, y: number) => number, relief: boolean) {
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, S, S);
  const scale = 0.0022 * (640 / S);
  const curves = Math.round(1100 * (S / 640));
  ctx.lineCap = "round";
  for (let i = 0; i < curves; i++) {
    let x = rand() * S * 1.2 - S * 0.1;
    let y = rand() * S * 1.2 - S * 0.1;
    const steps = 40 + Math.floor(rand() * 140);
    const band = noise(x * scale * 0.6 + 50, y * scale * 0.6 + 50);
    const ci = 1 + Math.floor(((band + 1) / 2) * (pal.length - 1)) % (pal.length - 1);
    const w = (rand() < 0.08 ? 6 + rand() * 9 : 0.6 + rand() * 2.6) * (S / 640);
    ctx.strokeStyle = pal[ci];
    ctx.globalAlpha = 0.55 + rand() * 0.45;
    ctx.lineWidth = w;
    if (relief) {
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 9 * (S / 640);
      ctx.shadowOffsetX = 2.5 * (S / 640);
      ctx.shadowOffsetY = 6 * (S / 640);
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++) {
      const a = noise(x * scale, y * scale) * Math.PI * 3.2;
      x += Math.cos(a) * 2.4 * (S / 640);
      y += Math.sin(a) * 2.4 * (S / 640);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowColor = "transparent";
  ctx.globalAlpha = 1;
}

function drawRings(ctx: Ctx, S: number, pal: readonly string[], rand: () => number, noise: (x: number, y: number) => number, relief: boolean) {
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, S, S);
  const cx = S * (0.42 + rand() * 0.16);
  const cy = S * (0.42 + rand() * 0.16);
  const amp = S * 0.07;
  for (let r = S * 0.72; r > S * 0.02; r -= S * 0.0085) {
    const ci = 1 + (Math.floor(r / (S * 0.045)) % (pal.length - 1));
    ctx.beginPath();
    for (let k = 0; k <= 180; k++) {
      const t = (k / 180) * Math.PI * 2;
      const n = noise(Math.cos(t) * 1.4 + r * 0.004, Math.sin(t) * 1.4 + r * 0.004);
      const rr = r + n * amp * (r / (S * 0.5));
      const px = cx + Math.cos(t) * rr;
      const py = cy + Math.sin(t) * rr;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal[ci];
    if (relief) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 10 * (S / 640);
      ctx.shadowOffsetY = 4 * (S / 640);
    }
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1 * (S / 640);
    ctx.strokeStyle = pal[0];
    ctx.stroke();
  }
}

function drawStrata(ctx: Ctx, S: number, pal: readonly string[], rand: () => number, noise: (x: number, y: number) => number, relief: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, S);
  sky.addColorStop(0, pal[0]);
  sky.addColorStop(1, pal[4]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, S, S);
  // sun
  const sx = S * (0.25 + rand() * 0.5);
  const sy = S * (0.22 + rand() * 0.12);
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, S * 0.22);
  sun.addColorStop(0, pal[5]);
  sun.addColorStop(0.35, pal[5] + "cc");
  sun.addColorStop(1, pal[5] + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, S, S);
  const layers = 14;
  for (let l = 0; l < layers; l++) {
    const base = S * (0.34 + (l / layers) * 0.72);
    ctx.beginPath();
    ctx.moveTo(0, S);
    for (let x = 0; x <= S; x += S / 160) {
      const y = base + noise(x * 0.004 * (640 / S) + l * 3.1, l * 0.7) * S * 0.12 + noise(x * 0.02 * (640 / S), l) * S * 0.012;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(S, S);
    ctx.closePath();
    ctx.fillStyle = pal[1 + (l % (pal.length - 2))];
    ctx.globalAlpha = 0.92;
    if (relief) {
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 14 * (S / 640);
      ctx.shadowOffsetY = -3 * (S / 640);
    }
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 1;
  }
}

// ── Post-process transforms ─────────────────────────────────────────────
function applyFragment(ctx: Ctx, S: number, rand: () => number) {
  const src = document.createElement("canvas");
  src.width = src.height = S;
  src.getContext("2d")!.drawImage(ctx.canvas, 0, 0);
  const n = 6;
  const t = S / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (rand() < 0.45) continue;
      const si = Math.floor(rand() * n);
      const sj = Math.floor(rand() * n);
      ctx.save();
      ctx.translate(i * t + t / 2, j * t + t / 2);
      ctx.rotate(Math.floor(rand() * 4) * (Math.PI / 2));
      ctx.drawImage(src, si * t, sj * t, t, t, -t / 2, -t / 2, t, t);
      ctx.restore();
      if (rand() < 0.18) {
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.85;
        ctx.fillRect(i * t, j * t, t, t);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    }
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = Math.max(1, S / 640);
  for (let k = 1; k < n; k++) {
    ctx.beginPath();
    ctx.moveTo(k * t, 0);
    ctx.lineTo(k * t, S);
    ctx.moveTo(0, k * t);
    ctx.lineTo(S, k * t);
    ctx.stroke();
  }
}

function applyPixel(ctx: Ctx, S: number) {
  const g = 48;
  const small = document.createElement("canvas");
  small.width = small.height = g;
  const sctx = small.getContext("2d")!;
  sctx.drawImage(ctx.canvas, 0, 0, g, g);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(small, 0, 0, S, S);
  ctx.imageSmoothingEnabled = true;
}

function applyMotionStreak(ctx: Ctx, S: number) {
  const src = document.createElement("canvas");
  src.width = src.height = S;
  src.getContext("2d")!.drawImage(ctx.canvas, 0, 0);
  ctx.globalAlpha = 0.16;
  for (let k = 1; k <= 6; k++) ctx.drawImage(src, k * 4 * (S / 640), -k * 2 * (S / 640));
  ctx.globalAlpha = 1;
}

function applyFinish(ctx: Ctx, S: number, relief: boolean) {
  if (relief) {
    const spec = ctx.createLinearGradient(0, 0, S, S);
    spec.addColorStop(0, "rgba(255,240,220,0.28)");
    spec.addColorStop(0.4, "rgba(255,255,255,0)");
    spec.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, S, S);
  }
  const v = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, S, S);
  // grain
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  const r = mulberry32(7);
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 18;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function paletteFor(g: Genome) {
  return PALETTES[g.palette];
}

/** Renders a genome into the given 2D context at size S×S. */
export function renderGenome(ctx: Ctx, S: number, g: Genome) {
  const rand = mulberry32(g.seed);
  const noise = makeNoise(mulberry32(g.seed * 7 + 13));
  const pal = PALETTES[g.palette];
  const relief = g.transforms.includes("relief");
  if (g.style === "flow") drawFlow(ctx, S, pal, rand, noise, relief);
  else if (g.style === "rings") drawRings(ctx, S, pal, rand, noise, relief);
  else drawStrata(ctx, S, pal, rand, noise, relief);
  const post = mulberry32(g.seed + 99);
  for (const t of g.transforms) {
    if (t === "fragment") applyFragment(ctx, S, post);
    if (t === "motion") applyMotionStreak(ctx, S);
  }
  applyFinish(ctx, S, relief);
  if (g.transforms.includes("pixel")) applyPixel(ctx, S);
}

// ── Cache: genome → object URL ──────────────────────────────────────────
const cache = new Map<string, Promise<string>>();

export function genomeKey(g: Genome, size: number) {
  return `${g.seed}|${g.style}|${g.palette}|${g.transforms.join(",")}|${size}`;
}

export function renderToUrl(g: Genome, size = 720): Promise<string> {
  const key = genomeKey(g, size);
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Promise<string>((resolve) => {
    const run = () => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      renderGenome(ctx, size, g);
      c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL()), "image/png");
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (ric) ric(run);
    else setTimeout(run, 0);
  });
  cache.set(key, p);
  return p;
}

/** CSS gradient placeholder shown before the canvas render lands. */
export function placeholderCss(g: Genome) {
  const p = PALETTES[g.palette];
  return `radial-gradient(120% 90% at 30% 20%, ${p[1]}55, transparent 60%), radial-gradient(90% 80% at 80% 90%, ${p[2]}44, transparent 60%), ${p[0]}`;
}
