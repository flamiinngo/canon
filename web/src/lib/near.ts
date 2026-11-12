/**
 * Thin NEAR RPC client for Canon: view calls over JSON-RPC and mapping of the
 * registry's views onto the UI's Work model.
 */
import type { Genome, PaletteName, Style, Transform } from "./art";
import type { HistoryEvent, Work } from "./types";

export const CONTRACT = process.env.NEXT_PUBLIC_CANON_CONTRACT || "";
export const NETWORK_ID = (process.env.NEXT_PUBLIC_NEAR_NETWORK as "testnet" | "mainnet") || "testnet";
export const RPC_URL = process.env.NEXT_PUBLIC_NEAR_RPC || (NETWORK_ID === "mainnet" ? "https://rpc.mainnet.fastnear.com" : "https://test.rpc.fastnear.com");
export const LIVE = CONTRACT.length > 0;
export const EXPLORER = NETWORK_ID === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io";

const YOCTO = BigInt("1000000000000000000000000");

export function nearToYocto(near: number | string): string {
  const [whole, frac = ""] = String(near).split(".");
  return (BigInt(whole || "0") * YOCTO + BigInt((frac + "0".repeat(24)).slice(0, 24))).toString();
}

export function yoctoToNear(yocto: string | bigint): number {
  const v = BigInt(yocto);
  return Number(v / BigInt("1000000000000000000")) / 1_000_000;
}

function b64(s: string) {
  return typeof window === "undefined" ? Buffer.from(s).toString("base64") : btoa(unescape(encodeURIComponent(s)));
}

export async function view<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "canon",
      method: "query",
      params: { request_type: "call_function", finality: "optimistic", account_id: CONTRACT, method_name: method, args_base64: b64(JSON.stringify(args)) },
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error || json.result?.error) throw new Error(json.error?.data ?? json.error?.message ?? json.result?.error ?? "RPC error");
  const bytes = new Uint8Array(json.result.result as number[]);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

// ── Genome encoding in token metadata `media` ───────────────────────────
// canon:genome/<seed>/<style>/<palette>/<t1+t2>?kind=<kind>
export function encodeGenome(g: Genome, kind: string) {
  return `canon:genome/${g.seed}/${g.style}/${g.palette}/${g.transforms.join("+") || "-"}?kind=${encodeURIComponent(kind)}`;
}

export function decodeGenome(media: string | null | undefined, tokenId: string): { genome: Genome; kind: string } {
  const m = media?.match(/^canon:genome\/(\d+)\/(\w+)\/(\w+)\/([\w+-]+)(?:\?kind=(.*))?$/);
  if (m) {
    return {
      genome: { seed: Number(m[1]), style: m[2] as Style, palette: m[3] as PaletteName, transforms: m[4] === "-" ? [] : (m[4].split("+") as Transform[]) },
      kind: m[5] ? decodeURIComponent(m[5]) : "Artwork",
    };
  }
  // Fallback: deterministic genome from the token id.
  let h = 0;
  for (const c of tokenId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const palettes: PaletteName[] = ["ember", "nocturne", "violet", "tidal", "quarry", "neon"];
  const styles: Style[] = ["flow", "rings", "strata"];
  return { genome: { seed: h % 100000, style: styles[h % 3], palette: palettes[h % 6], transforms: [] }, kind: "Artwork" };
}

// ── Registry view types ─────────────────────────────────────────────────
export interface ChainWork {
  token_id: string;
  title: string | null;
  description: string | null;
  media: string | null;
  owner_id: string;
  vault_id: string;
  parent: string | null;
  children: string[];
  creator: string;
  status: "Pending" | "Approved" | "Rejected" | "Revoked";
  terms: { derivatives: boolean; commercial: boolean; upstream_bps: number; price: string };
  owner_bps: number;
  contributors: { account_id: string; role: string; bps: number }[];
  file_hash: string;
  vault_balance: string;
  earned: string;
  locked: boolean;
  depth: number;
  created_at_ms: number;
}

export interface ChainLicence {
  id: number;
  licence_token_id: string;
  work_id: string;
  buyer: string;
  use_case: string;
  price: string;
  at_ms: number;
}

export function toWork(c: ChainWork): Work {
  const { genome, kind } = decodeGenome(c.media, c.token_id);
  const at = new Date(c.created_at_ms).toISOString().slice(0, 10);
  const history: HistoryEvent[] = [
    { kind: c.parent ? "submitted" : "minted", at, actor: c.creator, detail: c.parent ? `Submitted as a derivative of ${c.parent}` : "Registered as an original work" },
  ];
  if (c.parent && c.status === "Approved") history.push({ kind: "approved", at, actor: "parent owner", detail: "Approved into canon by the parent's owner" });
  if (c.status === "Revoked") history.push({ kind: "revoked", at, actor: "parent owner", detail: "Approval revoked" });
  return {
    id: c.token_id,
    title: c.title ?? c.token_id,
    kind,
    description: c.description ?? "",
    owner: c.owner_id,
    creator: c.creator,
    parentId: c.parent ?? undefined,
    status: c.status.toLowerCase() as Work["status"],
    statusNote: c.status === "Revoked" ? "Approval revoked by the parent's owner. Existing licences stay valid; no new licences can be issued." : undefined,
    terms: { derivatives: c.terms.derivatives, commercial: c.terms.commercial, upstreamBps: c.terms.upstream_bps, priceNear: yoctoToNear(c.terms.price) },
    splits: [
      { account: c.owner_id, role: "Owner", bps: c.owner_bps, isOwner: true },
      ...c.contributors.map((x) => ({ account: x.account_id, role: x.role, bps: x.bps })),
    ].filter((s) => s.bps > 0),
    genome,
    vaultNear: yoctoToNear(c.vault_balance),
    fileHash: c.file_hash,
    mintedAt: at,
    history,
  };
}

export async function fetchWorks(): Promise<Work[]> {
  const all: ChainWork[] = [];
  for (let from = 0; ; from += 100) {
    const page = await view<ChainWork[]>("get_works", { from_index: from, limit: 100 });
    all.push(...page);
    if (page.length < 100) break;
  }
  return all.map(toWork);
}
