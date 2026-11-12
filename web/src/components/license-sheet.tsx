"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, Loader2, Wallet, X } from "lucide-react";
import { computeCascade, formatNear } from "@/lib/canon";
import { getWork, vaultAccount } from "@/lib/data";
import { Artwork, downloadArtwork } from "./artwork";
import { Button } from "./ui";
import { useWallet } from "./wallet";
import { cn } from "@/lib/cn";

export const USES = [
  { id: "game", label: "Games & interactive", note: "Key art, in-game skies, cosmetics" },
  { id: "film", label: "Film & motion", note: "Title sequences, series, ads" },
  { id: "brand", label: "Brand & merchandise", note: "Packaging, apparel, digital goods" },
];

export function LicenseSheet({ open, workId, onClose, onPaid }: { open: boolean; workId: string; onClose: () => void; onPaid: (use: string) => void }) {
  const work = getWork(workId)!;
  const price = work.terms.priceNear;
  const cascade = computeCascade(workId, price);
  const { accountId, connect, busy } = useWallet();
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

  const payees = cascade.flatMap((s) => s.payees.map((p) => ({ ...p, work: s.work, gen: s.generation })));
  const total = payees.reduce((a, p) => a + p.amountNear, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="license-title"
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.55 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-line-2 bg-surface shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:max-w-[520px] sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/90 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Artwork genome={work.genome} className="size-10 rounded-xl" size={128} />
                <div>
                  <p id="license-title" className="text-sm font-medium text-fg">License {work.title}</p>
                  <p className="font-mono text-[11px] text-fg-3">{vaultAccount(work.id)}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-fg-3 hover:bg-white/5 hover:text-fg" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            {phase !== "done" ? (
              <div className="space-y-7 p-5">
                <fieldset>
                  <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">Intended use</legend>
                  <div className="mt-3 grid gap-2">
                    {USES.map((u) => (
                      <label
                        key={u.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-colors",
                          use === u.id ? "border-fg/40 bg-white/[0.05]" : "border-line hover:border-line-2",
                        )}
                      >
                        <span>
                          <span className="block text-sm text-fg">{u.label}</span>
                          <span className="block text-xs text-fg-3">{u.note}</span>
                        </span>
                        <span className={cn("flex size-5 items-center justify-center rounded-full border", use === u.id ? "border-fg bg-fg" : "border-line-3")}>
                          {use === u.id && <Check className="size-3 text-bg" />}
                        </span>
                        <input type="radio" name="use" value={u.id} checked={use === u.id} onChange={() => setUse(u.id)} className="sr-only" />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">Where {formatNear(price, 0)} Ⓝ goes</p>
                  <ul className="mt-3 overflow-hidden rounded-2xl border border-line">
                    {payees.map((p) => (
                      <li key={`${p.work.id}-${p.account}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[12px] text-fg">{p.toVault ? vaultAccount(p.work.id) : p.account}</p>
                          <p className="truncate text-[11px] text-fg-3">
                            {p.gen === 0 ? "This work" : `Ancestor −${p.gen}`} · {p.role} · {p.toVault ? "vault, follows NFT" : "personal credit"}
                          </p>
                        </div>
                        <span className="num text-sm text-fg">{formatNear(p.amountNear)}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between bg-white/[0.03] px-4 py-3">
                      <span className="text-xs text-ok">✓ Sum equals price</span>
                      <span className="num text-sm font-medium text-fg">{formatNear(total)} Ⓝ</span>
                    </li>
                  </ul>
                </div>

                {accountId ? (
                  <Button
                    variant="ember"
                    size="lg"
                    className="w-full"
                    disabled={phase === "paying"}
                    onClick={() => {
                      setPhase("paying");
                      setTimeout(() => setPhase("done"), 1500);
                    }}
                  >
                    {phase === "paying" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Settling across {cascade.length} generations…
                      </>
                    ) : (
                      <>Pay {formatNear(price, 0)} Ⓝ as {accountId.length > 22 ? accountId.slice(0, 20) + "…" : accountId}</>
                    )}
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" className="w-full" onClick={connect} disabled={busy}>
                    <Wallet className="size-4" /> {busy ? "Connecting…" : "Connect a NEAR wallet to license"}
                  </Button>
                )}
                <p className="text-center text-[11px] leading-relaxed text-fg-3">
                  The registry contract is being deployed to NEAR testnet. Until then, payment settlement is simulated in your browser and no funds move.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <motion.div
                  initial={{ rotateX: 14, y: 16, opacity: 0 }}
                  animate={{ rotateX: 0, y: 0, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                  className="overflow-hidden rounded-3xl border border-white/15 bg-bg"
                >
                  <Artwork genome={work.genome} className="aspect-[16/9] w-full" size={720} live />
                  <div className="p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">Licence NFT · perpetual</p>
                    <p className="mt-1.5 text-xl font-medium tracking-[-0.03em] text-fg">{work.title}</p>
                    <p className="mt-1 text-xs text-fg-3">
                      {USES.find((u) => u.id === use)?.label} · holder <span className="font-mono">{accountId}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 border-t border-line text-center">
                    <Meta k="Paid" v={`${formatNear(price, 0)} Ⓝ`} />
                    <Meta k="Generations" v={String(cascade.length)} />
                    <Meta k="Payees" v={String(payees.length)} />
                  </div>
                </motion.div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button variant="secondary" size="lg" onClick={() => downloadArtwork(work.genome, `${work.id}-source-2048.png`)}>
                    <Download className="size-4" /> Source file
                  </Button>
                  <Button variant="primary" size="lg" onClick={() => onPaid(use)}>
                    Watch the payout
                  </Button>
                </div>
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
    <div className="border-r border-line px-3 py-3 last:border-r-0">
      <p className="text-[10px] uppercase tracking-wider text-fg-3">{k}</p>
      <p className="num mt-0.5 text-sm text-fg">{v}</p>
    </div>
  );
}
