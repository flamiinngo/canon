"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, MessageSquare, RotateCcw, X } from "lucide-react";
import { Artwork } from "@/components/artwork";
import { Button, Chip, Mono } from "@/components/ui";
import { WORKS, getWork } from "@/lib/data";
import { formatDate } from "@/lib/canon";

type Decision = "approved" | "rejected" | "changes";
const KEY = "canon-review-decisions";

export function ReviewQueue() {
  const pending = WORKS.filter((w) => w.status === "pending");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  useEffect(() => {
    try {
      setDecisions(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {}
  }, []);
  const save = (next: Record<string, Decision>) => {
    setDecisions(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="mt-12 space-y-5">
      {pending.map((w) => {
        const parent = getWork(w.parentId!)!;
        const d = decisions[w.id];
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
                  <Mono className="rounded-lg bg-white/[0.03] px-2 py-1 ring-1 ring-line">{w.fileHash}</Mono>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{w.description}</p>
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
                        <p className={d === "approved" ? "flex items-center gap-2 text-sm text-ok" : d === "rejected" ? "flex items-center gap-2 text-sm text-bad" : "flex items-center gap-2 text-sm text-warn"}>
                          {d === "approved" ? <Check className="size-4" /> : d === "rejected" ? <X className="size-4" /> : <MessageSquare className="size-4" />}
                          {d === "approved" ? "Approved into canon. Splits and file hash are now locked." : d === "rejected" ? "Rejected. It won't join the lineage." : "Changes requested from the submitter."}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const { [w.id]: _removed, ...rest } = decisions;
                            void _removed;
                            save(rest);
                          }}
                        >
                          <RotateCcw className="size-3.5" /> Undo
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="primary" onClick={() => save({ ...decisions, [w.id]: "approved" })}>
                          <Check className="size-4" /> Approve into canon
                        </Button>
                        <Button variant="secondary" onClick={() => save({ ...decisions, [w.id]: "changes" })}>
                          Request changes
                        </Button>
                        <Button variant="ghost" onClick={() => save({ ...decisions, [w.id]: "rejected" })}>
                          Reject
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-center text-xs text-fg-3">
        Approved derivatives appear in{" "}
        <Link href="/works/ember" className="text-fg-2 underline underline-offset-4 hover:text-fg">
          the Ember Field lineage
        </Link>
        .
      </p>
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
