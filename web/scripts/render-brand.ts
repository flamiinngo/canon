/**
 * Renders Canon's brand assets with the same art engine as the app:
 *   src/app/icon.png (512), src/app/apple-icon.png (180),
 *   src/app/opengraph-image.png + twitter-image.png (1200×630)
 *   cd web && npx tsx scripts/render-brand.ts
 */
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderGenome, setCanvasFactory } from "../src/lib/art";
import { demoWork } from "../src/lib/data";

setCanvasFactory((w, h) => createCanvas(w, h) as never);
const app = join(__dirname, "..", "src", "app");

function rounded(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The Canon mark: an original with two derivatives, joined by a spectrum lineage stroke. */
function mark(ctx: SKRSContext2D, x: number, y: number, s: number, tile = true) {
  if (tile) {
    rounded(ctx, x, y, s, s, s * 0.24);
    ctx.fillStyle = "#0f1115";
    ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }
  const u = s / 28;
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, "#ff6a3d");
  g.addColorStop(0.5, "#a98bff");
  g.addColorStop(1, "#52d6ff");
  ctx.strokeStyle = g;
  ctx.lineWidth = 2.2 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 14 * u, y + 7.5 * u);
  ctx.lineTo(x + 14 * u, y + 14 * u);
  ctx.lineTo(x + 8.5 * u, y + 20 * u);
  ctx.moveTo(x + 14 * u, y + 14 * u);
  ctx.lineTo(x + 19.5 * u, y + 20 * u);
  ctx.stroke();
  const dot = (cx: number, cy: number, r: number, c: string) => {
    ctx.beginPath();
    ctx.arc(x + cx * u, y + cy * u, r * u, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  };
  dot(14, 7.5, 3, "#ff6a3d");
  dot(8.5, 20.5, 2.5, "#a98bff");
  dot(19.5, 20.5, 2.5, "#52d6ff");
}

function icon(size: number, file: string) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");
  mark(ctx, 0, 0, size);
  writeFileSync(join(app, file), c.toBuffer("image/png"));
  console.log(`src/app/${file} (${size}px)`);
}

function og(file: string) {
  const W = 1200;
  const H = 630;
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, W, H);
  // artwork panel on the right, faded into the background
  const art = createCanvas(H, H);
  renderGenome(art.getContext("2d") as unknown as CanvasRenderingContext2D, H, demoWork("ember-motion").genome);
  ctx.drawImage(art, W - H, 0);
  const fade = ctx.createLinearGradient(W - H, 0, W - H + 360, 0);
  fade.addColorStop(0, "#07080a");
  fade.addColorStop(1, "rgba(7,8,10,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(W - H, 0, 360, H);
  const glow = ctx.createRadialGradient(240, 0, 0, 240, 0, 520);
  glow.addColorStop(0, "rgba(255,106,61,0.22)");
  glow.addColorStop(1, "rgba(255,106,61,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  mark(ctx, 72, 64, 56);
  ctx.fillStyle = "#eef0f3";
  ctx.font = "bold 34px Arial";
  ctx.fillText("canon", 142, 104);

  ctx.font = "bold 66px Arial";
  ctx.fillText("Creative IP that pays", 72, 270);
  const spec = ctx.createLinearGradient(72, 0, 700, 0);
  spec.addColorStop(0, "#ff6a3d");
  spec.addColorStop(0.35, "#ffb35c");
  spec.addColorStop(0.7, "#a98bff");
  spec.addColorStop(1, "#52d6ff");
  ctx.fillStyle = spec;
  ctx.fillText("its whole family tree.", 72, 348);

  ctx.fillStyle = "#a3a9b4";
  ctx.font = "26px Arial";
  ctx.fillText("Every work is a NEAR NFT with its own keyless vault.", 72, 418);
  ctx.fillText("One licence pays every generation, in one transaction.", 72, 456);

  ctx.fillStyle = "#6b717c";
  ctx.font = "20px Courier New";
  ctx.fillText("canon.bootstate.xyz  ·  NEP-171 · 199 · 591  ·  0 admin keys", 72, 560);

  writeFileSync(join(app, file), c.toBuffer("image/png"));
  console.log(`src/app/${file} (${W}×${H})`);
}

icon(512, "icon.png");
icon(180, "apple-icon.png");
og("opengraph-image.png");
og("twitter-image.png");
