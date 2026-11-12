"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Download, KeyRound, Search, Send, Wallet } from "lucide-react";
import { Artwork, downloadArtwork } from "@/components/artwork";
import { refreshWorks, useCanonData } from "@/components/canon-data";
import { Button, Chip, Label, Mono } from "@/components/ui";
import { useWallet } from "@/components/wallet";
import { formatNear } from "@/lib/canon";
import { getWork, vaultAccount } from "@/lib/data";
import {
  CONTRACT,
  DEMO_COLLECTORS,
  EXPLORER,
  LIVE,
  accountExplorerUrl,
  isLicenceToken,
  licenceWorkId,
  nftExplorerUrl,
  tokensForOwner,
  view,
  yoctoToNear,
  type NftToken,
} from "@/lib/near";
import { cn } from "@/lib/cn";

export function CollectionView() {
  const router = useRouter();
  const initialAccount = useSearchParams().get("account") ?? undefined;
  const { accountId, connect, busy, call } = useWallet();
  useCanonData();
  const account = initialAccount ?? accountId ?? null;
  const isMine = !!accountId && account === accountId;
  const [tokens, setTokens] = useState<NftToken[] | null>(null);
  const [claimable, setClaimable] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string; hash?: string } | null>(null);

  const load = useCallback(async () => {
    if (!account || !LIVE) return;
    setError(null);
    try {
      const [t, c] = await Promise.all([tokensForOwner(account), view<string>("get_claimable", { account_id: account })]);
      setTokens(t);
      setClaimable(yoctoToNear(c));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [account]);

  useEffect(() => {
    setTokens(null);
    void load();
  }, [load]);

  const act = async (label: string, fn: () => Promise<{ hash: string; value: unknown }>) => {
    setNotice(null);
    try {
      const r = await fn();
      setNotice({ ok: r.value !== false, text: r.value === false ? `${label} was refused; nothing changed.` : `${label} confirmed on NEAR.`, hash: r.hash });
      await Promise.all([load(), refreshWorks()]);
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
  };

  const works = (tokens ?? []).filter((t) => !isLicenceToken(t.token_id));
  const licences = (tokens ?? []).filter((t) => isLicenceToken(t.token_id));

  return (
    <div className="mt-12">
      {/* Account picker */}
      <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-xs text-fg-3">{account ? (isMine ? "Your wallet" : "Viewing account") : "No account selected"}</p>
          {account ? (
            <a href={accountExplorerUrl(account)} target="_blank" rel="noreferrer" className="mt-0.5 block truncate font-mono text-[15px] text-fg hover:underline">
              {account} <span className="text-fg-3">↗</span>
            </a>
          ) : (
            <p className="mt-0.5 text-[15px] text-fg-2">Connect a wallet, or look up any NEAR account.</p>
          )}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const a = lookup.trim().toLowerCase();
            if (a) router.push(`/collection?account=${encodeURIComponent(a)}`);
          }}
        >
          <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white/[0.03] px-4 ring-1 ring-line-2 focus-within:ring-line-3 sm:w-72">
            <Search className="size-4 text-fg-3" />
            <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="account.testnet" className="w-full bg-transparent font-mono text-[13px] text-fg outline-none placeholder:text-fg-3" />
          </label>
          {!accountId ? (
            <Button type="button" variant="primary" size="md" onClick={connect} disabled={busy}>
              <Wallet className="size-4" /> Connect
            </Button>
          ) : (
            !isMine && (
              <Button type="button" variant="secondary" onClick={() => router.push("/collection")}>
                Mine
              </Button>
            )
          )}
        </form>
      </div>

      {!account && (
        <div className="mt-6">
          <Label>Or open a demo collector</Label>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DEMO_COLLECTORS.map((d) => (
              <Link key={d.account} href={`/collection?account=${d.account}`} className="panel block p-4 transition-colors hover:border-line-3">
                <p className="truncate font-mono text-[13px] text-fg">{d.account.split(".")[0]}</p>
                <p className="mt-1 text-xs text-fg-3">{d.note}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <p className={cn("mt-6 rounded-2xl border px-4 py-3 text-sm", notice.ok ? "border-ok/25 bg-ok/[0.07] text-ok" : "border-bad/25 bg-bad/[0.07] text-bad")}>
          {notice.text}
          {notice.hash && (
            <a href={`${EXPLORER}/txns/${notice.hash}`} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
              View transaction ↗
            </a>
          )}
        </p>
      )}
      {error && <p className="mt-6 rounded-2xl border border-bad/25 bg-bad/[0.07] px-4 py-3 text-sm text-bad">Couldn&apos;t read this account: {error}</p>}

      {account && tokens === null && !error && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-[24px] bg-white/[0.04]" />
          ))}
        </div>
      )}

      {account && tokens && (
        <>
          {/* Summary */}
          <dl className="mt-8 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line">
            <Stat k="Work NFTs" v={String(works.length)} />
            <Stat k="Licence NFTs" v={String(licences.length)} />
            <Stat k="Claimable" v={`${claimable.toFixed(3)} Ⓝ`} action={isMine && claimable > 0 ? <Button size="sm" variant="primary" onClick={() => act("Claim", () => call("claim", {}, "0", 30))}>Claim</Button> : null} />
          </dl>

          {/* Works */}
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Label>Work NFTs · each owns a vault</Label>
                <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-fg">{works.length ? "Works held" : "No works held"}</h2>
              </div>
            </div>
            {works.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {works.map((t) => (
                  <WorkNft key={t.token_id} token={t} mine={isMine} onWithdraw={() => act("Withdrawal", () => call("withdraw", { token_id: t.token_id }, "1", 60))} onTransfer={(to) => act("Transfer", () => call("nft_transfer", { receiver_id: to, token_id: t.token_id, approval_id: null, memo: null }, "1", 30))} />
                ))}
              </div>
            )}
          </section>

          {/* Licences */}
          <section className="mt-16">
            <Label>Licence NFTs · each unlocks source files</Label>
            <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-fg">{licences.length ? "Licences held" : "No licences held"}</h2>
            {licences.length === 0 && (
              <p className="mt-3 text-sm text-fg-3">
                Licence a cleared work from{" "}
                <Link href="/explore" className="text-fg-2 underline underline-offset-4">
                  Explore
                </Link>{" "}
                and its licence NFT appears here.
              </p>
            )}
            {licences.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {licences.map((t) => (
                  <LicenceNft key={t.token_id} token={t} mine={isMine} onTransfer={(to) => act("Transfer", () => call("nft_transfer", { receiver_id: to, token_id: t.token_id, approval_id: null, memo: null }, "1", 30))} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!LIVE && <p className="mt-10 text-sm text-fg-3">Preview mode: no registry configured.</p>}
    </div>
  );
}

function Stat({ k, v, action }: { k: string; v: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 p-4 sm:p-5">
      <div>
        <dt className="text-xs text-fg-3">{k}</dt>
        <dd className="num mt-1 whitespace-nowrap text-base text-fg sm:text-2xl">{v}</dd>
      </div>
      {action}
    </div>
  );
}

function TokenMeta({ id }: { id: string }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] text-fg-3">
      <span className="truncate">
        NEP-171 · <span className="text-fg-2">{id}</span>
      </span>
      <a href={nftExplorerUrl(id)} target="_blank" rel="noreferrer" className="shrink-0 hover:text-fg">
        explorer ↗
      </a>
    </div>
  );
}

