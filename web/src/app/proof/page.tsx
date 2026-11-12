import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui";
import { LEDGER, REGISTRY_ACCOUNT } from "@/lib/ledger";

export const metadata: Metadata = { title: "Proof · Canon" };

const THREATS: [string, string, string][] = [
  ["Seller keeps withdrawing after the sale", "withdraw() checks the current NFT owner at call time", "ERR_NOT_OWNER"],
  ["Seller sells while a withdrawal is in flight", "The token is locked for the withdrawal; nft_transfer rejects while locked", "ERR_TOKEN_LOCKED"],
  ["Seller lists, then drains the vault before the buyer pays", "Withdrawals are blocked while the token has any approval", "ERR_TOKEN_LISTED"],
  ["Seller keeps an access key on the vault", "Vaults are created with zero access keys and no upgrade method", "no AddKey"],
  ["Anyone calls the vault directly", "The vault accepts calls only from the registry contract", "ERR_ONLY_REGISTRY"],
  ["A stranger approves a derivative into canon", "approve() requires the parent's current owner", "ERR_NOT_PARENT_OWNER"],
  ["A studio licenses work with a non-commercial ancestor", "buy_license() re-checks clearance across the whole lineage", "ERR_NOT_CLEARED"],
  ["Splits over or under 100%", "Registration rejects splits that don't total 10,000 bps", "ERR_BAD_SPLITS"],
  ["Rounding leaks or creates money", "Integer math; the remainder goes to the node's vault; sum equals price", "ERR_INVARIANT_SUM"],
  ["An approved file is silently swapped", "The file hash is written once at registration; no method can change it", "no setter"],
];

export default function ProofPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      <Label>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="size-3.5" /> Proof & threat model
        </span>
      </Label>
      <h1 className="display mt-5 max-w-[16ch] text-[48px] text-fg sm:text-[72px]">Every way a seller could try to keep the money.</h1>
      <p className="mt-5 max-w-2xl text-fg-2">
        This is the threat model the contracts are built against. Every row is covered by a unit test in the registry contract, and
        the attacks that can be sent as transactions were sent on testnet and refused.
      </p>

      <div className="panel noise mt-12 overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1.4fr_auto] gap-6 border-b border-line px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3 md:grid">
          <span>Attack</span>
          <span>Defence</span>
          <span>Result</span>
        </div>
        <ul>
          {THREATS.map(([attack, defence, result], i) => (
            <li key={attack} className="grid gap-2 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[1.1fr_1.4fr_auto] md:items-center md:gap-6 md:px-6">
              <p className="text-[15px] text-fg">
                <span className="mr-3 font-mono text-[11px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                {attack}
              </p>
              <p className="text-sm text-fg-2">{defence}</p>
              <span className="w-fit rounded-md bg-bad/10 px-2 py-0.5 font-mono text-[11px] text-bad ring-1 ring-bad/20">{result}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Registry unit tests", "33 passing", "text-ok"],
          ["Attacks refused on testnet", `${LEDGER.filter((r) => r.refused).length} of ${LEDGER.filter((r) => r.refused).length}`, "text-ok"],
          ["Keys on the registry and vaults", "0", "text-ok"],
        ].map(([k, v, c]) => (
          <div key={k} className="panel p-5">
            <p className="text-xs text-fg-3">{k}</p>
            <p className={`num mt-1.5 text-2xl ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-20">
        <Label>Recorded on NEAR testnet</Label>
        <h2 className="display mt-5 text-[36px] text-fg sm:text-[48px]">The whole story, as transactions.</h2>
        <p className="mt-4 max-w-2xl text-fg-2">
          Registry{" "}
          <a href={`https://testnet.nearblocks.io/address/${REGISTRY_ACCOUNT}`} target="_blank" rel="noreferrer" className="font-mono text-[14px] text-fg underline decoration-line-3 underline-offset-4 hover:decoration-fg">
            {REGISTRY_ACCOUNT}
          </a>
          . Every row links to the block explorer. Shielded rows are attacks the contract refused.
        </p>
        <ol className="panel mt-8 overflow-hidden">
          {LEDGER.map((r, i) => (
            <li key={r.hash} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-6">
              <span className="w-6 font-mono text-[11px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className={`block truncate text-sm ${r.refused ? "text-fg" : "text-fg-2"}`}>{r.step}</span>
                {r.refused && <span className="font-mono text-[11px] text-bad">refused · {r.expected}</span>}
              </span>
              <a href={`https://testnet.nearblocks.io/txns/${r.hash}`} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[11px] text-fg-3 hover:text-fg">
                {r.hash.slice(0, 8)}… ↗
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
