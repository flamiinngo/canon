<p align="center">
  <img src="docs/banner.svg" alt="Canon: creative IP that pays its whole family tree" width="100%" />
</p>

<p align="center">
  <a href="https://testnet.nearblocks.io/address/canon-bootstate.testnet"><img alt="NEAR testnet" src="https://img.shields.io/badge/NEAR-testnet%20live-b6ff5c?style=flat-square&labelColor=0f1115"></a>
  <img alt="Track" src="https://img.shields.io/badge/Track%2010-NFTs%20That%20Do%20Something-ff6a3d?style=flat-square&labelColor=0f1115">
  <img alt="Tests" src="https://img.shields.io/badge/registry%20tests-33%20passing-3ee39b?style=flat-square&labelColor=0f1115">
  <a href="JUDGES.md"><img alt="Ledger" src="https://img.shields.io/badge/testnet%20ledger-38%20tx%20%C2%B7%2011%20refused%20attacks-a98bff?style=flat-square&labelColor=0f1115"></a>
  <img alt="Keys" src="https://img.shields.io/badge/admin%20keys-0-52d6ff?style=flat-square&labelColor=0f1115">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-eef0f3?style=flat-square&labelColor=0f1115"></a>
</p>

# Canon

**Every creative work is a NEAR NFT that owns its own keyless wallet. When a studio licenses a derivative, one
payment splits up the entire family tree (original artist, 3D sculptor, animator, every contributor) in a
single transaction.**

Built at **NEAR HACKATHON 2026** for **Track 10 · NFTs That Do Something** by Bootstate.