function TransferBox({ onTransfer }: { onTransfer: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  if (!open)
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Send className="size-3.5" /> Transfer
      </Button>
    );
  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (to.trim()) onTransfer(to.trim().toLowerCase());
      }}
    >
      <input autoFocus value={to} onChange={(e) => setTo(e.target.value)} placeholder="receiver.testnet" className="h-8 min-w-0 flex-1 rounded-full bg-white/[0.04] px-3 font-mono text-[12px] text-fg outline-none ring-1 ring-line-2 placeholder:text-fg-3" />
      <Button size="sm" type="submit" variant="primary">
        Send
      </Button>
    </form>
  );
}

function WorkNft({ token, mine, onWithdraw, onTransfer }: { token: NftToken; mine: boolean; onWithdraw: () => void; onTransfer: (to: string) => void }) {
  const work = getWork(token.token_id);
  if (!work) return null;
  const listed = Object.keys(token.approved_account_ids ?? {}).length > 0;
  return (
    <div className="panel overflow-hidden">
      <Link href={`/works/${work.id}`} className="group block">
        <div className="relative">
          <Artwork genome={work.genome} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.03]" size={560} />
          <span className="absolute left-3 top-3 rounded-full bg-bg/60 px-2 py-0.5 font-mono text-[10.5px] text-fg-2 ring-1 ring-white/10 backdrop-blur">#{work.id}</span>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-fg">{work.title}</p>
          <p className="truncate font-mono text-[11px] text-fg-3">vault {vaultAccount(work.id)}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-3 py-2.5">
          <span className="text-xs text-fg-3">Vault balance</span>
          <span className="num text-sm text-fg">{formatNear(work.vaultNear, 3)} Ⓝ</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone={work.status === "approved" ? "ok" : "neutral"}>{work.status}</Chip>
          {listed && <Chip tone="ember">listed</Chip>}
          <Chip>
            <KeyRound className="size-3" /> 0 keys
          </Chip>
        </div>
        {mine && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Button size="sm" variant="secondary" disabled={work.vaultNear <= 0 || listed} onClick={onWithdraw} title={listed ? "Withdrawals are blocked while the NFT is listed" : undefined}>
              Withdraw
            </Button>
            <TransferBox onTransfer={onTransfer} />
          </div>
        )}
        <TokenMeta id={token.token_id} />
      </div>
    </div>
  );
}

