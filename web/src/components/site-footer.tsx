import Link from "next/link";
import { Logo } from "./ui";

export function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-line">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-fg-3">
            The rights layer for creative IP. Every work is an account; every licence pays the family tree.
          </p>
        </div>
        <Col
          title="Product"
          links={[
            ["Explore works", "/explore"],
            ["Register a work", "/register"],
            ["Review queue", "/review"],
            ["Collection", "/collection"],
          ]}
        />
        <Col
          title="Trust"
          links={[
            ["Proof & threat model", "/proof"],
            ["About & roadmap", "/about"],
            ["Source code (MIT)", "https://github.com/flamiinngo/canon"],
            ["NEP-171 standard", "https://github.com/near/NEPs/blob/master/neps/nep-0171.md"],
          ]}
        />
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 border-t border-line px-4 py-6 text-xs text-fg-3 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>On-chain records show declarations and approvals. They are evidence, not copyright registration.</p>
        <p className="font-mono">© 2026 Bootstate · canon.bootstate.xyz</p>
      </div>
    </footer>
  );
}

function Col({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">{title}</p>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => {
          const external = href.startsWith("http");
          return (
            <li key={label}>
              <Link href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="text-sm text-fg-2 transition-colors hover:text-fg">
                {label}
                {external && <span className="ml-1 text-fg-3">↗</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
