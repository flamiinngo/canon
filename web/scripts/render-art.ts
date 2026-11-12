/**
 * Renders the seeded demo works to JPEG (docs/art/<slug>.jpg) so NFT metadata can
 * point at real image URLs that wallets and explorers display.
 *   cd web && npx tsx scripts/render-art.ts
 */
import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderGenome, setCanvasFactory, type Genome } from "../src/lib/art";
import { DEMO_WORKS } from "../src/lib/data";

export const genomeSlug = (g: Genome) => `${g.seed}-${g.style}-${g.palette}-${g.transforms.join("_") || "base"}`;

setCanvasFactory((w, h) => createCanvas(w, h) as never);
const out = join(__dirname, "..", "..", "docs", "art");
const S = 1024;
for (const w of DEMO_WORKS) {
  const c = createCanvas(S, S);
  renderGenome(c.getContext("2d") as unknown as CanvasRenderingContext2D, S, w.genome);
  const file = join(out, `${genomeSlug(w.genome)}.jpg`);
  writeFileSync(file, c.toBuffer("image/jpeg", 88));
  console.log(`${w.id.padEnd(16)} → docs/art/${genomeSlug(w.genome)}.jpg`);
}
