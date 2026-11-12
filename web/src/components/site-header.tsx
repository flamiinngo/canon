"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Copy, LogOut, Menu, Wallet, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Logo, buttonClass } from "./ui";
import { NETWORK, useWallet } from "./wallet";
import { EXPLORER, LIVE, view, yoctoToNear } from "@/lib/near";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/register", label: "Register" },
  { href: "/review", label: "Review" },
  { href: "/proof", label: "Proof" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "transition-[background-color,box-shadow] duration-300",
          scrolled || open ? "bg-bg/75 shadow-[0_1px_0_var(--line)] backdrop-blur-2xl backdrop-saturate-150" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Canon home">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} className={cn("relative rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors", active ? "text-fg" : "text-fg-3 hover:text-fg")}>
                    {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/[0.06] ring-1 ring-line-2" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                    <span className="relative">{n.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <span
              title={LIVE ? "Reading and writing the Canon registry on NEAR" : "No registry configured: demo data, simulated payments"}
              className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-fg-3 ring-1 ring-line sm:inline-flex"
            >
              <span className={cn("size-1.5 rounded-full", LIVE ? "bg-lime shadow-[0_0_8px_var(--lime)]" : "bg-warn")} /> {LIVE ? `Live · ${NETWORK}` : "Preview"}
            </span>
            <WalletButton className="hidden sm:inline-flex" />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full text-fg ring-1 ring-line-2 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden md:hidden"
              aria-label="Mobile"
            >
              <div className="flex flex-col px-4 pb-6 pt-2">
                {NAV.map((n, i) => (
                  <motion.div key={n.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                    <Link href={n.href} className="flex items-center justify-between border-b border-line py-4 text-[26px] font-medium tracking-[-0.03em] text-fg">
                      {n.label}
                      <ArrowUpRight className="size-5 text-fg-3" />
                    </Link>
                  </motion.div>
                ))}
                <WalletButton className="mt-6 h-12 w-full" />
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function WalletButton({ className }: { className?: string }) {
  const { accountId, busy, ready, error, connect, disconnect, call } = useWallet();
  const [menu, setMenu] = useState(false);
  const [claimable, setClaimable] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  useEffect(() => {
    if (!menu || !LIVE || !accountId) return;
    view<string>("get_claimable", { account_id: accountId })
      .then((y) => setClaimable(yoctoToNear(y)))
      .catch(() => setClaimable(null));
  }, [menu, accountId]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!accountId)
    return (
      <button type="button" onClick={connect} disabled={!ready || busy} className={buttonClass("primary", "sm", className)} title={error ?? undefined}>
        <Wallet className="size-3.5" />
        {busy ? "Connecting…" : "Connect wallet"}
      </button>
    );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => setMenu((m) => !m)} className={buttonClass("secondary", "sm", "w-full")}>
        <span className="size-2 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />
        <span className="max-w-[160px] truncate font-mono text-[12px]">{accountId}</span>
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="panel absolute right-0 top-11 z-50 w-60 bg-surface p-1.5"
          >
            <p className="px-3 pb-2 pt-2 font-mono text-[11px] text-fg-3">Signed in on NEAR {NETWORK}</p>
            {LIVE && (
              <div className="mx-1.5 mb-1.5 rounded-xl border border-line bg-bg-2 p-3">
                <p className="text-[11px] text-fg-3">Contributor earnings to claim</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="num text-lg text-fg">{claimable === null ? "…" : `${claimable.toFixed(2)} Ⓝ`}</span>
                  <button
                    type="button"
                    disabled={!claimable || claiming}
                    onClick={async () => {
                      setClaiming(true);
                      try {
                        const r = await call("claim", {}, "0", 30);
                        setClaimable(0);
                        if (r.hash) window.open(`${EXPLORER}/txns/${r.hash}`, "_blank", "noreferrer");
                      } catch {
                        /* wallet shows the error */
                      } finally {
                        setClaiming(false);
                      }
                    }}
                    className="rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg disabled:opacity-30"
                  >
                    {claiming ? "Claiming…" : "Claim"}
                  </button>
                </div>
              </div>
            )}
            <button type="button" onClick={() => navigator.clipboard?.writeText(accountId)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg-2 hover:bg-white/[0.05] hover:text-fg">
              <Copy className="size-3.5" /> Copy account ID
            </button>
            <a
              href={`https://${NETWORK === "testnet" ? "testnet." : ""}nearblocks.io/address/${accountId}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg-2 hover:bg-white/[0.05] hover:text-fg"
            >
              <ArrowUpRight className="size-3.5" /> View on NearBlocks
            </a>
            <button type="button" onClick={disconnect} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-bad hover:bg-bad/10">
              <LogOut className="size-3.5" /> Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
