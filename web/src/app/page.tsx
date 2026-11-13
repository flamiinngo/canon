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

        <div className="relative mx-auto max-w-[1280px] px-4 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Link
            href="/proof"
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-white/[0.03] py-1 pl-1 pr-3 text-[12.5px] text-fg-2 backdrop-blur transition-colors hover:border-line-3 hover:text-fg"
          >
            <span className="rounded-full bg-ok/15 px-2 py-0.5 font-mono text-[10.5px] text-ok">LIVE</span>
            Live on NEAR<span className="hidden sm:inline"> · 0 admin keys · every claim verifiable</span>
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
      <section>
        <dl className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-2 px-4 pt-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            ["0", "access keys on any vault"],
            ["1 tx", "per licence, end to end"],
            ["3", "generations paid per licence"],
            ["100%", "of every payment accounted for"],
          ].map(([v, l]) => (
            <div key={l} className="py-6 md:pr-8">
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
        <SectionHead label="Programmable NFTs" title={<>The NFT is the account.</>} body="Each work owns money, earns from its descendants and carries rights. Control moves with the token, and only with the token." />
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

      {/* ── Who it's for ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-28 sm:px-6 lg:px-8 lg:pt-40">
        <SectionHead label="Who it's for" title={<>One market, three sides.</>} body="Canon is for everyone in the chain of a creative work, from the first sketch to the studio that ships it." />
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {[
            ["IP owners & communities", "Run an official derivative program. Approve the best community work into canon and earn on everything built from yours.", "/register"],
            ["Creators & contributors", "Build on IP people already love, with permission on record and an automatic share of every licence, even after a sale.", "/register"],
            ["Studios & brands", "One clearance verdict across every ancestor, one payment that pays everyone, and a licence NFT legal can verify.", "/explore"],
          ].map(([t, b, href]) => (
            <Link key={t} href={href} className="group block">
              <span className="block h-px w-10 bg-gradient-to-r from-ember to-violet" />
              <p className="mt-6 text-[22px] font-medium tracking-[-0.03em] text-fg">{t}</p>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-fg-2">{b}</p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-fg-3 transition-colors group-hover:text-fg">
                Get started <ArrowRight className="size-3.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Open & roadmap ───────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-14 md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2 md:pr-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">Roadmap</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              {[
                ["Now", "Testnet live · NEP-171 & NEP-199 · 41 tests · open source", true],
                ["Q1 2027", "Security review · mainnet · pilot programs with NEAR artists", false],
                ["2027", "Clearance API · multi-parent works · fiat checkout", false],
              ].map(([w, d, done]) => (
                <div key={String(w)}>
                  <p className={`flex items-center gap-2 text-sm font-medium ${done ? "text-ok" : "text-fg"}`}>
                    <span className={`size-1.5 rounded-full ${done ? "bg-ok shadow-[0_0_8px_var(--ok)]" : "bg-white/30"}`} />
                    {w}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-fg-2">{d}</p>
                </div>
              ))}
            </div>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg">
              Mission, business model and roadmap <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <a href="https://github.com/flamiinngo/canon" target="_blank" rel="noreferrer" className="group block">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">Open source · MIT</p>
            <p className="mt-5 text-[21px] font-medium tracking-[-0.03em] text-fg">Every line is public.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-2">Contracts, app, tests and the deploy script that produced every transaction on the Proof page.</p>
            <p className="mt-6 inline-flex items-center gap-1.5 font-mono text-[13px] text-fg-3 group-hover:text-fg">
              github.com/flamiinngo/canon <ArrowUpRight className="size-3.5" />
            </p>
          </a>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-28 sm:px-6 lg:px-8 lg:pt-40">
        <div className="relative overflow-hidden px-2 py-20 text-center sm:py-28">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(45%_70%_at_50%_100%,rgba(255,106,61,0.16),transparent_70%)]" />
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
