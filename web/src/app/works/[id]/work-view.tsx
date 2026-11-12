"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Copy, Download, Play, X } from "lucide-react";
import { Artwork, downloadArtwork } from "@/components/artwork";
import { LineageGraph, type PayoutRun } from "@/components/lineage-graph";
import { LicenseSheet } from "@/components/license-sheet";
import { Button, Chip, Label, Mono, StatusPill } from "@/components/ui";
import { computeClearance, formatDate, formatNear } from "@/lib/canon";
import { generationOf, getWork, rootOf, shortTitle, vaultAccount } from "@/lib/data";
import type { EventKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useCanonData } from "@/components/canon-data";
import { useWallet } from "@/components/wallet";
import { EXPLORER, LIVE, view } from "@/lib/near";
import { ButtonLink } from "@/components/ui";

const SPLIT = ["#eef0f3", "#a98bff", "#52d6ff", "#ff6a3d"];

export function WorkView({ id }: { id: string }) {
  const { status } = useCanonData();
  const work = getWork(id);
  if (!work) {
    if (status === "loading")
      return (
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="aspect-square animate-pulse rounded-[28px] bg-white/[0.04]" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-14 w-3/4 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-24 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      );
    return (
      <div className="mx-auto max-w-[1280px] px-4 pt-24 sm:px-6 lg:px-8">
        <Label>Not found</Label>
        <h1 className="display mt-5 text-[52px] text-fg sm:text-[80px]">Not in the canon.</h1>
        <p className="mt-5 max-w-md text-fg-2">
          No work called <span className="font-mono">{id}</span> is registered{LIVE ? " on this registry" : ""}.
        </p>
        <ButtonLink href="/explore" className="mt-9" size="lg">
          Explore works
        </ButtonLink>
      </div>
    );
  }
  return <WorkDetail id={id} />;
}

