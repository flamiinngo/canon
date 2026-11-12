export type Species = "fox" | "bear" | "moth" | "round";
export type Variant = "flat" | "shaded" | "animated" | "outfit" | "pixel";

export type WorkStatus = "approved" | "pending" | "rejected" | "revoked" | "flagged";

/** Basis points: 10_000 = 100%. Mirrors the on-chain representation. */
export type Bps = number;

export interface Terms {
  /** Can others submit derivatives of this work? */
  derivatives: boolean;
  /** Can this work (and its derivatives) be licensed commercially? */
  commercial: boolean;
  /** Share of every downstream licence that flows up to this work. */
  upstreamBps: Bps;
  /** Price of a commercial licence for this work, in NEAR. */
  priceNear: number;
}

export interface Split {
  account: string;
  role: string;
  bps: Bps;
  /** The NFT owner's share is paid into the work's vault and moves with the NFT. */
  isOwner?: boolean;
}

export type EventKind = "minted" | "submitted" | "approved" | "licensed" | "royalty" | "withdrawn" | "transferred" | "revoked" | "flagged";

export interface HistoryEvent {
  kind: EventKind;
  at: string; // ISO date
  actor: string;
  detail: string;
  amountNear?: number;
}

export interface Art {
  species: Species;
  hue: number;
  variant: Variant;
}

export interface Work {
  id: string;
  title: string;
  kind: string; // "Original character", "3D model", ...
  description: string;
  owner: string;
  creator: string;
  parentId?: string;
  status: WorkStatus;
  statusNote?: string;
  terms: Terms;
  splits: Split[];
  art: Art;
  vaultNear: number;
  fileHash: string;
  mintedAt: string;
  history: HistoryEvent[];
}
