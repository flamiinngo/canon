import type { Genome } from "./art";

export type WorkStatus = "approved" | "pending" | "rejected" | "revoked" | "flagged";

/** Basis points: 10_000 = 100%. Mirrors the on-chain representation. */
export type Bps = number;

export interface Terms {
  derivatives: boolean;
  commercial: boolean;
  /** Share of every downstream licence that flows up to this work. */
  upstreamBps: Bps;
  priceNear: number;
}

export interface Split {
  account: string;
  role: string;
  bps: Bps;
  /** The owner's share is paid into the work's vault and moves with the NFT. */
  isOwner?: boolean;
}

export type EventKind = "minted" | "submitted" | "approved" | "licensed" | "royalty" | "withdrawn" | "transferred" | "revoked" | "flagged";

export interface HistoryEvent {
  kind: EventKind;
  at: string;
  actor: string;
  detail: string;
  amountNear?: number;
}

export interface Work {
  id: string;
  title: string;
  kind: string;
  description: string;
  owner: string;
  creator: string;
  parentId?: string;
  status: WorkStatus;
  statusNote?: string;
  terms: Terms;
  splits: Split[];
  genome: Genome;
  vaultNear: number;
  fileHash: string;
  mintedAt: string;
  history: HistoryEvent[];
}
