import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { ReviewQueue } from "./review-queue";

export const metadata: Metadata = { title: "Review · Canon" };

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Eyebrow>Review queue · signed in as ada.near</Eyebrow>
      <h1 className="mt-4 font-display text-5xl leading-[1] tracking-[-0.02em] sm:text-6xl">
        Decide what becomes <span className="italic text-accent">canon</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-2">
        Only the current owner of a parent work can approve a derivative. Approval is recorded on-chain and locks the
        submission's splits and file hash.
      </p>
      <ReviewQueue />
    </div>
  );
}
