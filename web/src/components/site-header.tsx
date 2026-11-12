"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Logo, buttonClass } from "./ui";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/review", label: "Review" },
  { href: "/register", label: "Register" },
  { href: "/proof", label: "Proof" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open ? "bg-paper/80 shadow-[0_1px_0_var(--line)] backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Canon home" className="text-ink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-paper-2 ring-1 ring-line" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-ink-3 ring-1 ring-line sm:inline-flex">
            <span className="size-1.5 rounded-full bg-warn" /> Preview
          </span>
          <ThemeToggle />
          <button className={buttonClass("primary", "sm", "hidden sm:inline-flex")} type="button">
            Connect wallet
          </button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink ring-1 ring-line md:hidden"
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-4 pb-5 pt-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-2xl",
                    pathname.startsWith(n.href) ? "bg-paper-2 text-ink" : "text-ink-2",
                  )}
                >
                  {n.label}
                  <span className="font-mono text-[11px] text-ink-3">→</span>
                </Link>
              ))}
              <button className={buttonClass("primary", "lg", "mt-3 w-full")} type="button">
                Connect wallet
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("canon-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 ring-1 ring-line transition-colors hover:text-ink"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
