# Canon threat model

Canon's money lives in per-work vaults whose control follows the NFT. This document lists
every way we could think of for a seller (or anyone else) to take money or rights they
should not have, the defence in the contracts, and the test that proves it.

Contracts: `contracts/registry` (NEP-171 registry) and `contracts/vault` (per-work vault).
Tests: `cargo test -p canon-registry` in `contracts/` (41 unit tests) plus the testnet ledger in [JUDGES.md](JUDGES.md), where every attack below that can be sent as a transaction is sent, and refused.

## Trust model

| Party | Can | Cannot |
|---|---|---|
| Vault (`<token>.<registry>`) | Hold NEAR; release it when the registry asks | Be called by anyone else; be upgraded; hold an access key |
| Registry | Ask a vault to release funds **to the current NFT owner** | Release to anyone else; change a work's file hash or terms |
| NFT owner | Withdraw the vault balance; approve/reject/revoke derivatives of their work | Withdraw while the token is listed or a withdrawal is in flight |
| Contributor | Claim their credited shares | Lose credit when the NFT is sold |
| Deployer | Nothing after deploy: the registry has no owner/admin methods and its keys are deleted | — |

The vault is a dependency-free `no_std` contract (3.4 KB) published as a NEP-591 **global
contract referenced by code hash**, so every vault runs byte-identical code that no one can change.
`new()` records its caller as the registry; the registry calls it in the same batch that creates
the account, so nobody can initialise a vault first.

## Attacks and defences

