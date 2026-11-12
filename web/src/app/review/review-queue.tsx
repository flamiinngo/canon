"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Artwork } from "@/components/artwork";
import { useCanonData } from "@/components/canon-data";
import { Button, Chip, Mono } from "@/components/ui";
import { useWallet } from "@/components/wallet";
import { WORKS, getWork } from "@/lib/data";
import { formatDate } from "@/lib/canon";
import { EXPLORER, LIVE } from "@/lib/near";
import { cn } from "@/lib/cn";

type Decision = "approved" | "rejected";
const KEY = "canon-review-decisions";

export function ReviewQueue() {
  const { status, refresh } = useCanonData();
  const { accountId, connect, call } = useWallet();
  const pending = WORKS.filter((w) => w.status === "pending");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, { ok: boolean; text: string; hash?: string }>>({});

  useEffect(() => {
    if (LIVE) return;
    try {
      setDecisions(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {}
  }, []);

  const savePreview = (next: Record<string, Decision>) => {
    setDecisions(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const decide = async (id: string, d: Decision) => {
    if (!LIVE) return savePreview({ ...decisions, [id]: d });
    setBusy(id);
    try {
      const r = await call(d === "approved" ? "approve" : "reject", { token_id: id }, "1", 30);
      setNotice((n) => ({ ...n, [id]: { ok: true, text: d === "approved" ? "Approved into canon on-chain." : "Rejected on-chain.", hash: r.hash } }));
      await refresh();
    } catch (e) {
      setNotice((n) => ({ ...n, [id]: { ok: false, text: e instanceof Error ? e.message : String(e) } }));
    } finally {
      setBusy(null);
    }
  };

  if (status === "loading") return <div className="panel mt-12 h-64 animate-pulse" />;

  const shown = LIVE ? pending : pending;
  return (
    <div className="mt-12 space-y-5">
      {shown.length === 0 && (
        <div className="panel p-12 text-center">
          <p className="text-xl font-medium tracking-[-0.03em] text-fg">Nothing waiting for review</p>
          <p className="mt-2 text-sm text-fg-3">
            When someone submits a derivative of a work, it appears here for the parent&apos;s owner.{" "}
            <Link href="/register" className="text-fg-2 underline underline-offset-4 hover:text-fg">
              Submit one
            </Link>
            .
          </p>
        </div>
      )}
      {shown.map((w) => {
        const parent = getWork(w.parentId!)!;
        const d = decisions[w.id];
        const canDecide = !LIVE || accountId === parent.owner;
        const n = notice[w.id];
        return (
          <div key={w.id} className="panel noise overflow-hidden">
            <div className="grid md:grid-cols-[340px_1fr]">
              <div className="flex items-center justify-center gap-4 border-b border-line bg-bg-2/60 p-6 md:border-b-0 md:border-r">
                <Thumb id={parent.id} label="Parent" />
                <ArrowRight className="size-4 shrink-0 text-fg-3" />
                <Thumb id={w.id} label="Submission" />
              </div>
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[26px] font-medium tracking-[-0.035em] text-fg">{w.title}</p>
                    <p className="mt-1 text-sm text-fg-3">
                      {w.kind} · <Mono>{w.creator}</Mono> · {formatDate(w.mintedAt)}
                    </p>
                  </div>
                  <Mono className="max-w-full truncate rounded-lg bg-white/[0.03] px-2 py-1 ring-1 ring-line">{w.fileHash}</Mono>
                </div>
                {w.description && <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{w.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {w.splits.map((s) => (
                    <Chip key={s.account}>
                      <span className="font-mono">{s.account}</span> {s.bps / 100}%
                    </Chip>
                  ))}
                  <Chip tone="ember">Pays {parent.terms.upstreamBps / 100}% upstream to {parent.title}</Chip>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <AnimatePresence mode="wait">
                    {d ? (
                      <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
                        <p className={d === "approved" ? "flex items-center gap-2 text-sm text-ok" : "flex items-center gap-2 text-sm text-bad"}>
                          {d === "approved" ? <Check className="size-4" /> : <X className="size-4" />}
                          {d === "approved" ? "Approved into canon (preview). Splits and file hash are locked." : "Rejected (preview). It won't join the lineage."}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const next = { ...decisions };
                            delete next[w.id];
                            savePreview(next);
                          }}
                        >
                          <RotateCcw className="size-3.5" /> Undo
                        </Button>
                      </motion.div>
                    ) : canDecide ? (
                      <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="primary" disabled={busy === w.id} onClick={() => decide(w.id, "approved")}>
                          <Check className="size-4" /> {busy === w.id ? "Signing…" : "Approve into canon"}
                        </Button>
                        <Button variant="ghost" disabled={busy === w.id} onClick={() => decide(w.id, "rejected")}>
                          Reject
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-3">
                        <span>
                          Only <span className="font-mono text-fg-2">{parent.owner}</span>, the current owner of {parent.title}, can decide.
                        </span>
                        {!accountId && (
                          <Button variant="secondary" size="sm" onClick={connect}>
                            Connect wallet
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {n && (
                    <p className={cn("mt-3 text-xs", n.ok ? "text-ok" : "text-bad")}>
                      {n.text}
                      {n.hash && (
                        <a href={`${EXPLORER}/txns/${n.hash}`} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
                          View transaction ↗
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Thumb({ id, label }: { id: string; label: string }) {
  const w = getWork(id)!;
  return (
    <Link href={`/works/${id}`} className="group text-center">
      <Artwork genome={w.genome} className="size-28 rounded-2xl border border-line transition-transform duration-500 group-hover:scale-[1.03] sm:size-32" size={320} />
      <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">{label}</p>
    </Link>
  );
}
