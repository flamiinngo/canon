import type { Metadata } from "next";
import { Label } from "@/components/ui";
import { Suspense } from "react";
import { CollectionView } from "./collection-view";

export const metadata: Metadata = { title: "Collection · Canon" };

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      <Label>Collection · NEP-171 tokens</Label>
      <h1 className="display mt-5 max-w-[16ch] text-[52px] text-fg sm:text-[76px]">The NFTs, and what they do.</h1>
      <p className="mt-5 max-w-2xl text-fg-2">
        Every work is an NFT that owns a vault. Every licence is an NFT that unlocks files. This page reads them straight from the
        registry with <span className="font-mono text-[14px] text-fg">nft_tokens_for_owner</span>, for your wallet or any account.
      </p>
      <Suspense fallback={<div className="panel mt-12 h-24 animate-pulse" />}>
        <CollectionView />
      </Suspense>
    </div>
  );
}
