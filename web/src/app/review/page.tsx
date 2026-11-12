import type { Metadata } from "next";
import { Label } from "@/components/ui";
import { ReviewQueue } from "./review-queue";

export const metadata: Metadata = { title: "Review · Canon" };

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      <Label>Review queue</Label>
      <h1 className="display mt-5 max-w-[14ch] text-[52px] text-fg sm:text-[76px]">Decide what becomes canon.</h1>
      <p className="mt-5 max-w-xl text-fg-2">
        Only the current owner of a parent work can approve a derivative. Approval locks the submission&apos;s file hash and
        contributor splits, and from then on it earns from licences and pays upstream.
      </p>
      <ReviewQueue />
    </div>
  );
}
