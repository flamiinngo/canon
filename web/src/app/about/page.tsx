import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, BadgeCheck, Building2, Check, Code2, KeyRound, Palette, Scale, Sparkles, Users } from "lucide-react";
import { ButtonLink, Label, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "About · Canon",
  description: "Canon is building the rights layer for creative IP: approvals, clearance, licensing and payouts for every work and everything built on it.",
};

const GITHUB = "https://github.com/flamiinngo/canon";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      {/* Mission */}
      <Label>About Canon</Label>
      <h1 className="display mt-5 max-w-[17ch] text-[48px] text-fg sm:text-[80px]">
        Building the rights layer for <span className="text-spectrum">creative IP.</span>
      </h1>
      <p className="mt-7 max-w-2xl text-[18px] leading-relaxed text-fg-2">
        Great characters and artworks don&apos;t stay with one creator. Fans remix them, sculptors rebuild them, animators bring
        them to life, and studios want to license the result. Canon makes that chain of work <span className="text-fg">explicit,
        approved and paid</span>: every work is an NFT that owns its own wallet, every derivative is approved by the work it
        builds on, and every licence pays the whole family tree, automatically.
      </p>

      {/* Problem */}
      <section className="mt-28">
        <SectionHead label="The problem" title="Derivative work is everywhere. Permission and payment aren't." />
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          {[
            ["Built without asking", "Fan art, 3D models and remixes are made every day with no record of permission. Originals can't say yes, so the best work stays unofficial."],
            ["Impossible to clear", "A studio that finds a great derivative can't tell who contributed, which ancestors allow commercial use, or who to pay. So it walks away."],
            ["Contributors forgotten", "When money finally moves, it goes to whoever holds the file. The sculptor, the colourist and the original artist rarely see a share."],
          ].map(([t, b], i) => (
            <div key={t}>
              <p className="font-mono text-sm text-ember">0{i + 1}</p>
              <p className="mt-4 text-[21px] font-medium tracking-[-0.03em] text-fg">{t}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mt-28">
        <SectionHead label="Who it's for" title="Three sides of one market." />
        <div className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-10">
          <Audience
            icon={<Users className="size-5" />}
            who="IP owners & communities"
            what="Run an official derivative program for a character, collection or brand world."
            points={["Approve the best community work into canon", "Earn a set share of every licence downstream", "Keep control: nothing joins without your signature"]}
          />
          <Audience
            icon={<Palette className="size-5" />}
            who="Creators & contributors"
            what="Build on IP people already love, with permission on record."
            points={["Your file hash and splits are locked at approval", "Get paid automatically on every licence", "Your credit stays yours, even when the NFT sells"]}
          />
          <Audience
            icon={<Building2 className="size-5" />}
            who="Studios & brands"
            what="License derivative work with one verdict and one payment."
            points={["Clearance across every ancestor, with reasons", "One transaction pays everyone upstream", "A licence NFT your legal team can verify"]}
          />
        </div>
      </section>

      {/* Business model */}
      <section className="mt-28">
        <SectionHead
          label="Business model"
          title="Creators get paid first. Canon earns on top, transparently."
          body="Today the protocol takes no fee: every yoctoNEAR of a licence reaches creators, as the testnet ledger shows. These are the revenue lines we plan to add, each disclosed on-chain or in a public price list."
        />
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          <Plan tag="Protocol" title="Licence fee" body="A small, fixed protocol share of each licence, written into a future contract version and visible in every quote before you pay." />
          <Plan tag="SaaS" title="Canon Programs" body="Hosted derivative programs for brands and NFT collections: branded submission portals, review tooling, analytics and payout reports." />
          <Plan tag="API" title="Clearance API" body="For studios and marketplaces: query any work's lineage, clearance and licence status before you publish, at volume." />
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-28">
        <SectionHead label="Roadmap" title="From working protocol to production rights layer." />
        <ol className="mt-14 grid gap-12 lg:grid-cols-3 lg:gap-10">
          <Phase
            when="Now · November 2026"
            state="Shipped"
            items={[
              "Registry and keyless vaults live on NEAR testnet",
              "Approvals, lineage clearance, licence NFTs",
              "NEP-199 resale royalties up the lineage",
              "41 contract tests, 11 attacks refused on-chain",
              "Open source under MIT",
            ]}
          />
          <Phase
            when="Next · Q1 2027"
            state="Planned"
            items={["Independent security review of the registry and vault", "Mainnet launch", "Pilot derivative programs with NEAR collections and artists", "Licence templates reviewed by IP counsel"]}
          />
          <Phase
            when="Later · 2027"
            state="Planned"
            items={["Clearance API for studios and marketplaces", "Works with multiple parents", "Fiat checkout for licence buyers", "Program dashboards and payout reporting"]}
          />
        </ol>
      </section>

      {/* Principles */}
      <section className="mt-28">
        <SectionHead label="Principles" title="How we build." />
        <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <Principle icon={<KeyRound className="size-5" />} title="No master key" body="No admin, pause or upgrade method. The registry's keys are deleted after deploy; vault code is fixed by hash." />
          <Principle icon={<BadgeCheck className="size-5" />} title="Proof over claims" body="Every claim on this site links to a test or a transaction. The attacks we defend against are published." />
          <Principle icon={<Code2 className="size-5" />} title="Open source" body="Contracts, app and deploy scripts are public under MIT. Anyone can verify, fork or build on Canon." />
          <Principle icon={<Scale className="size-5" />} title="Honest about law" body="On-chain records are strong evidence of who declared and approved what. They don't replace contracts or courts, and we say so." />
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-28 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <SectionHead label="FAQ" title="Questions people ask first." />
        <dl className="space-y-9">
          {[
            ["Who holds the money?", "Each work's own vault: a NEAR sub-account with no access keys. Only the work's current NFT owner can withdraw from it, through the registry. Contributor shares are held for the contributor to claim."],
            ["What happens when a work NFT is sold?", "The vault and all future income move to the buyer. The seller can't withdraw afterwards, can't sell mid-withdrawal and can't drain the vault while it's listed. Marketplaces that support NEP-199 also pay every ancestor a resale royalty."],
            ["Does registering prove I own the copyright?", "No. It records your signed declaration, the file's hash and a timestamp, plus every approval. That's strong evidence. Legal ownership is still decided by contracts and courts."],
            ["Why NEAR?", "Named accounts and sub-accounts let every work be a real account; global contracts let thousands of vaults share one immutable 3.5 KB program; and fees are low enough for small licences."],
            ["What does it cost to use?", "Registering costs about 0.1 Ⓝ of refundable storage. Licences cost whatever the creator sets. Canon currently takes no fee."],
          ].map(([q, a]) => (
            <div key={q}>
              <dt className="text-[17px] font-medium tracking-[-0.02em] text-fg">{q}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-fg-2">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Team */}
      <section className="mt-28">
        <div className="relative overflow-hidden py-6">
          <div aria-hidden className="absolute -right-40 -top-40 size-[520px] bg-[radial-gradient(closest-side,rgba(169,139,255,0.14),transparent)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <Label>Built by Bootstate</Label>
              <p className="mt-4 text-[28px] font-medium leading-tight tracking-[-0.035em] text-fg sm:text-[36px]">
                An independent studio building at the edge of AI and on-chain products.
              </p>
              <p className="mt-4 max-w-xl text-fg-2">
                We&apos;re working with IP owners, artists and studios to run Canon&apos;s first pilot programs. If you hold a
                character, collection or brand world, we&apos;d like to build its canon with you.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <ButtonLink href={GITHUB} target="_blank" rel="noreferrer" variant="primary" size="lg">
                <Code2 className="size-4" /> Read the code <ArrowUpRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/proof" variant="secondary" size="lg">
                <Sparkles className="size-4" /> See the proof <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Audience({ icon, who, what, points }: { icon: React.ReactNode; who: string; what: string; points: string[] }) {
  return (
    <div>
      <span className="text-ember">{icon}</span>
      <p className="mt-5 text-[21px] font-medium tracking-[-0.03em] text-fg">{who}</p>
      <p className="mt-2 text-[15px] text-fg-2">{what}</p>
      <ul className="mt-6 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-sm text-fg-2">
            <Check className="mt-0.5 size-4 shrink-0 text-ok" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Plan({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">
        {tag} <span className="text-fg-3/60">· planned</span>
      </p>
      <p className="mt-5 text-[21px] font-medium tracking-[-0.03em] text-fg">{title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{body}</p>
    </div>
  );
}

function Phase({ when, state, items }: { when: string; state: "Shipped" | "Planned"; items: string[] }) {
  const shipped = state === "Shipped";
  return (
    <li>
      <span className={`block h-px w-full ${shipped ? "bg-gradient-to-r from-ok to-transparent" : "bg-gradient-to-r from-white/25 to-transparent"}`} />
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-fg-2">{when}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${shipped ? "bg-ok/10 text-ok ring-ok/25" : "bg-white/[0.03] text-fg-3 ring-line-2"}`}>{state}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5 text-[15px] text-fg-2">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${shipped ? "bg-ok" : "bg-white/25"}`} />
            {i}
          </li>
        ))}
      </ul>
    </li>
  );
}

function Principle({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <span className="text-violet">{icon}</span>
      <p className="mt-4 text-[17px] font-medium tracking-[-0.02em] text-fg">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg-2">{body}</p>
    </div>
  );
}