function WorkDetail({ id }: { id: string }) {
  const work = getWork(id)!;
  const { accountId, call, connect } = useWallet();
  const { refresh } = useCanonData();
  const [notice, setNotice] = useState<{ ok: boolean; text: string; hash?: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const root = rootOf(id);
  const gen = generationOf(id);
  const parent = work.parentId ? getWork(work.parentId) : undefined;
  const clearance = computeClearance(id);
  const [sheet, setSheet] = useState(false);
  const [run, setRun] = useState<PayoutRun | null>(null);
  const [licensed, setLicensed] = useState(false);
  const lineageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (LIVE) {
      if (!accountId) return setLicensed(false);
      view<boolean>("has_licence", { account_id: accountId, work_id: id })
        .then(setLicensed)
        .catch(() => setLicensed(false));
      return;
    }
    try {
      setLicensed(localStorage.getItem(`canon-licence-${id}`) !== null);
    } catch {}
  }, [id, accountId]);

  const isOwner = !!accountId && accountId === work.owner;
  const withdraw = async () => {
    setWithdrawing(true);
    setNotice(null);
    try {
      const r = await call("withdraw", { token_id: id }, "1", 60);
      setNotice({ ok: r.value !== false, text: r.value === false ? "The vault refused the release. Your balance is unchanged." : "Withdrawn to your account.", hash: r.hash });
      await refresh();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setWithdrawing(false);
    }
  };

  const preview = () => {
    setRun({ workId: id, priceNear: work.terms.priceNear || 100, key: Date.now() });
    lineageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-0">
      <nav className="flex items-center gap-1.5 text-[13px] text-fg-3" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-fg">Explore</Link>
        <ChevronRight className="size-3.5" />
        {root.id !== id && (
          <>
            <Link href={`/works/${root.id}`} className="hover:text-fg">{root.title}</Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="truncate text-fg">{shortTitle(work)}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        {/* Artwork */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-[28px] border border-line">
            <Artwork genome={work.genome} alt={work.title} className="aspect-square w-full" size={1080} live />
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded-full bg-bg/60 px-2.5 py-1 font-mono text-[11px] text-fg-2 ring-1 ring-white/10 backdrop-blur">{gen === 0 ? "Original · Gen 0" : `Derivative · Gen ${gen}`}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
              {work.genome.transforms.length === 0 ? (
                <span className="rounded-full bg-bg/60 px-2.5 py-1 font-mono text-[11px] text-fg-2 ring-1 ring-white/10 backdrop-blur">base · {work.genome.style}</span>
              ) : (
                ["base", ...work.genome.transforms].map((t, i) => (
                  <span key={t + i} className="rounded-full bg-bg/60 px-2.5 py-1 font-mono text-[11px] text-fg-2 ring-1 ring-white/10 backdrop-blur">
                    {i > 0 && <span className="mr-1 text-fg-3">+</span>}
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Label>{work.kind}</Label>
            <StatusPill status={work.status} />
          </div>
          <h1 className="display mt-4 text-[44px] text-fg sm:text-[60px]">{work.title}</h1>
          {parent && (
            <p className="mt-4 text-sm text-fg-2">
              Derived from{" "}
              <Link href={`/works/${parent.id}`} className="text-fg underline decoration-line-3 underline-offset-4 hover:decoration-fg">
                {parent.title}
              </Link>{" "}
              · <span className="font-mono text-[12.5px] text-fg-3">{parent.owner}</span>
            </p>
          )}
          <p className="mt-5 text-[17px] leading-relaxed text-fg-2">{work.description}</p>
          {work.statusNote && <p className="mt-5 rounded-2xl border border-bad/25 bg-bad/[0.07] p-4 text-sm text-bad">{work.statusNote}</p>}

          {/* Licence CTA */}
          <div className="mt-8 hidden lg:block">
            <LicenceCta cleared={clearance.cleared} price={work.terms.priceNear} licensed={licensed} onLicense={() => setSheet(true)} onPreview={preview} onDownload={() => downloadArtwork(work.genome, `${work.id}-source-2048.png`)} />
          </div>

          {/* Clearance */}
          <section className="mt-10">
            <Label>Commercial clearance</Label>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line">
              <div className={cn("flex items-start gap-3 px-4 py-3.5 text-sm font-medium", clearance.cleared ? "bg-ok/[0.08] text-ok" : "bg-bad/[0.08] text-bad")}>
                {clearance.cleared ? <Check className="mt-0.5 size-4 shrink-0" /> : <X className="mt-0.5 size-4 shrink-0" />}
                {clearance.summary}
              </div>
              <ol>
                {clearance.checks.map((c, i) => (
                  <li key={c.work.id} className="flex items-center gap-3 border-t border-line px-4 py-3">
                    <span className="w-10 shrink-0 font-mono text-[10.5px] text-fg-3">{i === 0 ? "this" : `−${i}`}</span>
                    <Artwork genome={c.work.genome} className="size-8 shrink-0 rounded-full" size={128} />
                    <Link href={`/works/${c.work.id}`} className="min-w-0 flex-1 hover:opacity-80">
                      <p className="truncate text-sm text-fg">{c.label}</p>
                      <p className="truncate text-xs text-fg-3">{c.reason}</p>
                    </Link>
                    {c.ok ? <Check className="size-4 shrink-0 text-ok" /> : <X className="size-4 shrink-0 text-bad" />}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Contributors */}
          <section className="mt-10">
            <Label>Contributors &amp; splits</Label>
            <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {work.splits.map((s, i) => (
                <div key={s.account} style={{ width: `${s.bps / 100}%`, background: SPLIT[i % 4] }} className="h-full" />
              ))}
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {work.splits.map((s, i) => (
                <li key={s.account} className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: SPLIT[i % 4] }} />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[12.5px] text-fg">{s.account}</p>
                      <p className="truncate text-[11.5px] text-fg-3">{s.role} · {s.isOwner ? "vault, follows NFT" : "personal credit"}</p>
                    </div>
                  </div>
                  <span className="num text-sm text-fg">{s.bps / 100}%</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Terms */}
          <section className="mt-10">
            <Label>Terms</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone={work.terms.derivatives ? "ok" : "neutral"}>{work.terms.derivatives ? <Check className="size-3" /> : <X className="size-3" />} Derivatives</Chip>
              <Chip tone={work.terms.commercial ? "ok" : "bad"}>{work.terms.commercial ? <Check className="size-3" /> : <X className="size-3" />} Commercial use</Chip>
              {work.terms.derivatives && <Chip>Takes {work.terms.upstreamBps / 100}% from derivatives</Chip>}
              {work.terms.commercial && <Chip>Licence {formatNear(work.terms.priceNear, 0)} Ⓝ</Chip>}
            </div>
          </section>

          {/* Record */}
          <section className="mt-10">
            <Label>On-chain record</Label>
            <dl className="mt-3 divide-y divide-line rounded-2xl border border-line px-4 text-[13.5px]">
              <Row k="Vault" v={<CopyMono text={vaultAccount(work.id)} />} />
              <Row k="Owner" v={<Mono>{work.owner}</Mono>} />
              <Row k="Balance" v={<span className="num text-fg">{formatNear(work.vaultNear)} Ⓝ</span>} />
              {LIVE && work.vaultNear > 0 && (
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-xs text-fg-3">{isOwner ? "You own this work." : "Only the current NFT owner can withdraw."}</span>
                  {isOwner ? (
                    <Button size="sm" variant="secondary" onClick={withdraw} disabled={withdrawing}>
                      {withdrawing ? "Withdrawing…" : `Withdraw ${formatNear(work.vaultNear)} Ⓝ`}
                    </Button>
                  ) : !accountId ? (
                    <Button size="sm" variant="ghost" onClick={connect}>
                      Connect
                    </Button>
                  ) : null}
                </div>
              )}
              <Row k="Access keys" v={<span className="num text-ok">0</span>} />
              <Row k="File hash" v={<Mono>{work.fileHash}</Mono>} />
              <Row k="Registered" v={<span className="text-fg-2">{formatDate(work.mintedAt)}</span>} />
            </dl>
            {notice && (
              <p className={cn("mt-3 rounded-xl border px-3 py-2.5 text-xs", notice.ok ? "border-ok/25 bg-ok/[0.07] text-ok" : "border-bad/25 bg-bad/[0.07] text-bad")}>
                {notice.text}
                {notice.hash && (
                  <a href={`${EXPLORER}/txns/${notice.hash}`} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
                    View transaction ↗
                  </a>
                )}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-fg-3">
              Authorship is declared by <span className="font-mono">{work.creator}</span> and anchored to the file hash. It is evidence, not a copyright registration.
            </p>
          </section>
        </div>
      </div>

      {/* Lineage */}
      <section ref={lineageRef} className="mt-24 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label>Lineage</Label>
            <h2 className="display mt-4 text-[36px] text-fg sm:text-[48px]">The {root.title} family</h2>
          </div>
          {clearance.cleared && (
            <Button variant="secondary" size="sm" onClick={preview}>
              <Play className="size-3.5" /> Replay a {formatNear(work.terms.priceNear, 0)} Ⓝ licence
            </Button>
          )}
        </div>
        <div className="panel noise relative mt-6 overflow-hidden p-4 sm:p-8">
          <div className="hairline-grid absolute inset-0 opacity-40 fade-mask-y" />
          <p className="relative font-mono text-[11px] text-fg-3">Money flows upward · solid = approved · dashed = pending or revoked</p>
          <LineageGraph focusId={id} payout={run} className="relative mt-4" />
        </div>
      </section>

      {/* History */}
      <section className="mt-24">
        <Label>History</Label>
        <h2 className="display mt-4 text-[36px] text-fg sm:text-[48px]">Earned, paid, approved.</h2>
        <ul className="mt-6 overflow-hidden rounded-2xl border border-line">
          {[...work.history].reverse().map((h, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[110px_auto_1fr_auto] sm:gap-5 sm:px-6">
              <span className="hidden font-mono text-[11.5px] text-fg-3 sm:block">{formatDate(h.at)}</span>
              <EventBadge kind={h.kind} />
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{h.detail}</p>
                <p className="truncate font-mono text-[11px] text-fg-3">
                  {h.actor}
                  <span className="sm:hidden"> · {formatDate(h.at)}</span>
                </p>
              </div>
              <span className="num text-sm text-fg">{h.amountNear ? `+${formatNear(h.amountNear)}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl lg:hidden">
        <LicenceCta compact cleared={clearance.cleared} price={work.terms.priceNear} licensed={licensed} onLicense={() => setSheet(true)} onPreview={preview} onDownload={() => downloadArtwork(work.genome, `${work.id}-source-2048.png`)} />
      </div>

      <LicenseSheet
        open={sheet}
        workId={id}
        onClose={() => setSheet(false)}
        onPaid={(use) => {
          if (!LIVE)
            try {
              localStorage.setItem(`canon-licence-${id}`, JSON.stringify({ use, at: Date.now() }));
            } catch {}
          setLicensed(true);
          setSheet(false);
          setTimeout(preview, 250);
        }}
      />
    </div>
  );
}

function LicenceCta({
  cleared,
  price,
  licensed,
  onLicense,
  onPreview,
  onDownload,
  compact,
}: {
  cleared: boolean;
  price: number;
  licensed: boolean;
  onLicense: () => void;
  onPreview: () => void;
  onDownload: () => void;
  compact?: boolean;
}) {
  if (!cleared)
    return (
      <div className={cn("flex items-center justify-between gap-3", !compact && "rounded-2xl border border-line p-5")}>
        <p className="text-sm text-fg-3">Not licensable while the lineage is not cleared.</p>
      </div>
    );
  return (
    <div className={cn("flex items-center justify-between gap-4", !compact && "panel p-5")}>
      <div>
        <p className="text-xs text-fg-3">{licensed ? "You hold a licence" : "Commercial licence · perpetual"}</p>
        <p className="num mt-0.5 text-2xl text-fg">{formatNear(price, 0)} Ⓝ</p>
      </div>
      <div className="flex items-center gap-2">
        {!compact && !licensed && (
          <Button variant="ghost" onClick={onPreview}>
            Preview payout
          </Button>
        )}
        {licensed ? (
          <Button variant="secondary" size={compact ? "md" : "lg"} onClick={onDownload}>
            <Download className="size-4" /> Source file
          </Button>
        ) : (
          <Button variant="ember" size={compact ? "md" : "lg"} onClick={onLicense}>
            License <ArrowUpRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="shrink-0 text-fg-3">{k}</dt>
      <dd className="min-w-0 truncate text-right">{v}</dd>
    </div>
  );
}

function CopyMono({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex max-w-full items-center gap-1.5 font-mono text-[12px] text-fg-2 hover:text-fg"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      <span className="truncate">{text}</span>
      {copied ? <Check className="size-3 text-ok" /> : <Copy className="size-3 shrink-0" />}
    </button>
  );
}

const EVENT: Record<EventKind, [string, string]> = {
  minted: ["Minted", "text-fg-2 ring-line-2"],
  submitted: ["Submitted", "text-warn ring-warn/25"],
  approved: ["Approved", "text-ok ring-ok/25"],
  licensed: ["Licensed", "text-ember ring-ember/30"],
  royalty: ["Upstream", "text-violet ring-violet/30"],
  withdrawn: ["Withdrawn", "text-fg-2 ring-line-2"],
  transferred: ["Transferred", "text-fg-2 ring-line-2"],
  revoked: ["Revoked", "text-bad ring-bad/25"],
  flagged: ["Flagged", "text-bad ring-bad/25"],
};

function EventBadge({ kind }: { kind: EventKind }) {
  const [label, cls] = EVENT[kind];
  return <span className={cn("w-[86px] rounded-full px-2 py-1 text-center font-mono text-[10.5px] ring-1", cls)}>{label}</span>;
}