function LicenceNft({ token, mine, onTransfer }: { token: NftToken; mine: boolean; onTransfer: (to: string) => void }) {
  const workId = licenceWorkId(token);
  const work = workId ? getWork(workId) : undefined;
  let use = "";
  try {
    use = JSON.parse(token.metadata?.extra ?? "{}").use_case ?? "";
  } catch {}
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/15 bg-bg shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="relative">
        {work ? <Artwork genome={work.genome} className="aspect-[4/3] w-full" size={560} live /> : <div className="aspect-[4/3] bg-bg-2" />}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)]" />
        <span className="absolute left-3 top-3 rounded-full bg-bg/70 px-2 py-0.5 font-mono text-[10.5px] text-ember ring-1 ring-ember/30 backdrop-blur">LICENCE · perpetual</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-fg">{token.metadata?.title ?? token.token_id}</p>
          <p className="truncate text-xs text-fg-3">{use}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {work && (
            <Button size="sm" variant="secondary" onClick={() => downloadArtwork(work.genome, `${work.id}-source-2048.png`)} disabled={!mine} title={mine ? undefined : "Only the holder can download"}>
              <Download className="size-3.5" /> Source file
            </Button>
          )}
          {work && (
            <Link href={`/works/${work.id}`} className="inline-flex items-center gap-1 text-xs text-fg-3 hover:text-fg">
              Licensed work <ArrowUpRight className="size-3" />
            </Link>
          )}
          {mine && <TransferBox onTransfer={onTransfer} />}
        </div>
        <TokenMeta id={token.token_id} />
        <p className="font-mono text-[10.5px] text-fg-3">
          holder <Mono className="text-[10.5px]">{token.owner_id}</Mono> · {CONTRACT}
        </p>
      </div>
    </div>
  );
}
