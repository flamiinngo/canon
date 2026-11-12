import { ancestorsOf, getWork } from "./data";
import type { Work } from "./types";
import { WORKS } from "./data";

/**
 * Amounts are computed in integer micro-NEAR (1e-6) with floor division,
 * mirroring the contract's integer yoctoNEAR math. Any remainder ("dust")
 * goes to the node's owner vault, so payouts always sum exactly to the price.
 */
const MICRO = 1_000_000;
const toMicro = (near: number) => Math.round(near * MICRO);
const fromMicro = (m: number) => m / MICRO;

export interface Payee {
  account: string;
  role: string;
  amountNear: number;
  /** true → paid into the work's vault (follows the NFT); false → claimable by the person. */
  toVault: boolean;
}

export interface CascadeStep {
  work: Work;
  generation: number; // 0 = the licensed work, 1 = parent, ...
  incomingNear: number;
  upstreamNear: number;
  keptNear: number;
  payees: Payee[];
}

export function computeCascade(workId: string, priceNear: number, src: Work[] = WORKS): CascadeStep[] {
  const licensed = getWork(workId, src);
  if (!licensed) return [];
  const chain = [licensed, ...ancestorsOf(workId, src)];
  const steps: CascadeStep[] = [];
  let incoming = toMicro(priceNear);

  chain.forEach((work, i) => {
    const parent = chain[i + 1];
    const upstream = parent ? Math.floor((incoming * parent.terms.upstreamBps) / 10_000) : 0;
    const kept = incoming - upstream;

    let distributed = 0;
    const payees: Payee[] = work.splits.map((s) => {
      const amt = Math.floor((kept * s.bps) / 10_000);
      distributed += amt;
      return { account: s.account, role: s.role, amountNear: amt, toVault: !!s.isOwner };
    });
    const dust = kept - distributed;
    const ownerIdx = Math.max(0, payees.findIndex((p) => p.toVault));
    payees[ownerIdx].amountNear += dust;

    steps.push({
      work,
      generation: i,
      incomingNear: fromMicro(incoming),
      upstreamNear: fromMicro(upstream),
      keptNear: fromMicro(kept),
      payees: payees.map((p) => ({ ...p, amountNear: fromMicro(p.amountNear) })),
    });
    incoming = upstream;
  });

  return steps;
}

export interface ClearanceCheck {
  work: Work;
  ok: boolean;
  label: string;
  reason?: string;
}

export interface Clearance {
  cleared: boolean;
  checks: ClearanceCheck[];
  summary: string;
}

/** Walks the whole lineage. A work is cleared only if every ancestor allows it. */
export function computeClearance(workId: string, src: Work[] = WORKS): Clearance {
  const work = getWork(workId, src);
  if (!work) return { cleared: false, checks: [], summary: "Unknown work" };
  const chain = [work, ...ancestorsOf(workId, src)];

  const checks: ClearanceCheck[] = chain.map((w, i) => {
    const child = chain[i - 1];
    if (w.status === "pending")
      return { work: w, ok: false, label: w.title, reason: "Awaiting approval from the parent's owner" };
    if (w.status === "revoked")
      return { work: w, ok: false, label: w.title, reason: "Approval was revoked by the parent's owner" };
    if (w.status === "flagged")
      return { work: w, ok: false, label: w.title, reason: "Flagged for an ownership dispute" };
    if (w.status === "rejected")
      return { work: w, ok: false, label: w.title, reason: "Rejected by the parent's owner" };
    if (!w.terms.commercial)
      return { work: w, ok: false, label: w.title, reason: "Commercial use is not permitted by this work" };
    if (child && !w.terms.derivatives)
      return { work: w, ok: false, label: w.title, reason: "This work does not permit derivatives" };
    return {
      work: w,
      ok: true,
      label: w.title,
      reason: i === 0 ? "Approved · commercial use allowed" : `Allows commercial derivatives · takes ${(w.terms.upstreamBps / 100).toFixed(0)}% upstream`,
    };
  });

  const cleared = checks.every((c) => c.ok);
  const firstFail = checks.find((c) => !c.ok);
  const gens = chain.length;
  return {
    cleared,
    checks,
    summary: cleared
      ? `Cleared for commercial use across ${gens} generation${gens > 1 ? "s" : ""}`
      : `Not cleared — ${firstFail?.label}: ${firstFail?.reason?.toLowerCase()}`,
  };
}

export function formatNear(n: number, digits = 2) {
  // Whole-number formatting never hides a fractional price (1.5 stays 1.5, not 2).
  if (digits === 0 && !Number.isInteger(n)) return n.toLocaleString("en-US", { maximumFractionDigits: 3 });
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
