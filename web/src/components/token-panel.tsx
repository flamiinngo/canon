"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { refreshWorks } from "./canon-data";
import { Button, Label } from "./ui";
import { useWallet } from "./wallet";
import { formatDate, formatNear } from "@/lib/canon";
import { CONTRACT, EXPLORER, LIVE, nftExplorerUrl, view, yoctoToNear, type ChainLicence, type NftToken } from "@/lib/near";
import { cn } from "@/lib/cn";

/** The work as an NFT: token facts, raw on-chain metadata, transfer, and licences issued. */
export function TokenPanel({ workId }: { workId: string }) {
  const { accountId, call } = useWallet();
  const [token, setToken] = useState<NftToken | null>(null);
  const [licences, setLicences] = useState<(ChainLicence & { holder: string })[]>([]);
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string; hash?: string } | null>(null);

  const load = useCallback(async () => {
    if (!LIVE) return;
    const [t, ls] = await Promise.all([view<NftToken | null>("nft_token", { token_id: workId }), view<ChainLicence[]>("get_licences", { work_id: workId })]);
    setToken(t);
    const holders = await Promise.all(ls.map((l) => view<NftToken | null>("nft_token", { token_id: l.licence_token_id }).then((x) => x?.owner_id ?? "burned")));
    setLicences(ls.map((l, i) => ({ ...l, holder: holders[i] })));
  }, [workId]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  if (!LIVE) return null;
  const mine = !!accountId && token?.owner_id === accountId;
  const listed = Object.keys(token?.approved_account_ids ?? {});

  const transfer = async () => {
    setNotice(null);
    try {
      const r = await call("nft_transfer", { receiver_id: to.trim().toLowerCase(), token_id: workId, approval_id: null, memo: null }, "1", 30);
      setNotice({ ok: true, text: "Transferred. The vault and its future income moved with it.", hash: r.hash });
      setOpen(false);
      await Promise.all([load(), refreshWorks()]);
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section className="mt-10">
      <Label>The NFT</Label>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line">
        <dl className="divide-y divide-line text-[13.5px]">
          <Row k="Standard" v={<span className="font-mono text-[12px] text-fg-2">NEP-171 · 177 · 178 · 181</span>} />
          <Row k="Contract" v={<a href={`${EXPLORER}/address/${CONTRACT}`} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-fg-2 hover:text-fg">{CONTRACT} ↗</a>} />
          <Row k="Token ID" v={<a href={nftExplorerUrl(workId)} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-fg-2 hover:text-fg">{workId} ↗</a>} />
          <Row
            k="Holder"
            v={token ? <Link href={`/collection?account=${token.owner_id}`} className="font-mono text-[12px] text-fg underline decoration-line-3 underline-offset-4 hover:decoration-fg">{token.owner_id}</Link> : <span className="text-fg-3">…</span>}
          />
          <Row k="Marketplace approvals" v={<span className={cn("font-mono text-[12px]", listed.length ? "text-ember" : "text-fg-2")}>{listed.length ? `${listed.length} (withdrawals blocked)` : "none"}</span>} />
        </dl>
        {token?.metadata && (
          <details className="group border-t border-line">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs text-fg-3 hover:text-fg">
              <span className="group-open:hidden">Show on-chain metadata (nft_token)</span>
              <span className="hidden group-open:inline">Hide on-chain metadata</span>
            </summary>
            <pre className="max-h-72 overflow-auto bg-bg-2 px-4 py-3 font-mono text-[11px] leading-relaxed text-fg-2">{JSON.stringify(token, null, 2)}</pre>
          </details>
        )}
        {mine && (
          <div className="border-t border-line px-4 py-3">
            {open ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (to.trim()) void transfer();
                }}
              >
                <input autoFocus value={to} onChange={(e) => setTo(e.target.value)} placeholder="receiver.testnet" className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.04] px-3 font-mono text-[12px] text-fg outline-none ring-1 ring-line-2 placeholder:text-fg-3" />
                <Button size="sm" type="submit" variant="primary">
                  Send NFT
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-fg-3">You hold this NFT. Transferring it moves the vault with it.</span>
                <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                  <Send className="size-3.5" /> Transfer
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {notice && (
        <p className={cn("mt-3 text-xs", notice.ok ? "text-ok" : "text-bad")}>
          {notice.text}
          {notice.hash && (
            <a href={`${EXPLORER}/txns/${notice.hash}`} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
              View transaction ↗
            </a>
          )}
        </p>
      )}

      <div className="mt-8">
        <Label>Licence NFTs issued</Label>
        {licences.length === 0 ? (
          <p className="mt-3 text-sm text-fg-3">No licences issued yet.</p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-2xl border border-line">
            {licences.map((l) => (
              <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <a href={nftExplorerUrl(l.licence_token_id)} target="_blank" rel="noreferrer" className="font-mono text-[12.5px] text-fg hover:underline">
                    {l.licence_token_id} ↗
                  </a>
                  <p className="truncate text-[11.5px] text-fg-3">
                    {l.use_case} · {formatDate(new Date(l.at_ms).toISOString().slice(0, 10))} · held by{" "}
                    <Link href={`/collection?account=${l.holder}`} className="font-mono text-fg-2 hover:text-fg">
                      {l.holder}
                    </Link>
                  </p>
                </div>
                <span className="num text-sm text-fg">{formatNear(yoctoToNear(l.price), 0)} Ⓝ</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-fg-3">{k}</dt>
      <dd className="min-w-0 truncate text-right">{v}</dd>
    </div>
  );
}
