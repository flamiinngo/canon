import { ArrowRight } from "lucide-react";
import { ButtonLink, Label } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col items-start px-4 pt-24 sm:px-6 lg:px-8">
      <Label>404</Label>
      <h1 className="display mt-5 text-[56px] text-fg sm:text-[88px]">Not in the canon.</h1>
      <p className="mt-5 max-w-md text-fg-2">This work doesn&apos;t exist, or it was never approved into a lineage.</p>
      <ButtonLink href="/explore" className="mt-9" size="lg">
        Explore works <ArrowRight className="size-4" />
      </ButtonLink>
    </div>
  );
}