| # | Attack | Defence | Error | Test |
|---|---|---|---|---|
| 1 | Seller keeps withdrawing after selling the NFT | `withdraw` checks `nft owner == caller` at call time; the vault pays the owner captured in that same receipt | `ERR_NOT_OWNER` | `seller_cannot_withdraw_after_the_sale` |
| 2 | Seller starts a withdrawal, then sells mid-flight so the buyer receives an empty vault | `withdraw` sets `locked = true`; `nft_transfer`, `nft_transfer_call` and `nft_approve` reject while locked; the callback unlocks | `ERR_TOKEN_LOCKED` | `cannot_sell_while_a_withdrawal_is_in_flight` |
| 3 | Double withdrawal racing two receipts | Same lock | `ERR_TOKEN_LOCKED` | `cannot_withdraw_twice_concurrently` |
| 4 | Seller lists the NFT on a marketplace, then drains the vault before the buyer pays | `withdraw` refuses while the token has any NEP-178 approval | `ERR_TOKEN_LISTED` | `cannot_drain_vault_while_listed_for_sale` |
| 5 | Vault release fails (e.g. receiver deleted) and the balance is lost or double counted | Callback unlocks and only decrements the tracked balance on success | — | `failed_withdrawal_unlocks_and_keeps_the_balance` |
| 6 | Seller keeps a key on the vault account | Vault batch is `CreateAccount + Transfer + UseGlobalContract + FunctionCall(new)`, never `AddKey` | — | `vault_is_created_without_any_access_key` |
| 7 | Anyone calls the vault directly | `release` and `new` require `predecessor == registry` | `ERR_ONLY_REGISTRY` | testnet ledger: direct `release` call on a vault |
| 8 | Vault releases more than it holds and breaks storage staking | `release` caps at balance minus storage stake | `ERR_INSUFFICIENT_BALANCE` | code review: `contracts/vault/src/lib.rs` (3.4 KB, no dependencies) |
| 9 | Stranger approves a derivative into someone's lineage | `approve`/`reject`/`revoke` require the parent's **current** owner | `ERR_NOT_PARENT_OWNER` | `stranger_cannot_approve_derivative`, `previous_parent_owner_cannot_approve_after_selling` |
| 10 | Approval sent from a limited (function-call) key, e.g. a compromised dApp key | Owner-sensitive calls require exactly 1 yoctoNEAR, which function-call keys cannot attach | NEP-141 style one-yocto | `approval_requires_full_access_key_signature`, `withdraw_requires_full_access_key_signature` |
| 11 | Studio licenses a derivative whose ancestor forbids commercial use | `buy_license` re-computes clearance across the whole lineage | `ERR_NOT_CLEARED` | `non_commercial_ancestor_blocks_licence` |
| 12 | Licensing a revoked derivative (or anything built on it) | Clearance fails on any revoked node in the chain | `ERR_NOT_CLEARED` | `revoked_derivative_cannot_be_licensed` |
| 13 | Licensing a pending (unapproved) derivative | Clearance requires `Approved` | `ERR_NOT_CLEARED` | `pending_derivative_cannot_be_licensed` |
| 14 | Deriving from a work closed to derivatives, or from an unapproved work | Checked at registration | `ERR_DERIVATIVES_CLOSED`, `ERR_PARENT_NOT_APPROVED` | `cannot_derive_from_closed_work`, `cannot_derive_from_pending_work` |
| 15 | Splits that create or destroy money | Owner + contributor bps must equal exactly 10 000; contributors unique and non-zero | `ERR_BAD_SPLITS`, `ERR_DUPLICATE_CONTRIBUTOR` | `splits_must_total_100_percent`, `splits_over_100_percent_rejected`, `duplicate_contributors_rejected` |
| 16 | Rounding leaks dust or overpays | Integer floor division; each node's remainder goes to its vault; contract asserts `Σ payouts == price` | `ERR_INVARIANT_SUM` | `quote_matches_price_exactly_for_awkward_amounts` |
| 17 | Underpaying for a licence | Attached deposit must cover price + licence storage | `ERR_DEPOSIT` | `underpaying_for_a_licence_fails` |
| 18 | Contributor credit lost when the NFT is sold | Contributor shares are credited to the person (`claimable`), not the vault | — | `buyer_withdraws_income_earned_before_the_sale` |
| 19 | Claim transfer fails and credit disappears | `on_claim` restores the credit on failure | — | `contributor_claims_and_failed_claims_are_restored` |
| 20 | Vault creation fails but the NFT is still minted | `on_vault_created` burns the token, removes the work and refunds | — | `failed_vault_creation_rolls_back_registration` |
| 21 | Squatting the licence token namespace | Work ids may not start with `licence-` | `ERR_BAD_TOKEN_ID` | `licence_namespace_is_reserved` |
| 22 | Swapping an approved file for a different one | No method can change a work's file hash or terms after registration | — | (no setter exists) |
| 23 | Unbounded lineage exhausts gas on payout | Depth capped at 6; contributors capped at 8 | `ERR_TOO_DEEP`, `ERR_TOO_MANY_CONTRIBUTORS` | — |
| 24 | Marketplace sells a work mid-withdrawal via NEP-199 | `nft_transfer_payout` also refuses while locked | `ERR_TOKEN_LOCKED` | `cannot_sell_through_marketplace_mid_withdrawal` |
| 25 | Unapproved account sells the NFT through `nft_transfer_payout` | NEP-178 approval required | `Sender not approved` | `unapproved_marketplace_cannot_sell` |
| 26 | Resale payout leaks or creates money | Integer cascade up the lineage; `Σ payout == balance` asserted; length capped | `ERR_INVARIANT_SUM`, `ERR_PAYOUT_TOO_LONG` | `payout_sums_exactly_for_awkward_amounts`, `payout_respects_max_len` |
| 27 | Royalties paid straight to a vault get stuck because the registry never tracked them | `withdraw` asks the vault to release **everything available**, not a tracked figure | — | testnet ledger: royalty → `ember` vault → withdrawn by its owner |

## What the contracts do not solve

* **Copyright truth.** A registration is the creator's declaration plus a file hash. It is
  evidence, not a copyright registration. Disputes need legal process; the UI says so.
* **Key loss.** If an owner loses their account keys, their vault balance is unreachable
  until they recover the account (e.g. via their wallet's recovery). There is deliberately
  no admin override.
