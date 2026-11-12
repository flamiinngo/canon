"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, Check, KeyRound, ShieldX, X } from "lucide-react";
import { Artwork } from "./artwork";
import { Label, Mono } from "./ui";
import { computeCascade, computeClearance, formatNear } from "@/lib/canon";
import { DEMO_WORKS, demoWork as getWork, vaultAccount } from "@/lib/data";
import { cn } from "@/lib/cn";

// ─────────────────────────────────────────────────────────────────────
// How it works: sticky product visual that changes as the steps scroll by
// ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    k: "01",
    title: "Register the original",
    body: "Mint the work as a NEP-171 NFT. Canon creates its own keyless vault account and records the file hash, the artist's declaration and the terms: derivatives, commercial use, and the share that flows upstream.",
  },
  {
    k: "02",
    title: "Approve derivatives into canon",
    body: "Creators submit relief versions, colourways and motion loops. Only the parent's current owner can approve one. Approval locks the derivative's file hash and contributor splits.",
  },
  {
    k: "03",
    title: "Clear the whole lineage",
    body: "Before anything is licensed, Canon walks every ancestor. One non-commercial parent, one revoked approval, and the licence can't be issued. Studios get one verdict, with reasons.",
  },
  {
    k: "04",
    title: "One payment pays everyone",
    body: "The studio pays once. The payment splits up the family tree into every vault and contributor in a single transaction, and the studio receives a licence NFT that unlocks the source files.",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <div className="panel noise relative aspect-[5/4] overflow-hidden">
            <div className="hairline-grid absolute inset-0 opacity-50 fade-mask-y" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center p-10"
              >
                <StepVisual i={active} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-5 left-6 flex gap-1.5">
              {STEPS.map((s, i) => (
                <span key={s.k} className={cn("h-1 rounded-full transition-all duration-500", i === active ? "w-8 bg-fg" : "w-3 bg-white/15")} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        {STEPS.map((s, i) => (
          <div
            key={s.k}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            className="flex min-h-0 flex-col justify-center border-t border-line py-10 lg:min-h-[62vh] lg:py-0"
          >
            <p className={cn("font-mono text-sm transition-colors duration-500", active === i ? "text-ember" : "text-ember lg:text-fg-3")}>{s.k}</p>
            <h3 className={cn("mt-3 text-[28px] font-medium tracking-[-0.035em] transition-colors duration-500 sm:text-[34px]", active === i ? "text-fg" : "text-fg lg:text-fg-3")}>{s.title}</h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-fg-2">{s.body}</p>
            <div className="panel mt-8 flex items-center justify-center overflow-hidden p-6 lg:hidden">
              <StepVisual i={i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepVisual({ i }: { i: number }) {
  if (i === 0) return <RegisterVisual />;
  if (i === 1) return <ApproveVisual />;
  if (i === 2) return <ClearVisual />;
  return <PayVisual />;
}

function MiniPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-full max-w-[380px] rounded-2xl border border-line-2 bg-surface-2/90 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur", className)}>{children}</div>;
}

function RegisterVisual() {
  const w = getWork("ember")!;
  return (
    <MiniPanel>
      <div className="flex items-center gap-4 border-b border-line p-4">
        <Artwork genome={w.genome} className="size-16 shrink-0 rounded-xl" size={256} />
        <div className="min-w-0">
          <p className="font-medium text-fg">{w.title}</p>
          <p className="font-mono text-[11px] text-fg-3">{vaultAccount(w.id)}</p>
        </div>
      </div>
      <dl className="space-y-2.5 p-4 text-[13px]">
        {[
          ["Derivatives", <span key="d" className="text-ok">Allowed</span>],
          ["Commercial use", <span key="c" className="text-ok">Allowed</span>],
          ["Upstream share", <span key="u" className="num text-fg">20%</span>],
          ["Access keys", <span key="k" className="num text-ok">0</span>],
          ["File hash", <Mono key="h">9f2c4e1a…e41a</Mono>],
        ].map(([k, v]) => (
          <div key={String(k)} className="flex items-center justify-between">
            <dt className="text-fg-3">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </MiniPanel>
  );
}

function ApproveVisual() {
  const p = getWork("ember")!;
  const c = getWork("ember-relief")!;
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(id);
  }, []);
  return (
    <MiniPanel className="p-5">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <Artwork genome={p.genome} className="size-24 rounded-2xl" size={256} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-fg-3">Parent</p>
        </div>
        <ArrowRight className="size-4 text-fg-3" />
        <div className="text-center">
          <Artwork genome={c.genome} className="size-24 rounded-2xl" size={256} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-fg-3">Submission</p>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-fg">{c.title}</p>
      <p className="text-center font-mono text-[11px] text-fg-3">by ben.near · splits 70 / 30</p>
      <div className={cn("mt-5 flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-500", done ? "bg-ok/15 text-ok ring-1 ring-ok/30" : "bg-fg text-bg")}>
        {done ? (
          <>
            <Check className="size-4" /> Approved · signed by ada.near
          </>
        ) : (
          "Approve into canon"
        )}
      </div>
    </MiniPanel>
  );
}

function ClearVisual() {
  const c = computeClearance("ember-motion", DEMO_WORKS);
  const bad = computeClearance("moth-fragments", DEMO_WORKS);
  return (
    <div className="w-full max-w-[400px] space-y-3">
      <MiniPanel>
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-ok/20 bg-ok/10 px-4 py-3 text-[13px] font-medium text-ok">
          <Check className="size-4" /> {c.summary}
        </div>
        <ul className="divide-y divide-line">
          {c.checks.map((k, i) => (
            <li key={k.work.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-9 font-mono text-[10px] text-fg-3">{i === 0 ? "this" : `−${i}`}</span>
              <Artwork genome={k.work.genome} className="size-7 rounded-full" size={128} />
              <span className="flex-1 truncate text-[13px] text-fg">{k.label}</span>
              <Check className="size-3.5 text-ok" />
            </li>
          ))}
        </ul>
      </MiniPanel>
      <MiniPanel>
        <div className="flex items-start gap-2 px-4 py-3 text-[12.5px] text-bad">
          <X className="mt-0.5 size-4 shrink-0" />
          <span className="line-clamp-2">{bad.summary}</span>
        </div>
      </MiniPanel>
    </div>
  );
}

function PayVisual() {
  const cascade = computeCascade("ember-motion", 150, DEMO_WORKS);
  const payees = cascade.flatMap((s) => s.payees.map((p) => ({ ...p, gen: s.generation, id: s.work.id })));
  return (
    <MiniPanel>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-[13px] text-fg">Licence · Ember Field — Motion</span>
        <span className="num text-[13px] text-ember">150.00 Ⓝ</span>
      </div>
      <ul className="space-y-0.5 p-2">
        {payees.map((p, i) => (
          <motion.li
            key={p.account + p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 * i + 0.2 }}
            className="flex items-center justify-between rounded-lg px-2.5 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: ["#52d6ff", "#a98bff", "#ff6a3d"][2 - p.gen] }} />
              <span className="truncate font-mono text-[11.5px] text-fg-2">{p.toVault ? vaultAccount(p.id) : p.account}</span>
            </span>
            <span className="num text-[12.5px] text-fg">{formatNear(p.amountNear)}</span>
          </motion.li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-b-2xl border-t border-line bg-white/[0.02] px-4 py-3 text-[12px]">
        <span className="text-ok">✓ Sum equals price</span>
        <span className="font-mono text-fg-3">licence NFT #0042</span>
      </div>
    </MiniPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Bento: the NFT is the account
// ─────────────────────────────────────────────────────────────────────
export function AccountBento() {
  const cascade = computeCascade("ember-motion", 150, DEMO_WORKS);
  return (
    <div className="mt-14 grid gap-4 md:grid-cols-6 lg:mt-20">
      <BentoCell className="md:col-span-4" label="Vault" title="Every work has a wallet. Nobody holds its keys.">
        <div className="mt-8 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-line bg-bg-2 p-5">
            <div className="flex items-center gap-3">
              <Artwork genome={getWork("ember-relief")!.genome} className="size-10 rounded-lg" size={128} />
              <div className="min-w-0">
                <p className="truncate font-mono text-[12px] text-fg">{vaultAccount("ember-relief")}</p>
                <p className="text-[11px] text-fg-3">sub-account of canon.near</p>
              </div>
            </div>
            <p className="num mt-6 text-[44px] leading-none text-fg">
              <CountUp to={21} /> <span className="text-[22px] text-fg-3">Ⓝ</span>
            </p>
            <p className="mt-1 text-xs text-fg-3">vault balance · follows the NFT</p>
          </div>
          <dl className="space-y-3 text-[13px]">
            {[
              ["Access keys", <span key="a" className="num text-ok">0</span>],
              ["Upgrade method", <span key="b" className="text-ok">None</span>],
              ["Obeys", <Mono key="c">canon.near only</Mono>],
              ["Withdraw", <span key="d" className="text-fg">Current NFT owner</span>],
              ["During a sale", <span key="e" className="text-fg">Locked</span>],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                <dt className="text-fg-3">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </BentoCell>

      <BentoCell className="md:col-span-2" label="Licence NFT" title="The licence is a key.">
        <TiltCard />
      </BentoCell>

      <BentoCell className="md:col-span-3" label="Transfer" title="Sell the work, and its future income goes with it.">
        <ol className="mt-7 space-y-2.5 font-mono text-[12px]">
          <TransferRow ok text="nft_transfer  ben.near → eve.near" />
          <TransferRow ok={false} text="ben.near  withdraw(ember-relief)" code="ERR_NOT_OWNER" />
          <TransferRow ok text="eve.near  withdraw(ember-relief)  21.00 Ⓝ" />
          <TransferRow ok text="cy.near  claim()  9.00 Ⓝ  · credit stays with the person" />
        </ol>
      </BentoCell>

      <BentoCell className="md:col-span-3" label="Splits" title="Asset income follows the NFT. Authorship income follows people.">
        <div className="mt-7 space-y-4">
          {cascade.map((s) => (
            <div key={s.work.id}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-fg-2">{s.work.title}</span>
                <span className="num text-fg">{formatNear(s.keptNear)} Ⓝ</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
                {s.payees.map((p, j) => (
                  <motion.div
                    key={p.account}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(p.amountNear / 150) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.1 * j, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("h-full", p.toVault ? "bg-fg" : "bg-violet")}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-4 pt-1 text-[11px] text-fg-3">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg" /> vault (moves with NFT)</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet" /> personal credit</span>
          </div>
        </div>
      </BentoCell>
    </div>
  );
}

function BentoCell({ label, title, children, className }: { label: string; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("panel noise relative overflow-hidden p-6 sm:p-7", className)}>
      <Label>{label}</Label>
      <p className="mt-3 max-w-md text-[22px] font-medium leading-tight tracking-[-0.03em] text-fg">{title}</p>
      {children}
    </div>
  );
}

function TransferRow({ ok, text, code }: { ok: boolean; text: string; code?: string }) {
  return (
    <li className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5", ok ? "border-line bg-bg-2 text-fg-2" : "border-bad/25 bg-bad/[0.07] text-fg-2")}>
      {ok ? <Check className="size-3.5 shrink-0 text-ok" /> : <ShieldX className="size-3.5 shrink-0 text-bad" />}
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {code && <span className="shrink-0 rounded-md bg-bad/15 px-1.5 py-0.5 text-[10.5px] text-bad">{code}</span>}
    </li>
  );
}

function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 20 });
  const sheen = useTransform(mx, [0, 1], ["0%", "100%"]);
  const w = getWork("ember-motion")!;
  return (
    <div className="mt-6 flex justify-center [perspective:900px]">
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[240px] overflow-hidden rounded-2xl border border-white/15 bg-bg shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
      >
        <Artwork genome={w.genome} className="aspect-[4/3] w-full" size={384} />
        <div className="space-y-1 p-3.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-fg-3">Licence #0042 · perpetual</p>
          <p className="text-sm font-medium text-fg">{w.title}</p>
          <p className="font-mono text-[10.5px] text-fg-3">holder · studio.near</p>
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: useTransform(sheen, (s) => `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) ${s}, transparent 80%)`) }}
        />
      </motion.div>
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1200);
        el.textContent = formatNear(to * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>0.00</span>;
}

// ─────────────────────────────────────────────────────────────────────
// Refusals
// ─────────────────────────────────────────────────────────────────────
const REFUSALS: [string, string][] = [
  ["seller withdraws after the sale", "ERR_NOT_OWNER"],
  ["transfer while a withdrawal is in flight", "ERR_TOKEN_LOCKED"],
  ["drain the vault while the NFT is listed", "ERR_TOKEN_LISTED"],
  ["approve a derivative of someone else's work", "ERR_NOT_PARENT_OWNER"],
  ["license work with a non-commercial ancestor", "ERR_NOT_CLEARED"],
  ["register splits that don't total 100%", "ERR_BAD_SPLITS"],
  ["call a vault directly", "ERR_ONLY_REGISTRY"],
];

export function RefusalTerminal() {
  return (
    <div className="panel noise overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="ml-3 truncate font-mono text-[11px] text-fg-3">cargo test -p canon-registry · 41 passed</span>
      </div>
      <ul className="divide-y divide-line font-mono text-[12.5px]">
        {REFUSALS.map(([a, code], i) => (
          <motion.li
            key={code}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i }}
            className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <KeyRound className="size-3.5 shrink-0 text-fg-3" />
              <span className="truncate text-fg-2">
                <span className="text-fg-3">attempt:</span> {a}
              </span>
            </span>
            <span className="shrink-0 rounded-md bg-bad/10 px-2 py-0.5 text-[11px] text-bad ring-1 ring-bad/20">{code}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Gallery marquee
// ─────────────────────────────────────────────────────────────────────
export function GalleryMarquee() {
  const works = DEMO_WORKS.filter((w) => w.status === "approved");
  const row = [...works, ...works];
  return (
    <div className="relative overflow-hidden fade-mask-x py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="animate-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
        {row.map((w, i) => (
          <Link key={`${w.id}-${i}`} href={`/works/${w.id}`} className="group w-[220px] shrink-0 sm:w-[260px]">
            <div className="overflow-hidden rounded-2xl border border-line">
              <Artwork genome={w.genome} className="aspect-square w-full transition-transform duration-700 group-hover:scale-105" size={512} />
            </div>
            <p className="mt-3 truncate text-sm text-fg">{w.title}</p>
            <p className="truncate font-mono text-[11px] text-fg-3">{w.owner}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
