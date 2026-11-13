// Records real sessions of the live app for the film (1920×1080, visible cursor).
//   node record.mjs
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://canon.bootstate.xyz";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "public/clips";
mkdirSync(OUT, { recursive: true });

// A soft, branded cursor drawn into the page so it shows up in the recording.
const CURSOR = `
(() => {
  const add = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,0.92);box-shadow:0 0 0 6px rgba(255,255,255,0.12),0 6px 18px rgba(0,0,0,0.5);z-index:2147483647;pointer-events:none;transition:transform .12s ease,opacity .2s;transform:translate(960px,600px)';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', e => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    addEventListener('mousedown', () => { c.style.transform += ' scale(0.7)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = c.style.transform.replace(' scale(0.7)', ''); }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const offsets = {};

async function clip(name, fn) {
  const dir = join(OUT, "_" + name);
  rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir, size: { width: 1920, height: 1080 } } });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  const t0 = Date.now();
  let ready = 0;
  const markReady = () => (ready = (Date.now() - t0) / 1000);
  try {
    await fn(page, markReady);
  } catch (e) {
    console.log(`! ${name}: ${e.message.split("\n")[0]}`);
  }
  const total = (Date.now() - t0) / 1000;
  await ctx.close();
  const file = readdirSync(dir).find((f) => f.endsWith(".webm"));
  renameSync(join(dir, file), join(OUT, `${name}.webm`));
  rmSync(dir, { recursive: true, force: true });
  offsets[name] = { start: +ready.toFixed(2), length: +(total - ready).toFixed(2) };
  console.log(`${name.padEnd(11)} start ${ready.toFixed(1)}s  length ${(total - ready).toFixed(1)}s`);
}

const glide = async (page, x, y, steps = 30) => page.mouse.move(x, y, { steps });
const smoothScroll = async (page, dy, ms = 1200) => {
  await page.evaluate(({ dy, ms }) => new Promise((r) => {
    const start = scrollY, t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => { const k = Math.min(1, (now - t0) / ms); scrollTo(0, start + dy * ease(k)); k < 1 ? requestAnimationFrame(step) : r(); };
    requestAnimationFrame(step);
  }), { dy, ms });
};
const scrollToText = async (page, text, offset = 140, ms = 1300) => {
  const y = await page.getByText(text, { exact: false }).first().evaluate((el, off) => el.getBoundingClientRect().top + scrollY - off, offset);
  const cur = await page.evaluate(() => scrollY);
  await smoothScroll(page, y - cur, ms);
};
const ready = async (page, path, waitText) => {
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  if (waitText) await page.getByText(waitText, { exact: false }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200); // let artwork paint
};

await clip("explore", async (page, mark) => {
  await ready(page, "/explore", "Ember Field — Motion");
  mark();
  await glide(page, 760, 300, 20);
  await page.waitForTimeout(500);
  await smoothScroll(page, 380, 1600);
  await glide(page, 520, 520, 35);
  await page.waitForTimeout(700);
  await glide(page, 960, 560, 30);
  await page.waitForTimeout(700);
  await glide(page, 1360, 540, 30);
  await page.waitForTimeout(900);
  await smoothScroll(page, 420, 1800);
  await page.waitForTimeout(1500);
});

await clip("clearance", async (page, mark) => {
  await ready(page, "/works/ember-motion", "Cleared for commercial use");
  mark();
  await glide(page, 1250, 230, 25);
  await page.waitForTimeout(900);
  await scrollToText(page, "Commercial clearance", 160, 1400);
  await glide(page, 1200, 300, 25);
  await page.waitForTimeout(600);
  for (const y of [400, 460, 520]) {
    await glide(page, 1300, y, 14);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
});

await clip("payout", async (page, mark) => {
  await ready(page, "/works/ember-motion", "The Ember Field family");
  await scrollToText(page, "The Ember Field family", 120, 10);
  await page.waitForTimeout(700);
  mark();
  const btn = page.getByRole("button", { name: /Replay a/ });
  const b = await btn.boundingBox();
  await glide(page, b.x + b.width / 2, b.y + b.height / 2, 30);
  await page.waitForTimeout(300);
  await btn.click();
  await page.waitForTimeout(400);
  await glide(page, 960, 700, 30);
  await page.waitForTimeout(6500);
});

await clip("checkout", async (page, mark) => {
  await ready(page, "/works/ember-motion", "Commercial licence");
  mark();
  const btn = page.getByRole("button", { name: /^License/ }).first();
  const b = await btn.boundingBox();
  await glide(page, b.x + b.width / 2, b.y + b.height / 2, 30);
  await page.waitForTimeout(250);
  await btn.click();
  await page.getByText("Sum equals price").first().waitFor();
  await page.waitForTimeout(600);
  const film = page.getByText("Film & motion").first();
  const fb = await film.boundingBox();
  await glide(page, fb.x + 120, fb.y + 10, 20);
  await film.click();
  await page.waitForTimeout(500);
  for (const y of [520, 580, 640, 700, 760]) {
    await glide(page, 1100, y, 10);
    await page.waitForTimeout(300);
  }
  await glide(page, 1100, 810, 10);
  await page.waitForTimeout(1600);
});

await clip("collection", async (page, mark) => {
  await ready(page, "/collection?account=studio.canonhq-demo.testnet", "Licences held");
  await page.waitForTimeout(800);
  mark();
  await scrollToText(page, "Licences held", 120, 1600);
  await page.waitForTimeout(400);
  const dl = page.getByRole("button", { name: /Source file/ }).first();
  const d = await dl.boundingBox();
  await glide(page, d.x + d.width / 2, d.y + d.height / 2, 35);
  await page.waitForTimeout(800);
  await glide(page, d.x + 520, d.y - 120, 30);
  await page.waitForTimeout(2200);
});

await clip("register", async (page, mark) => {
  await ready(page, "/register", "What are you registering?");
  mark();
  const der = page.getByRole("button", { name: /A derivative/ });
  const r = await der.boundingBox();
  await glide(page, r.x + r.width / 2, r.y + r.height / 2, 30);
  await der.click();
  await page.waitForTimeout(900);
  for (const label of ["Motion", "Colourway", "Remix", "3D relief"]) {
    const t = page.getByRole("button", { name: new RegExp("^" + label + "$") }).first();
    const tb = await t.boundingBox();
    await glide(page, tb.x + tb.width / 2, tb.y + tb.height / 2, 18);
    await t.click();
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(800);
});

await clip("blocked", async (page, mark) => {
  await ready(page, "/works/moth-fragments", "Not cleared");
  mark();
  await glide(page, 1250, 250, 25);
  await page.waitForTimeout(700);
  await scrollToText(page, "Commercial clearance", 160, 1400);
  await glide(page, 1250, 300, 25);
  await page.waitForTimeout(700);
  await glide(page, 1320, 420, 20);
  await page.waitForTimeout(2600);
});

await clip("explorer", async (page, mark) => {
  await page.goto("https://testnet.nearblocks.io/txns/HrgXySX1m4uHA21ynYgLrCvCBxJNg2n8syFSWGAm8U2a", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  mark();
  await glide(page, 760, 420, 30);
  await page.waitForTimeout(800);
  await smoothScroll(page, 360, 1800);
  await glide(page, 980, 600, 30);
  await page.waitForTimeout(2600);
});

await clip("hero", async (page, mark) => {
  await ready(page, "/", "whole family tree");
  await smoothScroll(page, 470, 10);
  await page.waitForTimeout(300);
  mark();
  await glide(page, 960, 760, 40);
  await page.waitForTimeout(8500);
});

await browser.close();
writeFileSync("src/clips.json", JSON.stringify(offsets, null, 1));
console.log("done");
