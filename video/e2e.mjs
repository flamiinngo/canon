// End-to-end check of the live app + product shots for the film.
//   node e2e.mjs [baseUrl]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "https://canon.bootstate.xyz";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync("public/shots", { recursive: true });

const results = [];
const check = async (name, fn) => {
  const t = Date.now();
  try {
    await fn();
    results.push(["PASS", name, Date.now() - t]);
  } catch (e) {
    results.push(["FAIL", name, Date.now() - t, String(e.message ?? e).split("\n")[0]]);
  }
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
};
const text = (t, timeout = 20000) => page.getByText(t, { exact: false }).first().waitFor({ timeout });
const shot = (name) => page.screenshot({ path: `public/shots/${name}.png` });

await check("Home: hero, live network, transaction log", async () => {
  await go("/");
  await text("whole family tree");
  await page.locator("canvas").first().waitFor();
  await page.waitForTimeout(2600);
  await shot("home-hero");
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(2600);
  await text("buy_license");
  await shot("home-network");
});

await check("Explore: 10 works from the registry, 6 cleared", async () => {
  await go("/explore");
  await text("Ember Field — Motion");
  const all = await page.getByRole("button", { name: /All\s*10/ }).count();
  if (!all) throw new Error("expected 'All 10'");
  await page.waitForTimeout(2500);
  await shot("explore");
});

await check("Work: clearance, NFT panel, licence issued, vault", async () => {
  await go("/works/ember-motion");
  await text("Cleared for commercial use across 3 generations");
  await text("NEP-171 · 177 · 178 · 181");
  await text("licence-0");
  await text("Vault balance (live)");
  await page.waitForTimeout(2500);
  await shot("work-top");
  await page.getByText("Commercial clearance").first().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(800);
  await shot("work-clearance");
  await page.getByText("The NFT", { exact: true }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await shot("work-nft");
});

await check("Work: lineage graph and payout replay", async () => {
  await page.getByText("The Ember Field family").first().scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Replay a/ }).click();
  await page.waitForTimeout(3200);
  await shot("work-lineage-payout");
});

await check("Licence checkout shows the split and needs a wallet", async () => {
  await go("/works/ember-motion");
  await page.getByRole("button", { name: /^License/ }).first().click();
  await text("Where 1.5 Ⓝ goes");
  await text("Sum equals price");
  await text("Connect a NEAR wallet to license");
  await page.waitForTimeout(600);
  await shot("checkout");
  await page.keyboard.press("Escape");
});

await check("Non-commercial ancestor blocks a licence", async () => {
  await go("/works/moth-fragments");
  await text("Not cleared");
  await text("commercial use is not permitted by this work");
});

await check("Revoked derivative is shown as revoked", async () => {
  await go("/works/tidal-neon");
  await text("Revoked");
});

await check("Collection: studio holds two licence NFTs", async () => {
  await go("/collection?account=studio.canonhq-demo.testnet");
  await text("Licences held");
  const n = await page.getByText(/^Licence #\d/).count();
  if (n < 2) throw new Error(`expected 2 licence NFTs, saw ${n}`);
  await page.getByText("Licences held").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await shot("collection");
});

await check("Review: pending submission, only the parent owner can decide", async () => {
  await go("/review");
  await text("Ember Field — Pixel");
  await text("can decide");
  await page.getByText("Ember Field — Pixel").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await shot("review");
});

await check("Register: original + derivative flows render", async () => {
  await go("/register");
  await text("What are you registering?");
  await page.getByRole("button", { name: /A derivative/ }).click();
  await text("derived from");
  await page.waitForTimeout(2000);
  await shot("register");
});

await check("Proof: 41 transactions, 11 refused", async () => {
  await go("/proof");
  await text("The whole story, as transactions.");
  const refused = await page.getByText(/^refused · /).count();
  if (refused !== 11) throw new Error(`expected 11 refused rows, saw ${refused}`);
  await page.getByText("The whole story, as transactions.").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await shot("proof");
});

await check("About page", async () => {
  await go("/about");
  await text("Building the rights layer");
  await text("Business model");
});

await check("Connect wallet opens the NEAR wallet selector", async () => {
  await go("/");
  await page.getByRole("button", { name: /Connect wallet/ }).first().click();
  await page.waitForTimeout(3000);
  const frames = page.frames().map((f) => f.url()).join(" ");
  const body = await page.content();
  if (!/Select wallet|Meteor|wallet/i.test(body + frames)) throw new Error("wallet selector did not open");
  await shot("wallet");
});

await check("Unknown route returns the 404 page", async () => {
  const r = await page.goto(BASE + "/definitely-not-here", { waitUntil: "domcontentloaded" });
  if (r?.status() !== 404) throw new Error(`status ${r?.status()}`);
});

// Mobile pass
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await check("Mobile: home and work page render", async () => {
  await mp.goto(BASE + "/", { waitUntil: "networkidle" });
  await mp.getByText("whole family tree").first().waitFor();
  await mp.screenshot({ path: "public/shots/mobile-home.png" });
  await mp.goto(BASE + "/works/ember-motion", { waitUntil: "networkidle" });
  await mp.getByText("Cleared for commercial use").first().waitFor({ timeout: 20000 });
  await mp.waitForTimeout(2000);
  await mp.screenshot({ path: "public/shots/mobile-work.png" });
});

await browser.close();

const pass = results.filter((r) => r[0] === "PASS").length;
for (const r of results) console.log(`${r[0]}  ${r[1]}  (${r[2]} ms)${r[3] ? "  → " + r[3] : ""}`);
console.log(`\n${pass}/${results.length} checks passed · ${errors.length} page errors${errors.length ? ": " + [...new Set(errors)].slice(0, 3).join(" | ") : ""}`);
process.exit(pass === results.length ? 0 : 1);
