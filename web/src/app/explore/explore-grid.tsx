"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { WORKS } from "@/lib/data";
import { computeClearance } from "@/lib/canon";
import { WorkCard } from "@/components/work-card";
import { cn } from "@/lib/cn";
import { useCanonData } from "@/components/canon-data";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "cleared", label: "Cleared" },
  { id: "originals", label: "Originals" },
  { id: "derivatives", label: "Derivatives" },
  { id: "pending", label: "Pending" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

export function ExploreGrid() {
  const { status } = useCanonData();
  const [filter, setFilter] = useState<FilterId>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(
    () => ({
      all: WORKS.length,
      cleared: WORKS.filter((w) => computeClearance(w.id).cleared).length,
      originals: WORKS.filter((w) => !w.parentId).length,
      derivatives: WORKS.filter((w) => w.parentId).length,
      pending: WORKS.filter((w) => w.status === "pending").length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, WORKS],
  );

  const works = useMemo(
    () =>
      WORKS.filter((w) => {
        if (filter === "cleared" && !computeClearance(w.id).cleared) return false;
        if (filter === "originals" && w.parentId) return false;
        if (filter === "derivatives" && !w.parentId) return false;
        if (filter === "pending" && w.status !== "pending") return false;
        const s = q.trim().toLowerCase();
        return !s || [w.title, w.kind, w.owner].some((v) => v.toLowerCase().includes(s));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, q, status, WORKS],
  );

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-12 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-2xl sm:mx-0 sm:rounded-2xl sm:border sm:px-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn("relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors", filter === f.id ? "text-bg" : "text-fg-3 hover:text-fg")}
              >
                {filter === f.id && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", bounce: 0.18, duration: 0.45 }} />}
                <span className="relative">{f.label}</span>
                <span className={cn("relative font-mono text-[11px]", filter === f.id ? "text-bg/60" : "text-fg-3")}>{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-full bg-white/[0.03] px-4 ring-1 ring-line-2 transition-shadow focus-within:ring-line-3 md:w-80">
            <Search className="size-4 text-fg-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search works, kinds, owners" className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-3" />
          </label>
        </div>
      </div>

      <motion.div layout className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {works.map((w, i) => (
          <motion.div key={w.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}>
            <WorkCard work={w} />
          </motion.div>
        ))}
      </motion.div>
      {status === "loading" && (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      )}
      {status === "error" && (
        <div className="panel mt-10 p-10 text-center text-sm text-bad">Couldn&apos;t reach the NEAR registry. Refresh to try again.</div>
      )}
      {status !== "loading" && status !== "error" && works.length === 0 && (
        <div className="panel mt-10 p-14 text-center">
          <p className="text-xl font-medium tracking-[-0.03em] text-fg">{WORKS.length === 0 ? "The canon is empty" : "No works match"}</p>
          <p className="mt-2 text-sm text-fg-3">{WORKS.length === 0 ? "Register the first original to start a lineage." : "Clear the search or pick another filter."}</p>
        </div>
      )}
    </>
  );
}
