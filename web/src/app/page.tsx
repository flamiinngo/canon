import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HeroScene } from "@/components/hero-scene";
import { AccountBento, GalleryMarquee, HowItWorks, RefusalTerminal } from "@/components/home-sections";
import { ButtonLink, SectionHead } from "@/components/ui";

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[720px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,106,61,0.16),transparent_70%),radial-gradient(40%_40%_at_80%_20%,rgba(169,139,255,0.12),transparent_70%)]" />
        <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />

        <div className="relative mx-auto max-w-[1280px] px-4 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Link
            href="https://nearhackathon.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-white/[0.03] py-1 pl-1 pr-3 text-[12.5px] text-fg-2 backdrop-blur transition-colors hover:border-line-3 hover:text-fg"
          >
            <span className="rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[10.5px] text-ember">NEAR</span>
            NFTs that do something
            <ArrowUpRight className="size-3.5 text-fg-3" />
          </Link>
          <h1 className="display mx-auto mt-7 max-w-[15ch] text-[48px] text-fg sm:text-[80px] lg:text-[104px]">
            Creative IP that pays its <span className="text-spectrum">whole family tree.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[58ch] text-[17px] leading-relaxed text-fg-2 sm:text-lg">
            Canon makes every work a NEAR account. Approve derivatives, clear the full lineage, and split every licence across
            every generation and contributor, in one transaction.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/explore" size="lg">
              Explore the canon <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/register" variant="secondary" size="lg">
              Register a work
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto mt-8 max-w-[1280px] px-2 sm:mt-4 sm:px-6 lg:px-8">
          <HeroScene />
        </div>
      </section>

      {/* ── Stat strip ───────────────────────────────────── */}
      <section className="border-y border-line bg-bg-2/60">
        <dl className="mx-auto grid max-w-[1280px] grid-cols-2 divide-line px-4 sm:px-6 md:grid-cols-4 md:divide-x lg:px-8">
          {[
            ["0", "access keys on any vault"],
            ["1 tx", "per licence, end to end"],
            ["3", "generations paid in the demo"],
            ["100%", "of every payment accounted for"],
          ].map(([v, l]) => (
            <div key={l} className="px-2 py-8 md:px-8">
              <dd className="num text-[34px] leading-none text-fg sm:text-[40px]">{v}</dd>
              <dt className="mt-2 text-[13px] text-fg-3">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-28 sm:px-6 lg:px-8 lg:pt-40">
        <SectionHead
          label="How it works"
          title={<>From one original to a licensable universe.</>}
          body="Four steps, all on-chain, each one enforced by the contract rather than by trust."
        />
        <HowItWorks />
      </section>

      {/* ── The account is the asset ─────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-28 sm:px-6 lg:px-8 lg:pt-40">
        <SectionHead label="NFTs that do something" title={<>The NFT is the account.</>} body="Each work owns money, earns from its descendants and carries rights. Control moves with the token, and only with the token." />
        <AccountBento />
      </section>

      {/* ── Refusals ─────────────────────────────────────── */}
      <section className="mx-auto grid max-w-[1280px] gap-12 px-4 pt-28 sm:px-6 lg:grid-cols-[1fr_1.25fr] lg:gap-20 lg:px-8 lg:pt-40">
        <div>
          <SectionHead label="Don't trust. Verify." title={<>No master key. Not even ours.</>} body="Every way a seller could try to keep the money is a test in the suite and a refusal you can look up on-chain." />
          <ButtonLink href="/proof" variant="secondary" className="mt-9">
            Read the threat model <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <RefusalTerminal />
      </section>

      {/* ── Gallery ──────────────────────────────────────── */}
      <section className="pt-28 lg:pt-40">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <SectionHead label="The canon" title={<>Works with a lineage.</>} />
          <ButtonLink href="/explore" variant="ghost">
            View all works <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="mt-12">
          <GalleryMarquee />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-28 sm:px-6 lg:px-8 lg:pt-40">
        <div className="panel noise relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-24">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(255,106,61,0.2),transparent_70%)]" />
          <h2 className="display relative mx-auto max-w-[14ch] text-[44px] text-fg sm:text-[72px]">Start a canon. Let it grow.</h2>
          <p className="relative mx-auto mt-5 max-w-md text-fg-2">Register an original, set your terms, and approve the work others build on it.</p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="ember" size="lg">
              Register a work <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/review" variant="secondary" size="lg">
              Open the review queue
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
