import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui";

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
        This is the threat model the contracts are built against. Every row is covered by a unit test in the registry or vault
        contract, and after deployment each refusal is reproduced as a testnet transaction.
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
          ["Contract unit tests", "37 passing", "text-ok"],
          ["Testnet transactions", "After deploy", "text-fg-2"],
          ["Admin keys", "0", "text-ok"],
        ].map(([k, v, c]) => (
          <div key={k} className="panel p-5">
            <p className="text-xs text-fg-3">{k}</p>
            <p className={`num mt-1.5 text-2xl ${c}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
