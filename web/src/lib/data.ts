import type { Genome, Transform } from "./art";
import type { Work } from "./types";

/** A derivative's genome = its parent's genome plus one transform (and optionally a new palette). */
const derive = (g: Genome, t: Transform, palette?: Genome["palette"]): Genome => ({
  ...g,
  palette: palette ?? g.palette,
  transforms: [...g.transforms, t],
});

const EMBER: Genome = { seed: 4127, style: "flow", palette: "ember", transforms: [] };
const EMBER_RELIEF = derive(EMBER, "relief");
const EMBER_MOTION = derive(EMBER_RELIEF, "motion");
const EMBER_NOCTURNE = derive(EMBER, "recolor", "nocturne");
const EMBER_PIXEL = derive(EMBER, "pixel");
const MOTH: Genome = { seed: 913, style: "rings", palette: "violet", transforms: [] };
const MOTH_FRAG = derive(MOTH, "fragment");
const TIDAL: Genome = { seed: 2203, style: "strata", palette: "tidal", transforms: [] };
const TIDAL_NEON = derive(derive(TIDAL, "recolor", "neon"), "fragment");
const QUARRY: Genome = { seed: 77, style: "strata", palette: "quarry", transforms: ["relief"] };

/**
 * Preview dataset. Shapes match the registry contract's view methods so the
 * UI can switch to live chain reads without changing components.
 */
