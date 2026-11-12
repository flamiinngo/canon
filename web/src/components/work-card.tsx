import Link from "next/link";
import { computeClearance, formatNear } from "@/lib/canon";
import { childrenOf, generationOf, getWork } from "@/lib/data";
import type { Work } from "@/lib/types";
import { Character } from "./character";
import { StatusPill } from "./ui";

export function WorkCard({ work }: { work: Work }) {
  const gen = generationOf(work.id);
  const parent = work.parentId ? getWork(work.parentId) : undefined;
  const clearance = computeClearance(work.id);
  const kids = childrenOf(work.id).filter((c) => c.status === "approved").length;

  return (
    <Link
      href={`/works/${work.id}`}
      className="group block overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-float"
    >
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]">
          <Character art={work.art} title={work.title} />
        </div>
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="num rounded-full bg-surface/90 px-2 py-0.5 text-[11px] text-ink-2 backdrop-blur">
            {gen === 0 ? "Original" : `Gen ${gen}`}
          </span>
          <StatusPill status={work.status} className="backdrop-blur" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{work.title}</p>
          <p className="truncate text-xs text-ink-3">
            {work.kind} · <span className="font-mono">{work.owner}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-xs">
          <span className={clearance.cleared ? "flex items-center gap-1.5 text-ok" : "flex items-center gap-1.5 text-ink-3"}>
            <span className={`size-1.5 rounded-full ${clearance.cleared ? "bg-ok" : "bg-line-strong"}`} />
            {clearance.cleared ? "Commercially cleared" : "Not licensable"}
          </span>
          <span className="num text-ink-2">{clearance.cleared ? `${formatNear(work.terms.priceNear, 0)} Ⓝ` : "—"}</span>
        </div>
        {(parent || kids > 0) && (
          <p className="truncate text-[11px] text-ink-3">
            {parent ? <>from <span className="text-ink-2">{parent.title}</span></> : <>{kids} approved derivative{kids === 1 ? "" : "s"}</>}
          </p>
        )}
      </div>
    </Link>
  );
}
