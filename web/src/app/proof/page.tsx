import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Proof · Canon" };

const THREATS: [string, string, string][] = [
  ["Seller keeps withdrawing after the sale", "withdraw() checks the current NFT owner at call time", "ERR_NOT_OWNER"],
  ["Seller sells while a withdrawal is in flight", "Token is locked during withdrawal; nft_transfer rejects while locked", "ERR_TOKEN_LOCKED"],
  ["Seller lists, then drains the vault before the buyer pays", "Withdrawals are blocked while the token has any approval", "ERR_TOKEN_LISTED"],
  ["Seller keeps an access key on the vault", "Vaults are created with zero access keys and no upgrade method", "view_access_key_list → []"],
  ["Anyone calls the vault directly", "Vault accepts calls only from the registry", "ERR_ONLY_REGISTRY"],
  ["Stranger approves a derivative into canon", "approve() requires the parent's current owner", "ERR_NOT_PARENT_OWNER"],
  ["Studio licenses work with a non-commercial ancestor", "buy_license() re-checks clearance for the whole lineage", "ERR_NOT_CLEARED"],
  ["Splits over or under 100%", "Registration rejects splits that don't total 10,000 bps", "ERR_BAD_SPLITS"],
  ["Rounding leaks or creates money", "Integer math; remainder goes to the node's vault; sum == price", "invariant test"],
  ["Approved file silently swapped", "File hash is fixed at approval and cannot change", "ERR_IMMUTABLE"],
];

export default function ProofPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Eyebrow>
        <ShieldCheck className="size-3.5" /> Proof ledger
      </Eyebrow>
      <h1 className="mt-4 font-display text-5xl leading-[1] tracking-[-0.02em] sm:text-6xl">
        Every way a seller could <span className="italic text-accent">try to keep the money</span>
      </h1>
      <p className="mt-4 max-w-2xl text-ink-2">
        This is the threat model behind the contracts. Each row maps to a sandbox test and, after deployment, a mainnet
        transaction that shows the attack being refused.
      </p>

      <Card id="threat-model" className="mt-10 scroll-mt-24 overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1.4fr_auto] gap-6 border-b border-line bg-paper-2 px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-3 md:grid">
          <span>Attack</span>
          <span>Defence</span>
          <span>Result</span>
        </div>
        <ul className="divide-y divide-line">
          {THREATS.map(([attack, defence, result]) => (
            <li key={attack} className="grid gap-2 px-5 py-4 md:grid-cols-[1.1fr_1.4fr_auto] md:items-center md:gap-6 md:px-6">
              <p className="text-sm font-medium text-ink">{attack}</p>
              <p className="text-sm text-ink-2">{defence}</p>
              <span className="num w-fit rounded-md bg-bad-soft px-2 py-1 text-[11px] text-bad">{result}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-ink-3">Sandbox tests</p>
          <p className="num mt-1 text-2xl text-ink">In progress</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-3">Mainnet transactions</p>
          <p className="num mt-1 text-2xl text-ink">After deploy</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-3">Admin keys</p>
          <p className="num mt-1 text-2xl text-ok">0</p>
        </Card>
      </div>
    </div>
  );
}
