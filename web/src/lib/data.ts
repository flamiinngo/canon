import type { Work } from "./types";

/**
 * Preview dataset. Shapes match the registry contract's view methods so the
 * UI can switch to live chain reads without changing components.
 */
export const WORKS: Work[] = [
  // ── Family 1: Zuri ────────────────────────────────────────────
  {
    id: "zuri",
    title: "Zuri",
    kind: "Original character",
    description:
      "A small fox spirit who keeps lost sounds in her tail. The original 2D character sheet, with turnarounds and colour keys.",
    owner: "ada.near",
    creator: "ada.near",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 2000, priceNear: 40 },
    splits: [{ account: "ada.near", role: "Creator", bps: 10000, isOwner: true }],
    art: { species: "fox", hue: 38, variant: "flat" },
    vaultNear: 12.5,
    fileHash: "sha256:9f2c4e1a7b8d…e41a",
    mintedAt: "2026-11-02",
    history: [
      { kind: "minted", at: "2026-11-02", actor: "ada.near", detail: "Registered as an original work" },
      { kind: "approved", at: "2026-11-04", actor: "ada.near", detail: "Approved derivative “Zuri — 3D model”" },
      { kind: "approved", at: "2026-11-06", actor: "ada.near", detail: "Approved derivative “Zuri — Winter coat”" },
      { kind: "royalty", at: "2026-11-09", actor: "studio.near", detail: "Upstream share from a licence of “Zuri — Animated”", amountNear: 7.5 },
      { kind: "licensed", at: "2026-11-10", actor: "pixelforge.near", detail: "Commercial licence · merchandise", amountNear: 5 },
    ],
  },
  {
    id: "zuri-3d",
    title: "Zuri — 3D model",
    kind: "3D model",
    description:
      "Game-ready 3D model of Zuri. 18k tris, PBR textures, rigged for humanoid animation.",
    owner: "ben.near",
    creator: "ben.near",
    parentId: "zuri",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 2500, priceNear: 100 },
    splits: [
      { account: "ben.near", role: "3D modelling", bps: 7000, isOwner: true },
      { account: "cy.near", role: "Texturing", bps: 3000 },
    ],
    art: { species: "fox", hue: 38, variant: "shaded" },
    vaultNear: 21,
    fileHash: "sha256:3b77a0c95e12…0c9d",
    mintedAt: "2026-11-04",
    history: [
      { kind: "submitted", at: "2026-11-03", actor: "ben.near", detail: "Submitted as a derivative of “Zuri”" },
      { kind: "approved", at: "2026-11-04", actor: "ada.near", detail: "Approved by the owner of “Zuri”" },
      { kind: "approved", at: "2026-11-07", actor: "ben.near", detail: "Approved derivative “Zuri — Animated”" },
      { kind: "royalty", at: "2026-11-09", actor: "studio.near", detail: "Upstream share from a licence of “Zuri — Animated”", amountNear: 30 },
    ],
  },
  {
    id: "zuri-animated",
    title: "Zuri — Animated",
    kind: "Animation",
    description:
      "Idle, walk and celebrate loops built on the 3D model, with an original sound set.",
    owner: "dee.near",
    creator: "dee.near",
    parentId: "zuri-3d",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 150 },
    splits: [
      { account: "dee.near", role: "Animation", bps: 8000, isOwner: true },
      { account: "fay.near", role: "Sound design", bps: 2000 },
    ],
    art: { species: "fox", hue: 38, variant: "animated" },
    vaultNear: 90,
    fileHash: "sha256:c41d8e2f6a90…77b2",
    mintedAt: "2026-11-07",
    history: [
      { kind: "submitted", at: "2026-11-06", actor: "dee.near", detail: "Submitted as a derivative of “Zuri — 3D model”" },
      { kind: "approved", at: "2026-11-07", actor: "ben.near", detail: "Approved by the owner of “Zuri — 3D model”" },
      { kind: "licensed", at: "2026-11-09", actor: "studio.near", detail: "Commercial licence · in-game character", amountNear: 150 },
    ],
  },
  {
    id: "zuri-winter",
    title: "Zuri — Winter coat",
    kind: "Outfit",
    description: "A seasonal outfit set: scarf, star pin and a frost palette.",
    owner: "gil.near",
    creator: "gil.near",
    parentId: "zuri",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 1000, priceNear: 30 },
    splits: [{ account: "gil.near", role: "Illustration", bps: 10000, isOwner: true }],
    art: { species: "fox", hue: 220, variant: "outfit" },
    vaultNear: 0,
    fileHash: "sha256:71e0b3d2a4c8…5f10",
    mintedAt: "2026-11-06",
    history: [
      { kind: "submitted", at: "2026-11-05", actor: "gil.near", detail: "Submitted as a derivative of “Zuri”" },
      { kind: "approved", at: "2026-11-06", actor: "ada.near", detail: "Approved by the owner of “Zuri”" },
    ],
  },
  {
    id: "zuri-pixel",
    title: "Zuri — Pixel edition",
    kind: "Sprite sheet",
    description: "32×32 sprite sheet with 6 animation states for retro games.",
    owner: "hal.near",
    creator: "hal.near",
    parentId: "zuri",
    status: "pending",
    terms: { derivatives: true, commercial: true, upstreamBps: 1000, priceNear: 25 },
    splits: [{ account: "hal.near", role: "Pixel art", bps: 10000, isOwner: true }],
    art: { species: "fox", hue: 150, variant: "pixel" },
    vaultNear: 0,
    fileHash: "sha256:0aa9f4c3e2b1…9e33",
    mintedAt: "2026-11-11",
    history: [{ kind: "submitted", at: "2026-11-11", actor: "hal.near", detail: "Submitted as a derivative of “Zuri”" }],
  },

  // ── Family 2: Moth Queen (non-commercial) ─────────────────────
  {
    id: "moth-queen",
    title: "Moth Queen",
    kind: "Original character",
    description:
      "A nocturnal monarch who trades in lamplight. Fan works welcome, commercial use reserved.",
    owner: "ivy.near",
    creator: "ivy.near",
    status: "approved",
    terms: { derivatives: true, commercial: false, upstreamBps: 0, priceNear: 0 },
    splits: [{ account: "ivy.near", role: "Creator", bps: 10000, isOwner: true }],
    art: { species: "moth", hue: 290, variant: "flat" },
    vaultNear: 0,
    fileHash: "sha256:5c1e9a07b3f2…a0d4",
    mintedAt: "2026-11-03",
    history: [
      { kind: "minted", at: "2026-11-03", actor: "ivy.near", detail: "Registered as an original work · non-commercial" },
      { kind: "approved", at: "2026-11-08", actor: "ivy.near", detail: "Approved derivative “Moth Queen — Fan comic”" },
    ],
  },
  {
    id: "moth-comic",
    title: "Moth Queen — Fan comic",
    kind: "Comic",
    description: "A 12-page fan comic. Approved as canon, but not licensable commercially.",
    owner: "jun.near",
    creator: "jun.near",
    parentId: "moth-queen",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 20 },
    splits: [{ account: "jun.near", role: "Comic art", bps: 10000, isOwner: true }],
    art: { species: "moth", hue: 290, variant: "shaded" },
    vaultNear: 0,
    fileHash: "sha256:e8b2c6d1f049…1c7a",
    mintedAt: "2026-11-08",
    history: [
      { kind: "submitted", at: "2026-11-07", actor: "jun.near", detail: "Submitted as a derivative of “Moth Queen”" },
      { kind: "approved", at: "2026-11-08", actor: "ivy.near", detail: "Approved by the owner of “Moth Queen”" },
    ],
  },

  // ── Family 3: Pip (with a revoked derivative) ─────────────────
  {
    id: "pip",
    title: "Pip",
    kind: "Mascot",
    description: "A round, cheerful mascot built for community projects.",
    owner: "lea.near",
    creator: "lea.near",
    status: "approved",
    terms: { derivatives: true, commercial: true, upstreamBps: 1500, priceNear: 60 },
    splits: [
      { account: "lea.near", role: "Creator", bps: 8500, isOwner: true },
      { account: "max.near", role: "Brand design", bps: 1500 },
    ],
    art: { species: "round", hue: 190, variant: "flat" },
    vaultNear: 0,
    fileHash: "sha256:2d9a4f6b8c1e…b5e8",
    mintedAt: "2026-11-02",
    history: [
      { kind: "minted", at: "2026-11-02", actor: "lea.near", detail: "Registered as an original work" },
      { kind: "revoked", at: "2026-11-09", actor: "lea.near", detail: "Revoked approval of “Pip — Neon remix”" },
    ],
  },
  {
    id: "pip-neon",
    title: "Pip — Neon remix",
    kind: "Illustration",
    description: "A neon reinterpretation. Approval was revoked after a style dispute.",
    owner: "nox.near",
    creator: "nox.near",
    parentId: "pip",
    status: "revoked",
    statusNote: "Approval revoked by the owner of “Pip”. Existing licences stay valid; no new licences can be issued.",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 35 },
    splits: [{ account: "nox.near", role: "Illustration", bps: 10000, isOwner: true }],
    art: { species: "round", hue: 330, variant: "outfit" },
    vaultNear: 0,
    fileHash: "sha256:9e4f0a1b2c3d…7a61",
    mintedAt: "2026-11-05",
    history: [
      { kind: "approved", at: "2026-11-05", actor: "lea.near", detail: "Approved by the owner of “Pip”" },
      { kind: "revoked", at: "2026-11-09", actor: "lea.near", detail: "Approval revoked" },
    ],
  },

  // ── Family 4: Bruno (closed to derivatives) ───────────────────
  {
    id: "bruno",
    title: "Bruno",
    kind: "Original character",
    description: "A sleepy bear barista. Licensable as-is; derivatives are closed.",
    owner: "kai.near",
    creator: "kai.near",
    status: "approved",
    terms: { derivatives: false, commercial: true, upstreamBps: 0, priceNear: 80 },
    splits: [{ account: "kai.near", role: "Creator", bps: 10000, isOwner: true }],
    art: { species: "bear", hue: 60, variant: "flat" },
    vaultNear: 80,
    fileHash: "sha256:b1c2d3e4f5a6…8899",
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

/** Account id of a work's keyless vault sub-account. */
export function vaultAccount(id: string) {
  return `${id}.canon.near`;
}
