import { ArrowRight, BadgeCheck, GitFork, KeyRound, Landmark, ShieldCheck, Users } from "lucide-react";
import { LineageGraph } from "@/components/lineage-graph";
import { ButtonLink, Card, Eyebrow, Fig } from "@/components/ui";
import { Character } from "@/components/character";
import { computeCascade, formatNear } from "@/lib/canon";
import { getWork } from "@/lib/data";

export default function Home() {
  const cascade = computeCascade("zuri-animated", 150);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <Eyebrow>
              <span className="size-1.5 rounded-full bg-accent" /> Built on NEAR · NFTs that pay NFTs
            </Eyebrow>
            <h1 className="mt-5 font-display text-[44px] leading-[0.98] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[76px]">
              Every work is an account.
              <br />
              <span className="italic text-accent">Every licence</span> pays the family tree.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Canon lets an original character grow into a family of approved derivatives. Each work has its own keyless
              NEAR account, so when a studio licenses one, the payment flows to everyone upstream in a single transaction.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/explore" variant="accent" size="lg">
                Explore the canon <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/works/zuri-animated" variant="secondary" size="lg">
                License a work
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              <Stat value="0" label="access keys on any vault" />
              <Stat value="1 tx" label="pays every generation" />
              <Stat value="100%" label="of each payment accounted for" />
            </dl>
          </div>

          <Card className="grain relative overflow-hidden p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <Fig n="0.1">A licence of “Zuri — Animated”, live</Fig>
              <span className="num shrink-0 whitespace-nowrap rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-ink-2 ring-1 ring-line">150.00 Ⓝ</span>
            </div>
            <LineageGraph focusId="zuri-animated" autoplay includePending={false} linkNodes={false} className="mt-2" />
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {cascade.map((s, i) => (
                <div key={s.work.id} className="min-w-0">
                  <p className="truncate text-[11px] text-ink-3">{i === 0 ? "Licensed work" : i === 1 ? "Parent" : "Original"}</p>
                  <p className="num text-sm font-medium text-ink">{formatNear(s.keptNear)} Ⓝ</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.015em] sm:text-5xl">
            From one drawing to a <span className="italic">licensable</span> universe.
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="01" icon={<Landmark className="size-4" />} title="Register the original" body="Mint the work as an NFT with its own vault account. Set the terms: derivatives, commercial use, and the share that flows upstream." art="zuri" />
          <Step n="02" icon={<GitFork className="size-4" />} title="Approve derivatives" body="Creators submit 3D models, outfits and animations. Only the parent's current owner can approve one into the canon." art="zuri-3d" />
          <Step n="03" icon={<BadgeCheck className="size-4" />} title="Clear and license" body="A studio sees one verdict for the whole lineage. Every ancestor must allow commercial use, or the licence can't be issued." art="zuri-animated" />
          <Step n="04" icon={<Users className="size-4" />} title="Paid up the tree" body="The licence payment splits across every generation and contributor in one transaction. The studio gets a licence NFT." art="zuri-winter" />
        </ol>
      </section>

      {/* ── The rule ───────────────────────────────────────── */}
      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <Eyebrow>The rule</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.015em] sm:text-5xl">
              Asset income follows the NFT. <span className="italic text-accent">Authorship income follows the people.</span>
            </h2>
            <p className="mt-6 max-w-lg text-ink-2">
              The owner's share lands in the work's vault, and it changes hands when the NFT is sold. Contributors' shares are
              credited to them personally and never move with a sale. Nobody loses credit for what they made.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RuleCard title="Vault · follows the NFT" mono="zuri-3d.canon.near" lines={[["Owner share", "70%"], ["Moves on sale", "Yes"], ["Withdraw", "Current owner only"]]} />
            <RuleCard title="Credit · follows the person" mono="cy.near" lines={[["Texturing share", "30%"], ["Moves on sale", "Never"], ["Withdraw", "cy.near, any time"]]} />
          </div>
        </div>
      </section>

      {/* ── Proof ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <Eyebrow>
              <ShieldCheck className="size-3.5" /> Don't trust — verify
            </Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.015em] sm:text-5xl">No master key. Not even ours.</h2>
            <p className="mt-6 text-ink-2">
              Vaults are NEAR sub-accounts with zero access keys. They obey only the registry, and the registry obeys only the
              current NFT owner. Every refusal below is a test in the suite and a transaction you can look up.
            </p>
            <ButtonLink href="/proof" variant="secondary" className="mt-8">
              Open the proof ledger <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {[
                ["Seller withdraws after the sale", "ERR_NOT_OWNER"],
                ["Transfer while a withdrawal is in flight", "ERR_TOKEN_LOCKED"],
                ["Approve a derivative you don't own the parent of", "ERR_NOT_PARENT_OWNER"],
                ["License work with a non-commercial ancestor", "ERR_NOT_CLEARED"],
                ["Splits that don't add up to 100%", "ERR_BAD_SPLITS"],
                ["Call a vault directly", "ERR_ONLY_REGISTRY"],
              ].map(([attack, code]) => (
                <li key={code} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <KeyRound className="size-4 shrink-0 text-ink-3" />
                    <span className="truncate text-sm text-ink">{attack}</span>
                  </div>
                  <span className="num shrink-0 rounded-md bg-bad-soft px-2 py-1 text-[11px] text-bad">{code}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* ── Audiences ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Audience title="For IP owners" body="Run an official derivative program. Approve the best fan work into canon and earn on everything built from yours." />
          <Audience title="For creators" body="Build on characters people love, with permission on record and an automatic share of every licence." />
          <Audience title="For studios" body="One clearance verdict for the whole lineage, one payment, and a licence NFT that unlocks the source files." />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grain relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-paper sm:px-12 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-[1.02] tracking-[-0.015em] sm:text-6xl">
              Start a canon. <span className="italic opacity-70">Let it grow.</span>
            </h2>
            <p className="mt-5 max-w-md text-paper/70">Register an original work in under a minute. Your terms, your approvals, your family tree.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" variant="accent" size="lg">
                Register a work <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/explore" size="lg" className="bg-paper/10 text-paper ring-1 ring-paper/20 hover:bg-paper/15">
                Browse works
              </ButtonLink>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 hidden size-72 overflow-hidden rounded-full opacity-90 ring-8 ring-paper/10 md:block">
            <Character art={getWork("zuri-animated")!.art} />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="num text-2xl font-medium text-ink sm:text-[28px]">{value}</dd>
      <dd className="mt-1 text-xs leading-snug text-ink-3">{label}</dd>
    </div>
  );
}

function Step({ n, icon, title, body, art }: { n: string; icon: React.ReactNode; title: string; body: string; art: string }) {
  return (
    <li>
      <Card className="group flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
          <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-105">
            <Character art={getWork(art)!.art} />
          </div>
          <span className="num absolute left-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] text-ink-2 backdrop-blur">{n}</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="flex items-center gap-2 font-medium text-ink">
            <span className="text-accent">{icon}</span>
            {title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
        </div>
      </Card>
    </li>
  );
}

function RuleCard({ title, mono, lines }: { title: string; mono: string; lines: [string, string][] }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="num mt-1 text-xs text-ink-3">{mono}</p>
      <dl className="mt-5 space-y-3">
        {lines.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Audience({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl p-6 ring-1 ring-line">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}
