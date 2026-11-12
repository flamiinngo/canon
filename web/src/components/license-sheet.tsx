"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, X } from "lucide-react";
import { computeCascade, formatNear } from "@/lib/canon";
import { getWork } from "@/lib/data";
import { Character } from "./character";
import { Button } from "./ui";
import { cn } from "@/lib/cn";

const USES = [
  { id: "game", label: "Games & interactive", note: "In-game character, cosmetics, trailers" },
  { id: "animation", label: "Film & animation", note: "Series, shorts, ads" },
  { id: "merch", label: "Merchandise", note: "Physical and digital goods" },
];

export function LicenseSheet({ open, workId, onClose, onPaid }: { open: boolean; workId: string; onClose: () => void; onPaid: () => void }) {
  const work = getWork(workId)!;
  const price = work.terms.priceNear;
  const cascade = computeCascade(workId, price);
  const [use, setUse] = useState("game");
  const [phase, setPhase] = useState<"review" | "paying" | "done">("review");

  useEffect(() => {
    if (open) setPhase("review");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const pay = () => {
    setPhase("paying");
    setTimeout(() => setPhase("done"), 1400);
  };

  const payees = cascade.flatMap((s) => s.payees.map((p) => ({ ...p, work: s.work, gen: s.generation })));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="license-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-float ring-1 ring-line sm:max-w-lg sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="size-9 overflow-hidden rounded-full ring-1 ring-line">
                  <Character art={work.art} />
                </div>
                <div>
                  <p id="license-title" className="text-sm font-medium text-ink">License {work.title}</p>
                  <p className="font-mono text-[11px] text-ink-3">{work.id}.canon.near</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            {phase !== "done" ? (
              <div className="space-y-6 p-5">
                <fieldset>
                  <legend className="text-sm font-medium text-ink">Intended use</legend>
                  <div className="mt-3 grid gap-2">
                    {USES.map((u) => (
                      <label
                        key={u.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3.5 ring-1 transition-colors",
                          use === u.id ? "bg-accent-soft/50 ring-accent" : "ring-line hover:ring-line-strong",
                        )}
                      >
                        <span>
                          <span className="block text-sm text-ink">{u.label}</span>
                          <span className="block text-xs text-ink-3">{u.note}</span>
                        </span>
                        <input type="radio" name="use" value={u.id} checked={use === u.id} onChange={() => setUse(u.id)} className="accent-[var(--accent)]" />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <p className="text-sm font-medium text-ink">Where your {formatNear(price, 0)} Ⓝ goes</p>
                  <p className="mt-1 text-xs text-ink-3">Computed from the lineage before you pay. Payouts always sum to the price.</p>
                  <ul className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                    {payees.map((p) => (
                      <li key={`${p.work.id}-${p.account}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[12px] text-ink">{p.toVault ? `${p.work.id}.canon.near` : p.account}</p>
                          <p className="truncate text-[11px] text-ink-3">
                            {p.gen === 0 ? "This work" : `Gen −${p.gen}`} · {p.role} · {p.toVault ? "vault" : "personal"}
                          </p>
                        </div>
                        <span className="num text-sm text-ink">{formatNear(p.amountNear)} Ⓝ</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between bg-paper-2 px-3.5 py-2.5">
                      <span className="text-xs font-medium text-ink-2">Total</span>
                      <span className="num text-sm font-medium text-ink">{formatNear(payees.reduce((a, p) => a + p.amountNear, 0))} Ⓝ</span>
                    </li>
                  </ul>
                </div>

                <Button variant="accent" size="lg" className="w-full" onClick={pay} disabled={phase === "paying"}>
                  {phase === "paying" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Confirming on NEAR…
                    </>
                  ) : (
                    <>Pay {formatNear(price, 0)} Ⓝ and mint licence</>
                  )}
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-ink-3">
                  Preview mode: no funds move yet. The licence text is hashed into the licence NFT.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <motion.div
                  initial={{ rotateX: 12, y: 12, opacity: 0 }}
                  animate={{ rotateX: 0, y: 0, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
                  className="grain overflow-hidden rounded-2xl bg-ink text-paper"
                >
                  <div className="flex items-center gap-4 p-5">
                    <div className="size-16 overflow-hidden rounded-xl ring-2 ring-paper/20">
                      <Character art={work.art} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/60">Licence NFT · #0042</p>
                      <p className="mt-1 truncate font-display text-2xl">{work.title}</p>
                      <p className="text-xs text-paper/60">{USES.find((u) => u.id === use)?.label} · perpetual</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-t border-paper/10 text-center">
                    <Meta k="Paid" v={`${formatNear(price, 0)} Ⓝ`} />
                    <Meta k="Generations" v={String(cascade.length)} />
                    <Meta k="Payees" v={String(payees.length)} />
                  </div>
                </motion.div>
                <p className="mt-5 flex items-center gap-2 text-sm text-ok">
                  <Check className="size-4" /> Licence issued. Source files are unlocked for the holder.
                </p>
                <Button variant="primary" size="lg" className="mt-5 w-full" onClick={onPaid}>
                  Watch the payment flow
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-r border-paper/10 px-3 py-3 last:border-r-0">
      <p className="text-[10px] uppercase tracking-wider text-paper/50">{k}</p>
      <p className="num mt-0.5 text-sm">{v}</p>
    </div>
  );
}
