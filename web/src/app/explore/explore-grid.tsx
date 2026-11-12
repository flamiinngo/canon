"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { WORKS } from "@/lib/data";
import { computeClearance } from "@/lib/canon";
import { WorkCard } from "@/components/work-card";
import { cn } from "@/lib/cn";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "cleared", label: "Commercially cleared" },
  { id: "originals", label: "Originals" },
  { id: "derivatives", label: "Derivatives" },
  { id: "pending", label: "Pending" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

export function ExploreGrid() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [q, setQ] = useState("");

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
    [filter, q],
  );

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-10 bg-paper/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:px-3 sm:ring-1 sm:ring-line">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  filter === f.id ? "text-paper" : "text-ink-2 hover:text-ink",
                )}
              >
                {filter === f.id && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-line focus-within:ring-ink-3 md:w-72">
            <Search className="size-4 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search works, kinds, owners"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
          </label>
        </div>
      </div>

      <motion.div layout className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {works.map((w) => (
          <motion.div key={w.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <WorkCard work={w} />
          </motion.div>
        ))}
      </motion.div>
      {works.length === 0 && (
        <div className="mt-16 rounded-2xl border border-dashed border-line-strong p-12 text-center">
          <p className="font-display text-2xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-ink-3">Try another filter, or register the first work of a new canon.</p>
        </div>
      )}
    </>
  );
}
