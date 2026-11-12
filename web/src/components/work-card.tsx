import Link from "next/link";
import { computeClearance, formatNear } from "@/lib/canon";
import { childrenOf, generationOf, getWork } from "@/lib/data";
import type { Work } from "@/lib/types";
import { Artwork } from "./artwork";
import { StatusPill } from "./ui";
import { cn } from "@/lib/cn";

export function WorkCard({ work }: { work: Work }) {
  const gen = generationOf(work.id);
  const parent = work.parentId ? getWork(work.parentId) : undefined;
  const cleared = computeClearance(work.id).cleared;
  const kids = childrenOf(work.id).filter((c) => c.status === "approved").length;

  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,transform] duration-500 group-hover:-translate-y-1 group-hover:border-line-3">
        <Artwork genome={work.genome} alt={work.title} className="aspect-[4/5] w-full transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045]" size={560} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full bg-bg/60 px-2 py-0.5 font-mono text-[10.5px] text-fg-2 ring-1 ring-white/10 backdrop-blur">NFT · {gen === 0 ? "Original" : `Gen ${gen}`}</span>
          <StatusPill status={work.status} className="bg-bg/60" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/70 to-transparent p-4 pt-14">
          <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-fg">{work.title}</p>
          <p className="truncate font-mono text-[11px] text-fg-3">
            #{work.id} · {work.owner}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pt-3 text-[12px]">
        <span className={cn("flex min-w-0 items-center gap-1.5 truncate", cleared ? "text-ok" : "text-fg-3")}>
          <span className={`size-1.5 rounded-full ${cleared ? "bg-ok shadow-[0_0_8px_var(--ok)]" : "bg-white/20"}`} />
          {cleared ? <><span className="sm:hidden">Cleared</span><span className="hidden sm:inline">Commercially cleared</span></> : "Not licensable"}
        </span>
        <span className="num shrink-0 whitespace-nowrap text-fg-2">{cleared ? `${formatNear(work.terms.priceNear, 0)} Ⓝ` : parent ? `from ${parent.title.split("—")[0].trim()}` : `${kids} derivative${kids === 1 ? "" : "s"}`}</span>
      </div>
    </Link>
  );
}