| | |
|---|---|
| **Registry contract** | [`canon-bootstate.testnet`](https://testnet.nearblocks.io/address/canon-bootstate.testnet) · NEP-171 / 177 / 178 / 181 · **0 access keys** |
| **Vault code** | 3.4 KB `no_std` contract, published as an immutable NEP-591 global contract · hash `8CsdQ7aVrqG9YXSUoxjuE8YMVnnPiEiCYjjfTHUoaBUH` |
| **Proof** | [JUDGES.md](JUDGES.md): 38 real testnet transactions, including **11 attacks the contract refused** |
| **Security** | [THREAT_MODEL.md](THREAT_MODEL.md): 23 attacks → defence → error code → test |
| **App** | Next.js 16 · reads and writes the live registry · [run it in 2 commands](#run-it) |

---

## What the NFT does

A normal NFT records who owns a picture. A Canon NFT **is an account with money and rules**:

| The NFT… | How | Proof |
|---|---|---|
| **owns a wallet** | Each work gets a sub-account `<work>.canon-bootstate.testnet` with **no access keys**, running the shared vault code | [`ember-motion.canon-bootstate.testnet`](https://testnet.nearblocks.io/address/ember-motion.canon-bootstate.testnet) |
| **earns from its descendants** | Every licence of a derivative sends a share upstream to each ancestor's vault | [licence tx `AjoPWX…`](https://testnet.nearblocks.io/txns/AjoPWXFtebxkJTwLVdaDLeVBNz8GxoyySYnijppTxrQD) |
| **carries rights** | Derivatives exist only with the parent owner's on-chain approval; clearance walks every ancestor | [refused `ERR_NOT_CLEARED`](https://testnet.nearblocks.io/txns/CzeASXdLC7mFtJTyX1N8HcHdowPdQpkENtZikVTc6acY) |
| **moves money with ownership** | Sell the NFT and its vault, plus all future income, goes to the buyer; the seller is locked out | [seller refused `ERR_NOT_OWNER`](https://testnet.nearblocks.io/txns/FAeoHSyP15ZkjNjRb4tDvRCDSiKnhw5sRuPx34rPWRUZ) → [buyer withdraws](https://testnet.nearblocks.io/txns/uvz5MXAvnQBbmBStLstUHzY3X8LzTuo8E7mPeDrwiQP) |
| **is a key** | The studio receives a **licence NFT**; holding it unlocks the source files, and it can be resold | `nft_tokens_for_owner(studio…)` → `licence-0`, `licence-1` |

## The payment, step by step

A studio licenses **Ember Field — Motion** for **1.5 Ⓝ**. One call, `buy_license`, does all of this
([transaction](https://testnet.nearblocks.io/txns/AjoPWXFtebxkJTwLVdaDLeVBNz8GxoyySYnijppTxrQD)):

```mermaid
sequenceDiagram
    autonumber
    actor Studio
    participant R as canon registry
    participant M as ember-motion vault
    participant L as ember-relief vault
    participant E as ember vault
    Studio->>R: buy_license("ember-motion") + 1.5 NEAR
    R->>R: clearance: motion ✓ relief ✓ ember ✓
    R->>M: 0.900 NEAR (owner share)
    R-->>R: credit fay 0.225 (score)
    R->>L: 0.210 NEAR (owner share)
    R-->>R: credit cy 0.090 (materials)
    R->>E: 0.075 NEAR (original)
    R->>Studio: mint licence NFT "licence-0"
    Note over R: sum of payouts == 1.5 NEAR, asserted on-chain
```

| Generation | Work | Arrives | Passes upstream | Vault (follows NFT) | Contributors (follow people) |
|---|---|---:|---:|---:|---:|
| 0 | Ember Field — Motion | 1.500 | 0.375 (25%) | 0.900 | fay 0.225 |
| −1 | Ember Field — Relief | 0.375 | 0.075 (20%) | 0.210 | cy 0.090 |
| −2 | Ember Field | 0.075 | — | 0.075 | — |
| | **Total** | | | **1.185** | **0.315** = **1.500** ✓ |

> **Asset income follows the NFT. Authorship income follows people.** The owner's share lands in the work's vault
> and changes hands with the token. Contributor shares are credited to the person and never move with a sale.

## Try it (judges)

**No wallet needed** for the first four rows. Every row works on NEAR testnet.

| Do | See |
|---|---|
| `cd web && pnpm i && pnpm dev`, open `localhost:3000` | Live hero: one licence splitting across three generations with a synced transaction log |
| **Explore** → **Ember Field — Motion** | Clearance across 3 generations · contributor splits · **The NFT** panel (contract, token ID, holder, raw `nft_token` metadata) · licences issued and who holds them · lineage graph |
| **Collection** → *Studio* demo collector | The studio's two **licence NFTs**, read with `nft_tokens_for_owner` |
| **Proof** | All 38 testnet transactions with explorer links; refused attacks highlighted |
| Connect any testnet wallet → **License** a cleared work | One `buy_license` transaction; payouts shown before you pay; licence NFT appears in your Collection; **Source file** downloads |
| **Register** → *A derivative* → pick a parent | A pending work with its own keyless vault, waiting in the parent owner's **Review** queue |
| Open **Moth Light — Fragments** | "Not cleared": its parent forbids commercial use |

### Verify on-chain yourself

```bash
near account list-keys canon-bootstate.testnet network-config testnet now                 # → no keys
near account list-keys ember-motion.canon-bootstate.testnet network-config testnet now    # → no keys
near contract call-function as-read-only canon-bootstate.testnet quote_license \
  json-args '{"token_id":"ember-motion"}' network-config testnet now                       # → the split above
near contract call-function as-read-only canon-bootstate.testnet clearance \
  json-args '{"token_id":"moth-fragments"}' network-config testnet now                     # → cleared: false + reason
near contract call-function as-read-only canon-bootstate.testnet nft_tokens_for_owner \
  json-args '{"account_id":"studio.canon-bootstate-demo.testnet"}' network-config testnet now
```

## Security: the refusals are on-chain

The track asks *what stops the old owner from keeping access?* Every answer below is a transaction anyone can open.

| Attack | Refused with | Transaction |
|---|---|---|
| Seller withdraws after selling the NFT | `ERR_NOT_OWNER` | [`FAeoHS…`](https://testnet.nearblocks.io/txns/FAeoHSyP15ZkjNjRb4tDvRCDSiKnhw5sRuPx34rPWRUZ) |
| Seller drains the vault while the NFT is listed | `ERR_TOKEN_LISTED` | [`CNLgN8…`](https://testnet.nearblocks.io/txns/CNLgN8gkA8UDDrAQNE4itvjVXxTp89ah871fQ8MWT541) |
| Stranger withdraws from a vault | `ERR_NOT_OWNER` | [`GzD729…`](https://testnet.nearblocks.io/txns/GzD729gi2n3f97MoQ4ArLC37ERh7Xoyvm2UMkbHeNkFf) |
| Anyone calls a vault directly | `ERR_ONLY_REGISTRY` | [`NaJwfC…`](https://testnet.nearblocks.io/txns/NaJwfCk58Ba4zqqYyoQvrrKSK6bg9LewrNZKhEADfRR) |
| Non-owner approves a derivative | `ERR_NOT_PARENT_OWNER` | [`EPa2Ws…`](https://testnet.nearblocks.io/txns/EPa2WsTM7bUhEZVQQF2ZDTTSavFzatuY3oPHEwJmxrT7) |
| Licence a work with a non-commercial ancestor | `ERR_NOT_CLEARED` | [`CzeASX…`](https://testnet.nearblocks.io/txns/CzeASXdLC7mFtJTyX1N8HcHdowPdQpkENtZikVTc6acY) |
| Licence a revoked derivative | `ERR_NOT_CLEARED` | [`FT5guf…`](https://testnet.nearblocks.io/txns/FT5gufJ3c5vsUUturgrsbU3BMcce7MjdjExYwiNToAtC) |
| Licence a pending derivative | `ERR_NOT_CLEARED` | [`947NfY…`](https://testnet.nearblocks.io/txns/947NfYdnrtym2eeozWJwWi3BMvzK2g1gHhTRwXow931e) |
| Derive from a closed work | `ERR_DERIVATIVES_CLOSED` | [`Ni4CKw…`](https://testnet.nearblocks.io/txns/Ni4CKwb75iQDkVXHFdDcMgMmPrFH4ct8Q8mcj4kVmV7) |
| Splits that don't total 100% | `ERR_BAD_SPLITS` | [`B7LnZV…`](https://testnet.nearblocks.io/txns/B7LnZV5uTaDDs3YHyEMzVcrAzEaKnqViBdF7RfCfEbrM) |
| Claim the same earnings twice | `ERR_NOTHING_TO_CLAIM` | [`26T2f7…`](https://testnet.nearblocks.io/txns/26T2f7ZJWBre6RwEBkoDrGi69cvh7Tf2yX4hVbe16xx5) |

Attacks that need a race (selling *during* a withdrawal) or a failure (vault creation or release failing) are
covered by unit tests: `cannot_sell_while_a_withdrawal_is_in_flight`, `cannot_withdraw_twice_concurrently`,
`failed_withdrawal_unlocks_and_keeps_the_balance`, `failed_vault_creation_rolls_back_registration`,
`quote_matches_price_exactly_for_awkward_amounts`. The full list is in [THREAT_MODEL.md](THREAT_MODEL.md).

**No master key.** The registry has no owner, pause, upgrade or override method, and its access keys were deleted
in [`45xDjt…`](https://testnet.nearblocks.io/txns/45xDjthrVNa2zWBkPk2qSJoBpFyCFQHjjYZFXUuqjUjU). Vault code is
referenced by hash, so it cannot change either.

## Architecture

```mermaid
flowchart LR
    subgraph Browser["web/ · Next.js 16"]
      UI["Explore · Work · Collection<br/>Register · Review · Proof"]
      ART["Generative art engine<br/>genome → canvas"]
      W["near-connect wallet"]
    end
    subgraph NEAR["NEAR testnet"]
      REG["canon-bootstate.testnet<br/>registry · Rust · near-sdk 5.30<br/>NEP-171/177/178/181"]
      V1["ember vault · 0 keys"]
      V2["ember-relief vault · 0 keys"]
      V3["ember-motion vault · 0 keys"]
      G[("NEP-591 global code<br/>3.4 KB vault, by hash")]
    end
    UI -- "RPC views" --> REG
    W -- "register · approve · buy_license<br/>withdraw · claim · nft_transfer" --> REG
    REG -- "create + fund + init" --> V1 & V2 & V3
    REG -- "release(to, amount)" --> V2
    V1 & V2 & V3 -. "run" .-> G
```

**Vault creation** is one batch with no `AddKey`, ever:
`CreateAccount → Transfer(0.03 Ⓝ) → UseGlobalContract(hash) → FunctionCall(new)`.
`new()` records its caller as the registry; nobody can initialise a vault first because it runs in the same receipt.

**Withdrawal** checks `caller == nft owner`, requires 1 yoctoNEAR (full-access key), refuses while the token is
listed, then **locks the token** (`nft_transfer` rejects while locked) until the vault's transfer resolves.

**Payout maths** is integer: at each generation the parent takes `upstream_bps` of what arrived, contributors take
their bps of the remainder, and the node's vault keeps the rest including rounding dust. The contract asserts the
sum equals the price.

**On-chain:** ownership, lineage, approvals, terms, splits, balances, licences, file hashes.
**Off-chain:** the artwork. Each token's `media` stores a genome (`canon:genome/4127/flow/ember/relief+motion`)
that the app renders deterministically. A derivative's genome is its parent's plus one transform, so the family
resemblance is visible. Uploaded files stay with the creator; only their SHA-256 is recorded.

### Contract API

| Method | Who | What |
|---|---|---|
| `register_work(token_id, title, …, terms, owner_bps, contributors, parent_id?)` | anyone, payable | Mint the work NFT + create its keyless vault. Originals are approved; derivatives are pending |
| `approve` / `reject` / `revoke(token_id)` | parent's current owner, 1 yN | Decide what joins the lineage |
| `clearance(token_id)` | view | One verdict for the whole lineage, with a reason per generation |
| `quote_license(token_id)` | view | Exactly who receives what |
| `buy_license(token_id, use_case)` | anyone, payable | Re-check clearance, split the payment up the tree, mint a licence NFT |
| `withdraw(token_id)` | current NFT owner, 1 yN | Move the vault balance to the owner (locked while in flight) |
| `claim()` | contributors | Collect credited shares |
| `get_work` · `get_works` · `get_licences` · `has_licence` · `get_claimable` | views | Read everything the UI shows |
| `nft_*` | NEP-171/177/178/181 | Standard NFT interface (transfer blocked while a withdrawal is in flight) |

## Run it

```bash
# Web app: reads and writes the live testnet registry by default
cd web && pnpm install && pnpm dev                      # http://localhost:3000
# NEXT_PUBLIC_CANON_CONTRACT=<account> points at another registry; "" = preview mode with demo data

# Contracts (Linux / macOS / WSL; near-sdk 5.30 needs Rust ≥ 1.95)
cd contracts && cargo test -p canon-registry            # 33 tests
(cd vault && RUSTUP_TOOLCHAIN=1.86.0 cargo near build non-reproducible-wasm --no-abi)   # 3.4 KB
(cd registry && cargo near build non-reproducible-wasm)

# Everything from scratch: faucet accounts → deploy → seed demo story → JUDGES.md → delete registry keys
bash scripts/setup-all.sh <registry>.testnet <funder>.testnet
```

```
contracts/registry   NEP-171 registry: lineage, approvals, clearance, payouts, licences, withdrawals (+ 33 tests)
contracts/vault      no_std vault, 3.4 KB, registry-only release
web/                 Next.js app: generative art engine, live chain layer, wallet, all pages
scripts/             setup-all.sh (one shot) · deploy.sh (build, deploy, seed, ledger, lock)
JUDGES.md            every testnet transaction from the seed run
THREAT_MODEL.md      23 attacks, defences, error codes and tests
```

## Honest limits

* **Copyright truth.** A registration is a creator's declaration plus a file hash. It is evidence, not a copyright
  registration, and the app says so on every work.
* **Secondary-sale royalties (NEP-199)** are not implemented; licence income is the revenue path.
* **Testnet only.** Demo prices are small (0.2–1.5 Ⓝ) so judges can repeat every step with faucet funds.
* **Key loss.** There is deliberately no admin override. Lost keys mean an unreachable vault until the owner recovers
  their account.

## Disclosure

* **Pre-hackathon code:** none. All code was written during the hackathon; the first commit is 2026-11-12.
* **Libraries:** near-sdk, near-contract-standards, Next.js, React, Tailwind CSS, motion, lucide-react, clsx,
  tailwind-merge, @hot-labs/near-connect.
* **AI assistance:** built with Claude Code (Anthropic) as a pair programmer. The team reviewed and tested all of it
  and is responsible for it.
* **Other chains:** no existing product on another chain.

## License

[MIT](LICENSE)
