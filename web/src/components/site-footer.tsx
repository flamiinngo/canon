import Link from "next/link";
import { Logo } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo className="text-ink" />
          <p className="max-w-xs text-sm text-ink-2">
            Every work is an account. Every licence pays the family tree. Built on NEAR.
          </p>
        </div>
        <FooterCol title="Product" links={[["Explore", "/explore"], ["Register a work", "/register"], ["Review queue", "/review"]]} />
        <FooterCol title="Trust" links={[["Proof ledger", "/proof"], ["Threat model", "/proof#threat-model"], ["How payouts work", "/#how"]]} />
        <FooterCol title="Bootstate" links={[["canon.bootstate.xyz", "/"], ["NEAR Hackathon 2026", "https://nearhackathon.com"]]} />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pb-10 text-xs text-ink-3 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>On-chain records show declarations and approvals. They do not by themselves prove copyright.</p>
        <p className="font-mono">canon.near · NEP-171 · NEP-199</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-ink-2 transition-colors hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
