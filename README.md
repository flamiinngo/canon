# Canon

**Creative IP where every work is a NEAR account, and every licence pays the whole family tree.**

Built at NEAR HACKATHON 2026 · Track 10 *NFTs That Do Something* · by Bootstate.

- Live app: https://canon.bootstate.xyz
- Registry contract (NEAR testnet): `REGISTRY_ACCOUNT` *(filled in at deploy, see [JUDGES.md](JUDGES.md))*
- Threat model: [THREAT_MODEL.md](THREAT_MODEL.md)

## What it is

Canon is a registry for creative works and the works built on them.

1. An artist registers an **original** work. It is minted as a NEP-171 NFT, and Canon creates a
   **vault sub-account `<work>.<registry>` with zero access keys** for it.
2. Other creators submit **derivatives** (a 3D relief, a motion loop, a colourway). A derivative
   joins the lineage only when the **parent's current owner approves** it on-chain.
3. A studio asks one question: *can I use this commercially?* `clearance` walks every ancestor
   and returns one verdict with a reason per generation.
4. The studio pays once with `buy_license`. The payment is **split up the family tree in one
   transaction**: each work's owner share goes into its vault, each contributor's share is
   credited to the person, and the studio receives a **licence NFT** that unlocks the source file.
5. Whoever holds a work's NFT controls its vault. Sell the NFT and its future income goes with
   it. The seller cannot withdraw after the sale, cannot sell mid-withdrawal, and cannot drain
   the vault while it is listed.

## The problem

Fan and community derivatives of characters and artworks already exist, but nobody can tell a
buyer which ones are approved, who contributed, whether the lineage allows commercial use, or
how to pay everyone. Canon makes the approvals, the clearance check and the payout split one
on-chain workflow. An on-chain record is evidence of declarations and approvals; it is not a
copyright registration, and the app says so.

## Try it (judges)

Do X → see Y. All steps work on NEAR testnet with any testnet wallet.

| Do | See |
|---|---|
| Open the app home page | Live diagram of one licence splitting across three generations, with a synced transaction log |
| Explore → open **Ember Field — Motion** | Clearance across 3 generations, contributor splits, vault account, lineage graph |
| Click **License** → connect a testnet wallet → pay | One `buy_license` transaction; payouts listed before you pay; licence NFT minted to you |
| After paying, click **Source file** | 2048 px PNG downloads; access is checked with `has_licence` on-chain |
| Open **Moth Light — Fragments** | "Not cleared": its parent forbids commercial use; `buy_license` would fail with `ERR_NOT_CLEARED` |
| Open **Tidal — Neon Remix** | Revoked derivative; cannot be licensed |
| **Register** → *A derivative* → pick a parent → submit | Pending work with its own keyless vault; appears in the parent owner's **Review** queue |
| Wallet menu → **Claim** | Contributors collect their credited shares |
| [JUDGES.md](JUDGES.md) | Testnet transaction hashes for every step, including refused attacks |

## Architecture

```
web/ (Next.js 16, Tailwind 4)          contracts/ (Rust, near-sdk 5.30)
  ├─ generative artwork engine           ├─ registry  NEP-171/177/178/181 + Canon logic
  ├─ live data via NEAR RPC views        │    register_work · approve · reject · revoke
  └─ wallet via @hot-labs/near-connect   │    clearance · quote_license · buy_license
                                         │    withdraw (locked) · claim · views
                                         └─ vault     no_std, 3.4 KB: release(to, amount), registry-only
```

* **Vaults** are sub-accounts created by the registry in one batch:
  `CreateAccount → Transfer(0.03 Ⓝ) → UseGlobalContract(vault code hash) → FunctionCall(new)`.
  No `AddKey` is ever issued. The vault code is a NEP-591 global contract referenced **by hash**,
  so it can never change.
* **Payout math** is integer: at each generation the parent takes `upstream_bps` of what arrived,
  contributors take their bps of the remainder, and the node's vault keeps the rest (including
  rounding dust). The contract asserts the payouts sum exactly to the price.
* **Control follows the token**: `withdraw` pays the current NFT owner, requires 1 yoctoNEAR
  (full-access key), refuses while listed, and locks the token until the vault answers.
* **No admin.** The registry has no owner, pause, upgrade or override method, and its access
  keys are deleted after deployment.

On-chain: ownership, lineage, approvals, terms, splits, balances, licences, file hashes.
Off-chain: the artwork itself (generated deterministically from the genome stored in the
token's `media` field, or kept by the creator with only its SHA-256 on-chain).

## Run it

```bash
# Web app (preview mode with demo data if no contract is set)
cd web && pnpm install && pnpm dev            # http://localhost:3000
# Live mode
echo "NEXT_PUBLIC_CANON_CONTRACT=<registry>.testnet" > web/.env.local

# Contracts (Linux/macOS/WSL)
cd contracts && cargo test -p canon-registry   # 33 unit tests
(cd vault && RUSTUP_TOOLCHAIN=1.86.0 cargo near build non-reproducible-wasm --no-abi)   # 3.4 KB
(cd registry && cargo near build non-reproducible-wasm)
# Deploy + seed the demo lineage + record judge transactions
bash scripts/deploy.sh <registry>.testnet <funder>.testnet
```

## Disclosure

* **Pre-hackathon code:** none. Everything in this repository was written during the hackathon
  (first commit 2026-11-12).
* **Libraries:** near-sdk, near-contract-standards, Next.js, React, Tailwind CSS, motion,
  lucide-react, clsx, tailwind-merge, @hot-labs/near-connect.
* **AI-generated code:** this project was built with Claude Code (Anthropic) as a pair
  programmer. The team reviewed, tested and is responsible for all of it.
* **Other chains:** no existing product on another chain.

## License

MIT, see [LICENSE](LICENSE).
