"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, MessageSquare, X } from "lucide-react";
import { Character } from "@/components/character";
import { Button, Card, Chip, Mono } from "@/components/ui";
import { WORKS, getWork } from "@/lib/data";
import { formatDate } from "@/lib/canon";

type Decision = "approved" | "rejected" | "changes";

export function ReviewQueue() {
  const pending = WORKS.filter((w) => w.status === "pending");
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  return (
    <div className="mt-10 space-y-4">
      {pending.map((w) => {
        const parent = getWork(w.parentId!)!;
        const d = decisions[w.id];
        return (
          <Card key={w.id} className="overflow-hidden">
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="flex items-center justify-center gap-3 border-b border-line bg-paper-2 p-5 md:border-b-0 md:border-r">
                <Thumb art={parent.art} label="Parent" />
                <ArrowRight className="size-4 shrink-0 text-ink-3" />
                <Thumb art={w.art} label="Submission" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-3xl leading-tight">{w.title}</p>
                    <p className="mt-1 text-sm text-ink-3">
                      {w.kind} · by <Mono>{w.creator}</Mono> · submitted {formatDate(w.mintedAt)}
                    </p>
                  </div>
                  <Mono className="rounded-md bg-paper-2 px-2 py-1">{w.fileHash}</Mono>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-2">{w.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {w.splits.map((s) => (
                    <Chip key={s.account}>
                      <span className="font-mono">{s.account}</span> {s.bps / 100}%
                    </Chip>
                  ))}
                  <Chip>Asks {w.terms.upstreamBps / 100}% from its own derivatives</Chip>
                  <Chip tone="accent">Pays {parent.terms.upstreamBps / 100}% upstream to {parent.title}</Chip>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <AnimatePresence mode="wait">
                    {d ? (
                      <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
                        <p className={d === "approved" ? "flex items-center gap-2 text-sm text-ok" : "flex items-center gap-2 text-sm text-ink-2"}>
                          {d === "approved" ? <Check className="size-4" /> : d === "rejected" ? <X className="size-4" /> : <MessageSquare className="size-4" />}
                          {d === "approved" ? "Approved into canon. It now earns from licences and pays upstream." : d === "rejected" ? "Rejected. The submitter has been notified." : "Changes requested."}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setDecisions(({ [w.id]: _, ...rest }) => rest)}>
                          Undo
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="accent" onClick={() => setDecisions((x) => ({ ...x, [w.id]: "approved" }))}>
                          <Check className="size-4" /> Approve into canon
                        </Button>
                        <Button variant="secondary" onClick={() => setDecisions((x) => ({ ...x, [w.id]: "changes" }))}>
                          Request changes
                        </Button>
                        <Button variant="ghost" onClick={() => setDecisions((x) => ({ ...x, [w.id]: "rejected" }))}>
                          Reject
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      <p className="pt-4 text-center text-xs text-ink-3">You're all caught up after these. New submissions appear here as they arrive.</p>
    </div>
  );
}

function Thumb({ art, label }: { art: Parameters<typeof Character>[0]["art"]; label: string }) {
  return (
    <div className="text-center">
      <div className="size-24 overflow-hidden rounded-2xl shadow-card ring-1 ring-line sm:size-28">
        <Character art={art} />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</p>
    </div>
  );
}