export const WORKS: Work[] = [
  {
    id: "ember",
    title: "Ember Field",
    kind: "Original artwork",
    description: "A generative flow field of 1,100 strokes. The original edition, released for licensed derivatives and commercial key art.",
    owner: "ada.near",
    creator: "ada.near",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 2000, priceNear: 40 },
    splits: [{ account: "ada.near", role: "Artist", bps: 10000, isOwner: true }],
    genome: EMBER,
    vaultNear: 12.5,
    fileHash: "sha256:9f2c4e1a7b8d0c3e…e41a",
    mintedAt: "2026-11-02",
    history: [
      { kind: "minted", at: "2026-11-02", actor: "ada.near", detail: "Registered as an original work" },
      { kind: "approved", at: "2026-11-04", actor: "ada.near", detail: "Approved derivative Ember Field — Relief" },
      { kind: "approved", at: "2026-11-06", actor: "ada.near", detail: "Approved derivative Ember Field — Nocturne" },
      { kind: "royalty", at: "2026-11-09", actor: "studio.near", detail: "Upstream share from a licence of Ember Field — Motion", amountNear: 7.5 },
      { kind: "licensed", at: "2026-11-10", actor: "pixelforge.near", detail: "Commercial licence · brand & merchandise", amountNear: 5 },
    ],
  },
  {
    id: "ember-relief",
    title: "Ember Field — Relief",
    kind: "3D relief",
    description: "The flow field rebuilt as sculpted relief: every stroke extruded and lit. Delivered as height map, normal map and PBR textures.",
    owner: "ben.near",
    creator: "ben.near",
    parentId: "ember",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 2500, priceNear: 100 },
    splits: [
      { account: "ben.near", role: "3D sculpting", bps: 7000, isOwner: true },
      { account: "cy.near", role: "Materials", bps: 3000 },
    ],
    genome: EMBER_RELIEF,
    vaultNear: 21,
    fileHash: "sha256:3b77a0c95e12f8d4…0c9d",
    mintedAt: "2026-11-04",
    history: [
      { kind: "submitted", at: "2026-11-03", actor: "ben.near", detail: "Submitted as a derivative of Ember Field" },
      { kind: "approved", at: "2026-11-04", actor: "ada.near", detail: "Approved by the owner of Ember Field" },
      { kind: "approved", at: "2026-11-07", actor: "ben.near", detail: "Approved derivative Ember Field — Motion" },
      { kind: "royalty", at: "2026-11-09", actor: "studio.near", detail: "Upstream share from a licence of Ember Field — Motion", amountNear: 30 },
    ],
  },
  {
    id: "ember-motion",
    title: "Ember Field — Motion",
    kind: "Motion loop",
    description: "The relief set in motion: a seamless 4K loop with an original score, built for title sequences and in-game skies.",
    owner: "dee.near",
    creator: "dee.near",
    parentId: "ember-relief",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 150 },
    splits: [
      { account: "dee.near", role: "Motion design", bps: 8000, isOwner: true },
      { account: "fay.near", role: "Score", bps: 2000 },
    ],
    genome: EMBER_MOTION,
    vaultNear: 90,
    fileHash: "sha256:c41d8e2f6a9031bb…77b2",
    mintedAt: "2026-11-07",
    history: [
      { kind: "submitted", at: "2026-11-06", actor: "dee.near", detail: "Submitted as a derivative of Ember Field — Relief" },
      { kind: "approved", at: "2026-11-07", actor: "ben.near", detail: "Approved by the owner of Ember Field — Relief" },
      { kind: "licensed", at: "2026-11-09", actor: "studio.near", detail: "Commercial licence · games & interactive", amountNear: 150 },
    ],
  },
  {
    id: "ember-nocturne",
    title: "Ember Field — Nocturne",
    kind: "Colourway",
    description: "The same field at night. A cold colourway drawn from the original geometry, stroke for stroke.",
    owner: "gil.near",
    creator: "gil.near",
    parentId: "ember",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 1000, priceNear: 30 },
    splits: [{ account: "gil.near", role: "Colour", bps: 10000, isOwner: true }],
    genome: EMBER_NOCTURNE,
    vaultNear: 0,
    fileHash: "sha256:71e0b3d2a4c890fe…5f10",
    mintedAt: "2026-11-06",
    history: [
      { kind: "submitted", at: "2026-11-05", actor: "gil.near", detail: "Submitted as a derivative of Ember Field" },
      { kind: "approved", at: "2026-11-06", actor: "ada.near", detail: "Approved by the owner of Ember Field" },
    ],
  },
  {
    id: "ember-pixel",
    title: "Ember Field — Pixel",
    kind: "Pixel edition",
    description: "A 48×48 pixel edition for retro games and UI, with a matching 16-colour palette.",
    owner: "hal.near",
    creator: "hal.near",
    parentId: "ember",
    status: "pending",
    terms: { derivatives: true, commercial: true, upstreamBps: 1000, priceNear: 25 },
    splits: [{ account: "hal.near", role: "Pixel art", bps: 10000, isOwner: true }],
    genome: EMBER_PIXEL,
    vaultNear: 0,
    fileHash: "sha256:0aa9f4c3e2b17a55…9e33",
    mintedAt: "2026-11-11",
    history: [{ kind: "submitted", at: "2026-11-11", actor: "hal.near", detail: "Submitted as a derivative of Ember Field" }],
  },
  {
    id: "moth-light",
    title: "Moth Light",
    kind: "Original artwork",
    description: "Concentric orbits drawn toward a lamp. Fan works welcome; commercial use is reserved by the artist.",
    owner: "ivy.near",
    creator: "ivy.near",
    status: "approved",
    terms: { derivatives: true, commercial: false, upstreamBps: 0, priceNear: 0 },
    splits: [{ account: "ivy.near", role: "Artist", bps: 10000, isOwner: true }],
    genome: MOTH,
    vaultNear: 0,
    fileHash: "sha256:5c1e9a07b3f24d61…a0d4",
    mintedAt: "2026-11-03",
    history: [
      { kind: "minted", at: "2026-11-03", actor: "ivy.near", detail: "Registered as an original work · non-commercial" },
      { kind: "approved", at: "2026-11-08", actor: "ivy.near", detail: "Approved derivative Moth Light — Fragments" },
    ],
  },
  {
    id: "moth-fragments",
    title: "Moth Light — Fragments",
    kind: "Remix",
    description: "A tiled remix of Moth Light. Approved into canon, but it can't be licensed commercially because its parent forbids it.",
    owner: "jun.near",
    creator: "jun.near",
    parentId: "moth-light",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 20 },
    splits: [{ account: "jun.near", role: "Remix", bps: 10000, isOwner: true }],
    genome: MOTH_FRAG,
    vaultNear: 0,
    fileHash: "sha256:e8b2c6d1f0493a7e…1c7a",
    mintedAt: "2026-11-08",
    history: [
      { kind: "submitted", at: "2026-11-07", actor: "jun.near", detail: "Submitted as a derivative of Moth Light" },
      { kind: "approved", at: "2026-11-08", actor: "ivy.near", detail: "Approved by the owner of Moth Light" },
    ],
  },
  {
    id: "tidal",
    title: "Tidal",
    kind: "Original artwork",
    description: "Fourteen layers of sea-floor strata under a low sun. Built as a licensable brand world for community projects.",
    owner: "lea.near",
    creator: "lea.near",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 1500, priceNear: 60 },
    splits: [
      { account: "lea.near", role: "Artist", bps: 8500, isOwner: true },
      { account: "max.near", role: "Art direction", bps: 1500 },
    ],
    genome: TIDAL,
    vaultNear: 0,
    fileHash: "sha256:2d9a4f6b8c1e7720…b5e8",
    mintedAt: "2026-11-02",
    history: [
      { kind: "minted", at: "2026-11-02", actor: "lea.near", detail: "Registered as an original work" },
      { kind: "approved", at: "2026-11-05", actor: "lea.near", detail: "Approved derivative Tidal — Neon Remix" },
      { kind: "revoked", at: "2026-11-09", actor: "lea.near", detail: "Revoked approval of Tidal — Neon Remix" },
    ],
  },
  {
    id: "tidal-neon",
    title: "Tidal — Neon Remix",
    kind: "Remix",
    description: "A neon, tiled reinterpretation of Tidal. Its approval was revoked after a dispute over style.",
    owner: "nox.near",
    creator: "nox.near",
    parentId: "tidal",
    status: "revoked",
    statusNote: "Approval revoked by the owner of Tidal. Existing licences stay valid; no new licences can be issued.",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 35 },
    splits: [{ account: "nox.near", role: "Remix", bps: 10000, isOwner: true }],
    genome: TIDAL_NEON,
    vaultNear: 0,
    fileHash: "sha256:9e4f0a1b2c3d5e88…7a61",
    mintedAt: "2026-11-05",
    history: [
      { kind: "approved", at: "2026-11-05", actor: "lea.near", detail: "Approved by the owner of Tidal" },
      { kind: "revoked", at: "2026-11-09", actor: "lea.near", detail: "Approval revoked" },
    ],
  },
  {
    id: "quarry",
    title: "Quarry",
    kind: "Original artwork",
    description: "Cut stone in relief. Licensable as-is; derivatives are closed by the artist.",
    owner: "kai.near",
    creator: "kai.near",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 80 },
    splits: [{ account: "kai.near", role: "Artist", bps: 10000, isOwner: true }],
    genome: QUARRY,
    vaultNear: 80,
    fileHash: "sha256:b1c2d3e4f5a60718…8899",
    mintedAt: "2026-11-01",
    history: [
      { kind: "minted", at: "2026-11-01", actor: "kai.near", detail: "Registered as an original work · derivatives closed" },
      { kind: "licensed", at: "2026-11-08", actor: "brewco.near", detail: "Commercial licence · packaging", amountNear: 80 },
    ],
  },
];

export function getWork(id: string) {
  return WORKS.find((w) => w.id === id);
}

export function childrenOf(id: string) {
  return WORKS.filter((w) => w.parentId === id);
}

export function ancestorsOf(id: string): Work[] {
  const chain: Work[] = [];
  let cur = getWork(id)?.parentId;
  while (cur) {
    const w = getWork(cur);
    if (!w) break;
    chain.push(w);
    cur = w.parentId;
  }
  return chain;
}

export function rootOf(id: string): Work {
  const anc = ancestorsOf(id);
  return anc.length ? anc[anc.length - 1] : getWork(id)!;
}

export function generationOf(id: string) {
  return ancestorsOf(id).length;
}

export function vaultAccount(id: string) {
  return `${id}.canon.near`;
}

export function shortTitle(w: Work) {
  return w.title.includes("—") ? w.title.split("—")[1].trim() : w.title;
}
