"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Copy, FileLock2, Play, X } from "lucide-react";
import { Character } from "@/components/character";
import { LineageGraph, type PayoutRun } from "@/components/lineage-graph";
import { LicenseSheet } from "@/components/license-sheet";
import { Button, Card, Chip, Eyebrow, Fig, Mono, StatusPill } from "@/components/ui";
import { computeClearance, formatDate, formatNear } from "@/lib/canon";
import { ancestorsOf, generationOf, getWork, rootOf, vaultAccount } from "@/lib/data";
import type { EventKind } from "@/lib/types";
import { cn } from "@/lib/cn";

const SPLIT_COLORS = ["var(--accent)", "var(--gen-1)", "var(--gen-2)", "var(--gen-3)"];

export function WorkView({ id }: { id: string }) {
  const work = getWork(id)!;
  const root = rootOf(id);
  const gen = generationOf(id);
  const parent = work.parentId ? getWork(work.parentId) : undefined;
  const clearance = computeClearance(id);
  const [sheet, setSheet] = useState(false);
  const [run, setRun] = useState<PayoutRun | null>(null);
  const [licensed, setLicensed] = useState(false);
  const lineageRef = useRef<HTMLElement>(null);

  const preview = () => {
    setRun({ workId: id, priceNear: work.terms.priceNear || 100, key: Date.now() });
    lineageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-8">
      <nav className="flex items-center gap-1.5 text-sm text-ink-3" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-ink">Explore</Link>
        <ChevronRight className="size-3.5" />
        {root.id !== id && (
          <>
            <Link href={`/works/${root.id}`} className="hover:text-ink">{root.title}</Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="truncate text-ink">{work.title.replace(/^.*— /, "")}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        {/* ── Left: artwork + record ── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="relative aspect-square">
              <Character art={work.art} title={work.title} />
              <span className="num absolute left-4 top-4 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] text-ink-2 backdrop-blur">
                {gen === 0 ? "Original · Gen 0" : `Derivative · Gen ${gen}`}
              </span>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-ink">On-chain record</p>
            <dl className="mt-3 divide-y divide-line text-sm">
              <Row k="Vault account" v={<CopyMono text={vaultAccount(work.id)} />} />
              <Row k="Current owner" v={<Mono>{work.owner}</Mono>} />
              <Row k="Vault balance" v={<span className="num font-medium text-ink">{formatNear(work.vaultNear)} Ⓝ</span>} />
              <Row k="Access keys" v={<span className="num text-ok">0 · keyless</span>} />
              <Row k="File hash" v={<Mono>{work.fileHash}</Mono>} />
              <Row k="Registered" v={<span className="text-ink-2">{formatDate(work.mintedAt)}</span>} />
            </dl>
            <p className="mt-4 rounded-lg bg-paper-2 p-3 text-xs leading-relaxed text-ink-3">
              Authorship is declared by <span className="font-mono">{work.creator}</span> and recorded on-chain with the file hash.
              It is evidence, not a copyright registration.
            </p>
          </Card>
        </div>

        {/* ── Right: details ── */}
        <div className="min-w-0 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{work.kind}</Eyebrow>
              <StatusPill status={work.status} />
            </div>
            <h1 className="mt-3 font-display text-5xl leading-[1] tracking-[-0.02em] sm:text-6xl">{work.title}</h1>
            {parent && (
              <p className="mt-3 text-sm text-ink-2">
                Derived from{" "}
                <Link href={`/works/${parent.id}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  {parent.title}
                </Link>{" "}
                by <span className="font-mono text-[13px]">{parent.owner}</span>
              </p>
            )}
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-2">{work.description}</p>
            {work.statusNote && <p className="mt-4 rounded-xl bg-bad-soft p-4 text-sm text-bad">{work.statusNote}</p>}
          </div>

          {/* Contributors */}
          <section>
            <SectionTitle>Contributors &amp; splits</SectionTitle>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-paper-2">
              {work.splits.map((s, i) => (
                <div key={s.account} style={{ width: `${s.bps / 100}%`, background: SPLIT_COLORS[i % 4] }} className="h-full first:rounded-l-full last:rounded-r-full" />
              ))}
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {work.splits.map((s, i) => (
                <li key={s.account} className="flex items-center justify-between gap-3 rounded-xl p-3 ring-1 ring-line">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: SPLIT_COLORS[i % 4] }} />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px] text-ink">{s.account}</p>
                      <p className="text-xs text-ink-3">{s.role} · {s.isOwner ? "to vault (follows NFT)" : "personal credit"}</p>
                    </div>
                  </div>
                  <span className="num text-sm font-medium text-ink">{s.bps / 100}%</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Terms */}
          <section>
            <SectionTitle>Terms</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone={work.terms.derivatives ? "ok" : "neutral"}>{work.terms.derivatives ? <Check className="size-3" /> : <X className="size-3" />} Derivatives</Chip>
              <Chip tone={work.terms.commercial ? "ok" : "bad"}>{work.terms.commercial ? <Check className="size-3" /> : <X className="size-3" />} Commercial use</Chip>
              {work.terms.derivatives && <Chip>Upstream share · {work.terms.upstreamBps / 100}%</Chip>}
              {work.terms.commercial && <Chip>Licence · {formatNear(work.terms.priceNear, 0)} Ⓝ</Chip>}
            </div>
          </section>

          {/* Clearance */}
          <section>
            <SectionTitle>Commercial clearance</SectionTitle>
            <Card className="mt-3 overflow-hidden">
              <div className={cn("flex items-start gap-3 p-4", clearance.cleared ? "bg-ok-soft" : "bg-bad-soft")}>
                <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-paper", clearance.cleared ? "bg-ok" : "bg-bad")}>
                  {clearance.cleared ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <p className={cn("text-sm font-medium", clearance.cleared ? "text-ok" : "text-bad")}>{clearance.summary}</p>
              </div>
              <ol className="divide-y divide-line">
                {clearance.checks.map((c, i) => (
                  <li key={c.work.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="num w-10 shrink-0 text-[11px] text-ink-3">{i === 0 ? "this" : `gen −${i}`}</span>
                    <div className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                      <Character art={c.work.art} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{c.label}</p>
                      <p className="truncate text-xs text-ink-3">{c.reason}</p>
                    </div>
                    {c.ok ? <Check className="size-4 shrink-0 text-ok" /> : <X className="size-4 shrink-0 text-bad" />}
                  </li>
                ))}
              </ol>
            </Card>
          </section>

          {/* Licence CTA (desktop) */}
          <LicenceCta
            className="hidden lg:flex"
            cleared={clearance.cleared}
            price={work.terms.priceNear}
            licensed={licensed}
            onLicense={() => setSheet(true)}
            onPreview={preview}
          />
        </div>
      </div>

      {/* ── Lineage ── */}
      <section ref={lineageRef} className="mt-16 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Lineage</Eyebrow>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.015em]">The {root.title} family</h2>
          </div>
          {clearance.cleared && (
            <Button variant="secondary" size="sm" onClick={preview}>
              <Play className="size-3.5" /> Preview a {formatNear(work.terms.priceNear, 0)} Ⓝ licence
            </Button>
          )}
        </div>
        <Card className="grain mt-5 overflow-hidden p-4 sm:p-8">
          <Fig n="1.0">Money flows upward. Solid lines are approved; dashed are pending or revoked.</Fig>
          <LineageGraph focusId={id} payout={run} className="mt-4" />
        </Card>
      </section>

      {/* ── History ── */}
      <section className="mt-16">
        <Eyebrow>History</Eyebrow>
        <h2 className="mt-3 font-display text-4xl tracking-[-0.015em]">What this work earned, paid and did</h2>
        <Card className="mt-5 overflow-hidden">
          <ul className="divide-y divide-line">
            {[...work.history].reverse().map((h, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[120px_auto_1fr_auto] sm:gap-5 sm:px-6">
                <span className="hidden text-xs text-ink-3 sm:block">{formatDate(h.at)}</span>
                <EventBadge kind={h.kind} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{h.detail}</p>
                  <p className="truncate font-mono text-[11px] text-ink-3">
                    {h.actor}
                    <span className="sm:hidden"> · {formatDate(h.at)}</span>
                  </p>
                </div>
                <span className="num text-sm text-ink">{h.amountNear ? `+${formatNear(h.amountNear)} Ⓝ` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── Mobile sticky CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <LicenceCta cleared={clearance.cleared} price={work.terms.priceNear} licensed={licensed} onLicense={() => setSheet(true)} onPreview={preview} compact />
      </div>

      <LicenseSheet
        open={sheet}
        workId={id}
        onClose={() => setSheet(false)}
        onPaid={() => {
          setLicensed(true);
          setSheet(false);
          setTimeout(preview, 250);
        }}
      />
      <span className="sr-only">{ancestorsOf(id).length} ancestors</span>
    </div>
  );
}

function LicenceCta({
  cleared,
  price,
  licensed,
  onLicense,
  onPreview,
  compact,
  className,
}: {
  cleared: boolean;
  price: number;
  licensed: boolean;
  onLicense: () => void;
  onPreview: () => void;
  compact?: boolean;
  className?: string;
}) {
  if (!cleared)
    return (
      <div className={cn("flex items-center justify-between gap-3", !compact && "rounded-2xl p-5 ring-1 ring-line", className)}>
        <p className="text-sm text-ink-3">This work can't be licensed commercially right now.</p>
        <span className="num text-sm text-ink-3">—</span>
      </div>
    );
  return (
    <div className={cn("flex items-center justify-between gap-4", !compact && "rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line", className)}>
      <div>
        <p className="text-xs text-ink-3">{licensed ? "You hold a licence NFT" : "Commercial licence"}</p>
        <p className="num text-xl font-medium text-ink">{formatNear(price, 0)} Ⓝ</p>
      </div>
      <div className="flex items-center gap-2">
        {!compact && (
          <Button variant="ghost" onClick={onPreview}>
            Preview payout
          </Button>
        )}
        {licensed ? (
          <Button variant="secondary">
            <FileLock2 className="size-4" /> Source files
          </Button>
        ) : (
          <Button variant="accent" size={compact ? "md" : "lg"} onClick={onLicense}>
            License this work <ArrowUpRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-ink">{children}</h2>;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-ink-3">{k}</dt>
      <dd className="min-w-0 truncate text-right">{v}</dd>
    </div>
  );
}

function CopyMono({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex max-w-full items-center gap-1.5 font-mono text-[12px] text-ink-2 hover:text-ink"
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

const EVENT_STYLE: Record<EventKind, [string, string]> = {
  minted: ["Minted", "bg-paper-2 text-ink-2"],
  submitted: ["Submitted", "bg-warn-soft text-warn"],
  approved: ["Approved", "bg-ok-soft text-ok"],
  licensed: ["Licensed", "bg-accent-soft text-accent"],
  royalty: ["Upstream", "bg-accent-soft text-accent"],
  withdrawn: ["Withdrawn", "bg-paper-2 text-ink-2"],
  transferred: ["Transferred", "bg-paper-2 text-ink-2"],
  revoked: ["Revoked", "bg-bad-soft text-bad"],
  flagged: ["Flagged", "bg-bad-soft text-bad"],
};

function EventBadge({ kind }: { kind: EventKind }) {
  const [label, cls] = EVENT_STYLE[kind];
  return <span className={cn("w-[84px] rounded-md px-2 py-1 text-center text-[11px] font-medium", cls)}>{label}</span>;
}
