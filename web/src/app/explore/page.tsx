import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { ExploreGrid } from "./explore-grid";

export const metadata: Metadata = { title: "Explore · Canon" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Eyebrow>The canon</Eyebrow>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-display text-5xl leading-[1] tracking-[-0.02em] sm:text-6xl">
          Explore works <span className="italic text-ink-3">&amp; their families</span>
        </h1>
        <p className="max-w-md text-ink-2">
          Every card shows a work's lineage and whether it's cleared for commercial use. Clearance accounts for every ancestor.
        </p>
      </div>
      <ExploreGrid />
    </div>
  );
}
