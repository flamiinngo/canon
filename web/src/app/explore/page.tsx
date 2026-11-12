import type { Metadata } from "next";
import { Label } from "@/components/ui";
import { ExploreGrid } from "./explore-grid";

export const metadata: Metadata = { title: "Explore · Canon" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      <Label>The canon</Label>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="display max-w-[12ch] text-[52px] text-fg sm:text-[80px]">Every work, and its family.</h1>
        <p className="max-w-sm text-fg-2">Clearance is computed across every ancestor, so a green dot means the whole lineage allows commercial use.</p>
      </div>
      <ExploreGrid />
    </div>
  );
}
