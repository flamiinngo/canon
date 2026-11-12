//! Canon registry.
//!
//! * Every work is a NEP-171 token whose vault is a keyless sub-account
//!   `<token_id>.<registry>` running the shared Canon vault (NEP-591 global
//!   contract, referenced by code hash so it can never change).
//! * Derivatives join the lineage only when the parent's current owner approves.
//! * `clearance` walks the whole lineage; `buy_license` refuses unless every
//!   ancestor is approved and allows commercial use.
//! * One licence payment is split up the family tree in one transaction:
//!   each node's owner share goes to its vault (follows the NFT), contributor
//!   shares are credited to the people (pull payments via `claim`).
//! * Only the current NFT owner can withdraw from a vault, never while a
//!   withdrawal is in flight or while the token is listed.
//!
//! There is no owner, admin or upgrade method in this contract.

use near_contract_standards::non_fungible_token::approval::NonFungibleTokenApproval;
use near_contract_standards::non_fungible_token::core::{NonFungibleTokenCore, NonFungibleTokenResolver};
use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;
use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, NonFungibleTokenMetadataProvider, TokenMetadata, NFT_METADATA_SPEC,
};
use near_contract_standards::non_fungible_token::{NonFungibleToken, Token, TokenId};
use near_sdk::collections::LazyOption;
use near_sdk::json_types::{Base58CryptoHash, U128};
use near_sdk::serde_json::{self, json};
use near_sdk::store::{IterableSet, LookupMap, Vector};
use near_sdk::{
    assert_one_yocto, env, near, require, AccountId, BorshStorageKey, CryptoHash, Gas, NearToken,
    PanicOnDefault, Promise, PromiseOrValue,
};
use std::collections::HashMap;

pub const BPS: u128 = 10_000;
pub const MAX_CONTRIBUTORS: usize = 8;
pub const MAX_DEPTH: u8 = 6;
pub const MAX_UPSTREAM_BPS: u16 = 5_000;
pub const VAULT_DEPOSIT: NearToken = NearToken::from_millinear(30);
const GAS_VAULT_INIT: Gas = Gas::from_tgas(5);
const GAS_RELEASE: Gas = Gas::from_tgas(10);
const GAS_CALLBACK: Gas = Gas::from_tgas(10);
const LICENCE_PREFIX: &str = "licence-";

#[derive(BorshStorageKey)]
#[near]
enum Key {
    Owners,
    TokenMetadata,
    Enumeration,
    Approvals,
    Metadata,
    Works,
    WorkIds,
    Children,
    Claimable,
    Licences,
    LicencesByWork,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    Pending,
    Approved,
    Rejected,
    Revoked,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Terms {
    pub derivatives: bool,
    pub commercial: bool,
    /// Share of every downstream licence that flows up to this work.
    pub upstream_bps: u16,
    /// Commercial licence price in yoctoNEAR.
    pub price: U128,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Contributor {
    pub account_id: AccountId,
    pub role: String,
    pub bps: u16,
}

#[near(serializers = [borsh])]
#[derive(Clone)]
pub struct Work {
    pub parent: Option<TokenId>,
    pub creator: AccountId,
    pub status: Status,
    pub terms: Terms,
    /// Share of this node's income paid to its vault (follows the NFT).
    pub owner_bps: u16,
    /// Shares credited to people (never move with the NFT).
    pub contributors: Vec<Contributor>,
    pub file_hash: String,
    pub vault_balance: u128,
    pub earned: u128,
    pub locked: bool,
    pub depth: u8,
    pub created_at_ms: u64,
}

#[near(serializers = [json])]
pub struct WorkView {
    pub token_id: TokenId,
    pub title: Option<String>,
    pub description: Option<String>,
    pub media: Option<String>,
    pub owner_id: AccountId,
    pub vault_id: AccountId,
    pub parent: Option<TokenId>,
    pub children: Vec<TokenId>,
    pub creator: AccountId,
    pub status: Status,
    pub terms: Terms,
    pub owner_bps: u16,
    pub contributors: Vec<Contributor>,
    pub file_hash: String,
    pub vault_balance: U128,
    pub earned: U128,
    pub locked: bool,
    pub depth: u8,
    pub created_at_ms: u64,
}

#[near(serializers = [json])]
pub struct Check {
    pub token_id: TokenId,
    pub ok: bool,
    pub reason: String,
}

#[near(serializers = [json])]
pub struct Clearance {
    pub cleared: bool,
    pub checks: Vec<Check>,
}

#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq)]
pub struct Payout {
    pub token_id: TokenId,
    pub account_id: AccountId,
    pub amount: U128,
    /// true → paid into the work's vault; false → credited to the person.
    pub to_vault: bool,
}

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Licence {
    pub id: u64,
    pub licence_token_id: TokenId,
    pub work_id: TokenId,
    pub buyer: AccountId,
    pub use_case: String,
    pub price: U128,
    pub at_ms: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Canon {
    tokens: NonFungibleToken,
    metadata: LazyOption<NFTContractMetadata>,
    vault_code_hash: CryptoHash,
    works: LookupMap<TokenId, Work>,
    work_ids: IterableSet<TokenId>,
    children: LookupMap<TokenId, Vec<TokenId>>,
    claimable: LookupMap<AccountId, u128>,
    licences: Vector<Licence>,
    licences_by_work: LookupMap<TokenId, Vec<u64>>,
}

fn event(name: &str, data: serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        json!({ "standard": "canon", "version": "1.0.0", "event": name, "data": [data] })
    ));
}

fn valid_token_id(id: &str) -> bool {
    let len_ok = (2..=32).contains(&id.len());
    let chars_ok = id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-');
    len_ok && chars_ok && !id.starts_with('-') && !id.ends_with('-') && !id.contains("--") && !id.starts_with(LICENCE_PREFIX)
}

#[near]
impl Canon {
    /// `vault_code_hash` is the hash of the Canon vault deployed as a global contract.
    #[init]
    pub fn new(vault_code_hash: Base58CryptoHash) -> Self {
        let me = env::current_account_id();
        Self {
            tokens: NonFungibleToken::new(Key::Owners, me, Some(Key::TokenMetadata), Some(Key::Enumeration), Some(Key::Approvals)),
            metadata: LazyOption::new(
                Key::Metadata,
                Some(&NFTContractMetadata {
                    spec: NFT_METADATA_SPEC.to_string(),
                    name: "Canon".to_string(),
                    symbol: "CANON".to_string(),
                    icon: None,
                    base_uri: None,
                    reference: None,
                    reference_hash: None,
                }),
            ),
            vault_code_hash: vault_code_hash.into(),
            works: LookupMap::new(Key::Works),
            work_ids: IterableSet::new(Key::WorkIds),
            children: LookupMap::new(Key::Children),
            claimable: LookupMap::new(Key::Claimable),
            licences: Vector::new(Key::Licences),
            licences_by_work: LookupMap::new(Key::LicencesByWork),
        }
    }

    // ───────────────────────────── Registration ─────────────────────────────

    /// Registers an original (no `parent_id`, approved immediately) or submits a
    /// derivative (`parent_id` set, pending until the parent's owner approves).
    /// Attach enough NEAR to cover storage plus the vault deposit; the rest is refunded.
    #[payable]
    #[allow(clippy::too_many_arguments)]
    pub fn register_work(
        &mut self,
        token_id: TokenId,
        title: String,
        description: Option<String>,
        media: Option<String>,
        file_hash: String,
        terms: Terms,
        owner_bps: u16,
        contributors: Vec<Contributor>,
        parent_id: Option<TokenId>,
    ) -> Promise {
        let payer = env::predecessor_account_id();
        require!(valid_token_id(&token_id), "ERR_BAD_TOKEN_ID");
        require!(!self.works.contains_key(&token_id), "ERR_TOKEN_EXISTS");
        require!(!title.trim().is_empty() && title.len() <= 120, "ERR_BAD_TITLE");
        require!(!file_hash.is_empty() && file_hash.len() <= 128, "ERR_BAD_FILE_HASH");
        Self::check_splits(owner_bps, &contributors);
        require!(terms.upstream_bps <= MAX_UPSTREAM_BPS, "ERR_UPSTREAM_TOO_HIGH");
        require!(!terms.commercial || terms.price.0 > 0, "ERR_PRICE_REQUIRED");

        let (status, depth) = match &parent_id {
            None => (Status::Approved, 0),
            Some(p) => {
                let parent = self.works.get(p).unwrap_or_else(|| env::panic_str("ERR_NO_PARENT"));
                require!(parent.status == Status::Approved, "ERR_PARENT_NOT_APPROVED");
                require!(parent.terms.derivatives, "ERR_DERIVATIVES_CLOSED");
                require!(parent.depth < MAX_DEPTH, "ERR_TOO_DEEP");
                (Status::Pending, parent.depth + 1)
            }
        };

        let before = env::storage_usage();
        self.works.insert(
            token_id.clone(),
            Work {
                parent: parent_id.clone(),
                creator: payer.clone(),
                status,
                terms: terms.clone(),
                owner_bps,
                contributors: contributors.clone(),
                file_hash: file_hash.clone(),
                vault_balance: 0,
                earned: 0,
                locked: false,
                depth,
                created_at_ms: env::block_timestamp_ms(),
            },
        );
        self.work_ids.insert(token_id.clone());
        if let Some(p) = &parent_id {
            let mut kids = self.children.get(p).cloned().unwrap_or_default();
            kids.push(token_id.clone());
            self.children.insert(p.clone(), kids);
        }
        self.tokens.internal_mint_with_refund(
            token_id.clone(),
            payer.clone(),
            Some(TokenMetadata {
                title: Some(title),
                description,
                media,
                media_hash: None,
                copies: Some(1),
                issued_at: Some(env::block_timestamp_ms().to_string()),
                expires_at: None,
                starts_at: None,
                updated_at: None,
                extra: Some(json!({ "file_hash": file_hash, "parent": parent_id }).to_string()),
                reference: None,
                reference_hash: None,
            }),
            None,
        );
        self.works.flush();
        self.work_ids.flush();
        self.children.flush();
        let storage = env::storage_byte_cost().saturating_mul((env::storage_usage().saturating_sub(before)).into());
        let required = storage.saturating_add(VAULT_DEPOSIT);
        let attached = env::attached_deposit();
        require!(attached >= required, format!("ERR_DEPOSIT: attach at least {} yoctoNEAR", required.as_yoctonear()));
        let refund = attached.saturating_sub(required);
        if !refund.is_zero() {
            Promise::new(payer.clone()).transfer(refund).detach();
        }

        event(
            if parent_id.is_some() { "submit" } else { "register" },
            json!({ "token_id": token_id, "owner_id": payer, "parent": parent_id, "vault_id": self.vault_id(&token_id) }),
        );

        // Keyless vault: create, fund, point at the global vault code, initialise.
        // No AddKey action is ever issued for this account.
        Promise::new(self.vault_id(&token_id))
            .create_account()
            .transfer(VAULT_DEPOSIT)
            .use_global_contract(self.vault_code_hash)
            .function_call("new".to_string(), vec![], NearToken::from_yoctonear(0), GAS_VAULT_INIT)
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_CALLBACK)
                    .on_vault_created(token_id, payer, U128(required.as_yoctonear())),
            )
    }

    /// Rolls the registration back if the vault could not be created.
    #[private]
    pub fn on_vault_created(&mut self, token_id: TokenId, payer: AccountId, paid: U128) -> bool {
        if env::promise_result_checked(0, 256).is_ok() {
            return true;
        }
        if let Some(work) = self.works.remove(&token_id) {
            self.work_ids.remove(&token_id);
            if let Some(p) = work.parent {
                if let Some(kids) = self.children.get_mut(&p) {
                    kids.retain(|k| k != &token_id);
                }
            }
            self.burn_token(&token_id);
            // The vault deposit came back to this contract when the batch failed.
            Promise::new(payer).transfer(NearToken::from_yoctonear(paid.0)).detach();
        }
        event("register_failed", json!({ "token_id": token_id }));
        false
    }

    // ─────────────────────────── Approval workflow ──────────────────────────

    /// Approves a pending derivative into the canon. Only the parent's current owner.
    #[payable]
    pub fn approve(&mut self, token_id: TokenId) {
        assert_one_yocto();
        self.set_status_as_parent_owner(&token_id, Status::Pending, Status::Approved, "approve");
    }

    /// Rejects a pending derivative. Only the parent's current owner.
    #[payable]
    pub fn reject(&mut self, token_id: TokenId) {
        assert_one_yocto();
        self.set_status_as_parent_owner(&token_id, Status::Pending, Status::Rejected, "reject");
    }

    /// Revokes an approved derivative. Existing licences stay valid; no new ones
    /// can be issued for it or anything built on it. Only the parent's current owner.
    #[payable]
    pub fn revoke(&mut self, token_id: TokenId) {
        assert_one_yocto();
        self.set_status_as_parent_owner(&token_id, Status::Approved, Status::Revoked, "revoke");
    }

    // ───────────────────────────── Licensing ────────────────────────────────

    /// One verdict for the whole lineage, with a reason per generation.
    pub fn clearance(&self, token_id: TokenId) -> Clearance {
        let chain = self.chain(&token_id);
        let mut checks = Vec::with_capacity(chain.len());
        for (i, (id, w)) in chain.iter().enumerate() {
            let (ok, reason) = match w.status {
                Status::Pending => (false, "awaiting approval from the parent's owner".to_string()),
                Status::Rejected => (false, "rejected by the parent's owner".to_string()),
                Status::Revoked => (false, "approval was revoked by the parent's owner".to_string()),
                Status::Approved if !w.terms.commercial => (false, "commercial use is not permitted by this work".to_string()),
                Status::Approved if i > 0 && !w.terms.derivatives => (false, "this work does not permit derivatives".to_string()),
                Status::Approved if i == 0 => (true, "approved; commercial use allowed".to_string()),
                Status::Approved => (true, format!("allows commercial derivatives; takes {} bps upstream", w.terms.upstream_bps)),
            };
            checks.push(Check { token_id: id.clone(), ok, reason });
        }
        Clearance { cleared: checks.iter().all(|c| c.ok), checks }
    }

    /// Exactly who receives what if `token_id` is licensed at its price.
    pub fn quote_license(&self, token_id: TokenId) -> Vec<Payout> {
        let price = self.work(&token_id).terms.price.0;
        self.cascade(&token_id, price)
    }

    /// Buys a commercial licence. Attach the price plus storage (a small surplus is refunded).
    /// Every generation is paid in this one transaction, and the buyer receives a licence NFT.
    #[payable]
    pub fn buy_license(&mut self, token_id: TokenId, use_case: String) -> TokenId {
        let buyer = env::predecessor_account_id();
        require!(!use_case.trim().is_empty() && use_case.len() <= 64, "ERR_BAD_USE_CASE");
        require!(self.clearance(token_id.clone()).cleared, "ERR_NOT_CLEARED");
        let price = self.work(&token_id).terms.price.0;
        require!(price > 0, "ERR_NOT_FOR_SALE");

        let before = env::storage_usage();
        let id = self.licences.len() as u64;
        let licence_token_id = format!("{LICENCE_PREFIX}{id}");
        let licence = Licence {
            id,
            licence_token_id: licence_token_id.clone(),
            work_id: token_id.clone(),
            buyer: buyer.clone(),
            use_case: use_case.clone(),
            price: U128(price),
            at_ms: env::block_timestamp_ms(),
        };
        self.licences.push(licence);
        let mut ids = self.licences_by_work.get(&token_id).cloned().unwrap_or_default();
        ids.push(id);
        self.licences_by_work.insert(token_id.clone(), ids);
        let title = self.tokens.token_metadata_by_id.as_ref().and_then(|m| m.get(&token_id)).and_then(|m| m.title);
        self.tokens.internal_mint_with_refund(
            licence_token_id.clone(),
            buyer.clone(),
            Some(TokenMetadata {
                title: Some(format!("Licence #{id} · {}", title.unwrap_or_else(|| token_id.clone()))),
                description: Some(format!("Perpetual commercial licence for {token_id} ({use_case}). Holder may access the licensed source files.")),
                media: None,
                media_hash: None,
                copies: Some(1),
                issued_at: Some(env::block_timestamp_ms().to_string()),
                expires_at: None,
                starts_at: None,
                updated_at: None,
                extra: Some(json!({ "work_id": token_id, "use_case": use_case, "price": U128(price) }).to_string()),
                reference: None,
                reference_hash: None,
            }),
            None,
        );

        // Split the payment up the lineage.
        let payouts = self.cascade(&token_id, price);
        let total: u128 = payouts.iter().map(|p| p.amount.0).sum();
        require!(total == price, "ERR_INVARIANT_SUM");
        let mut per_node: HashMap<TokenId, u128> = HashMap::new();
        for p in &payouts {
            *per_node.entry(p.token_id.clone()).or_default() += p.amount.0;
            if p.to_vault {
                if let Some(w) = self.works.get_mut(&p.token_id) {
                    w.vault_balance += p.amount.0;
                }
                if p.amount.0 > 0 {
                    Promise::new(p.account_id.clone()).transfer(NearToken::from_yoctonear(p.amount.0)).detach();
                }
            } else {
                let cur = self.claimable.get(&p.account_id).copied().unwrap_or(0);
                self.claimable.insert(p.account_id.clone(), cur + p.amount.0);
            }
        }
        for (node, amount) in per_node {
            if let Some(w) = self.works.get_mut(&node) {
                w.earned += amount;
            }
        }
        self.works.flush();
        self.claimable.flush();
        self.licences.flush();
        self.licences_by_work.flush();

        let storage = env::storage_byte_cost().saturating_mul((env::storage_usage().saturating_sub(before)).into());
        let required = NearToken::from_yoctonear(price).saturating_add(storage);
        let attached = env::attached_deposit();
        require!(attached >= required, format!("ERR_DEPOSIT: attach at least {} yoctoNEAR", required.as_yoctonear()));
        let refund = attached.saturating_sub(required);
        if !refund.is_zero() {
            Promise::new(buyer.clone()).transfer(refund).detach();
        }

        event(
            "license",
            json!({ "token_id": token_id, "licence_token_id": licence_token_id, "buyer": buyer, "price": U128(price), "use_case": use_case, "payouts": payouts }),
        );
        licence_token_id
    }

    // ───────────────────────────── Money out ────────────────────────────────

    /// Moves everything in the work's vault (licence income and NEP-199 resale royalties)
    /// to the work's current NFT owner. The token is locked until the vault has answered,
    /// so it cannot be sold mid-withdrawal.
    #[payable]
    pub fn withdraw(&mut self, token_id: TokenId) -> Promise {
        assert_one_yocto();
        let caller = env::predecessor_account_id();
        let owner = self.tokens.owner_by_id.get(&token_id).unwrap_or_else(|| env::panic_str("ERR_NO_WORK"));
        require!(caller == owner, "ERR_NOT_OWNER");
        let listed = self
            .tokens
            .approvals_by_id
            .as_ref()
            .and_then(|a| a.get(&token_id))
            .map(|m| !m.is_empty())
            .unwrap_or(false);
        let vault_id = self.vault_id(&token_id);
        let work = self.works.get_mut(&token_id).unwrap_or_else(|| env::panic_str("ERR_NO_WORK"));
        require!(!work.locked, "ERR_TOKEN_LOCKED");
        require!(!listed, "ERR_TOKEN_LISTED");
        work.locked = true;
        // u128::MAX asks the vault to release everything it can (see contracts/vault).
        let amount = u128::MAX;

        // The vault takes Borsh args (String to, u128 amount); see contracts/vault.
        let args = near_sdk::borsh::to_vec(&(owner.to_string(), amount)).unwrap_or_else(|_| env::panic_str("ERR_ARGS"));
        Promise::new(vault_id)
            .function_call("release".to_string(), args, NearToken::from_yoctonear(0), GAS_RELEASE)
            .then(Self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_withdraw(token_id, owner, U128(amount)))
    }

    #[private]
    pub fn on_withdraw(&mut self, token_id: TokenId, to: AccountId, amount: U128) -> bool {
        let ok = env::promise_result_checked(0, 256).is_ok();
        let work = self.works.get_mut(&token_id).unwrap_or_else(|| env::panic_str("ERR_NO_WORK"));
        work.locked = false;
        let _ = amount;
        if ok {
            work.vault_balance = 0;
            event("withdraw", json!({ "token_id": token_id, "to": to }));
        } else {
            event("withdraw_failed", json!({ "token_id": token_id, "to": to }));
        }
        ok
    }

    /// Contributors collect the shares credited to them. These never move with an NFT sale.
    pub fn claim(&mut self) -> Promise {
        let who = env::predecessor_account_id();
        let amount = self.claimable.get(&who).copied().unwrap_or(0);
        require!(amount > 0, "ERR_NOTHING_TO_CLAIM");
        self.claimable.insert(who.clone(), 0);
        Promise::new(who.clone())
            .transfer(NearToken::from_yoctonear(amount))
            .then(Self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_claim(who, U128(amount)))
    }

    #[private]
    pub fn on_claim(&mut self, who: AccountId, amount: U128) -> bool {
        if env::promise_result_checked(0, 256).is_ok() {
            event("claim", json!({ "account_id": who, "amount": amount }));
            return true;
        }
        let cur = self.claimable.get(&who).copied().unwrap_or(0);
        self.claimable.insert(who, cur + amount.0);
        false
    }

    // ─────────────────────────────── Views ──────────────────────────────────

    pub fn get_work(&self, token_id: TokenId) -> Option<WorkView> {
        self.works.get(&token_id).map(|w| self.view(&token_id, w))
    }

    pub fn get_works(&self, from_index: Option<u32>, limit: Option<u32>) -> Vec<WorkView> {
        self.work_ids
            .iter()
            .skip(from_index.unwrap_or(0) as usize)
            .take(limit.unwrap_or(50).min(100) as usize)
            .filter_map(|id| self.works.get(id).map(|w| self.view(id, w)))
            .collect()
    }

    pub fn get_claimable(&self, account_id: AccountId) -> U128 {
        U128(self.claimable.get(&account_id).copied().unwrap_or(0))
    }

    pub fn get_licences(&self, work_id: TokenId) -> Vec<Licence> {
        self.licences_by_work
            .get(&work_id)
            .map(|ids| ids.iter().filter_map(|i| self.licences.get(*i as u32).cloned()).collect())
            .unwrap_or_default()
    }

    /// True if `account_id` currently holds any licence NFT for `work_id`.
    pub fn has_licence(&self, account_id: AccountId, work_id: TokenId) -> bool {
        self.get_licences(work_id)
            .iter()
            .any(|l| self.tokens.owner_by_id.get(&l.licence_token_id).as_ref() == Some(&account_id))
    }

    pub fn vault_code_hash(&self) -> Base58CryptoHash {
        self.vault_code_hash.into()
    }

    // ─────────────────────────────── Internal ───────────────────────────────

    fn vault_id(&self, token_id: &TokenId) -> AccountId {
        format!("{token_id}.{}", env::current_account_id()).parse().unwrap_or_else(|_| env::panic_str("ERR_BAD_TOKEN_ID"))
    }

    fn work(&self, token_id: &TokenId) -> &Work {
        self.works.get(token_id).unwrap_or_else(|| env::panic_str("ERR_NO_WORK"))
    }

    /// `[token, parent, grandparent, ...]`
    fn chain(&self, token_id: &TokenId) -> Vec<(TokenId, Work)> {
        let mut out = Vec::new();
        let mut cur = Some(token_id.clone());
        while let Some(id) = cur {
            let w = self.work(&id).clone();
            cur = w.parent.clone();
            out.push((id, w));
            require!(out.len() <= MAX_DEPTH as usize + 1, "ERR_TOO_DEEP");
        }
        out
    }

    /// Integer split of `price` up the lineage. Remainders go to each node's vault,
    /// so the payouts always sum exactly to the price.
    fn cascade(&self, token_id: &TokenId, price: u128) -> Vec<Payout> {
        let chain = self.chain(token_id);
        let mut payouts = Vec::new();
        let mut incoming = price;
        for (i, (id, w)) in chain.iter().enumerate() {
            let upstream = match chain.get(i + 1) {
                Some((_, parent)) => incoming * parent.terms.upstream_bps as u128 / BPS,
                None => 0,
            };
            let kept = incoming - upstream;
            let mut to_people = 0u128;
            for c in &w.contributors {
                let amt = kept * c.bps as u128 / BPS;
                to_people += amt;
                payouts.push(Payout { token_id: id.clone(), account_id: c.account_id.clone(), amount: U128(amt), to_vault: false });
            }
            payouts.push(Payout { token_id: id.clone(), account_id: self.vault_id(id), amount: U128(kept - to_people), to_vault: true });
            incoming = upstream;
        }
        payouts
    }

    fn check_splits(owner_bps: u16, contributors: &[Contributor]) {
        require!(contributors.len() <= MAX_CONTRIBUTORS, "ERR_TOO_MANY_CONTRIBUTORS");
        let mut total = owner_bps as u32;
        let mut seen = std::collections::HashSet::new();
        for c in contributors {
            require!(c.bps > 0, "ERR_BAD_SPLITS");
            require!(c.role.len() <= 40, "ERR_BAD_ROLE");
            require!(seen.insert(c.account_id.clone()), "ERR_DUPLICATE_CONTRIBUTOR");
            total += c.bps as u32;
        }
        require!(total == BPS as u32, "ERR_BAD_SPLITS");
    }

    fn set_status_as_parent_owner(&mut self, token_id: &TokenId, from: Status, to: Status, name: &str) {
        let caller = env::predecessor_account_id();
        let parent_id = self.work(token_id).parent.clone().unwrap_or_else(|| env::panic_str("ERR_NOT_A_DERIVATIVE"));
        let parent_owner = self.tokens.owner_by_id.get(&parent_id).unwrap_or_else(|| env::panic_str("ERR_NO_PARENT"));
        require!(caller == parent_owner, "ERR_NOT_PARENT_OWNER");
        let w = self.works.get_mut(token_id).unwrap();
        require!(w.status == from, "ERR_WRONG_STATUS");
        w.status = to;
        event(name, json!({ "token_id": token_id, "parent": parent_id, "by": caller }));
    }

    fn assert_not_locked(&self, token_id: &TokenId) {
        if let Some(w) = self.works.get(token_id) {
            require!(!w.locked, "ERR_TOKEN_LOCKED");
        }
    }

    fn burn_token(&mut self, token_id: &TokenId) {
        if let Some(owner) = self.tokens.owner_by_id.remove(token_id) {
            if let Some(per_owner) = self.tokens.tokens_per_owner.as_mut() {
                if let Some(mut set) = per_owner.get(&owner) {
                    set.remove(token_id);
                    if set.is_empty() {
                        per_owner.remove(&owner);
                    } else {
                        per_owner.insert(&owner, &set);
                    }
                }
            }
        }
        if let Some(meta) = self.tokens.token_metadata_by_id.as_mut() {
            meta.remove(token_id);
        }
    }

    fn view(&self, token_id: &TokenId, w: &Work) -> WorkView {
        let meta = self.tokens.token_metadata_by_id.as_ref().and_then(|m| m.get(token_id));
        WorkView {
            token_id: token_id.clone(),
            title: meta.as_ref().and_then(|m| m.title.clone()),
            description: meta.as_ref().and_then(|m| m.description.clone()),
            media: meta.as_ref().and_then(|m| m.media.clone()),
            owner_id: self.tokens.owner_by_id.get(token_id).unwrap_or_else(|| env::current_account_id()),
            vault_id: self.vault_id(token_id),
            parent: w.parent.clone(),
            children: self.children.get(token_id).cloned().unwrap_or_default(),
            creator: w.creator.clone(),
            status: w.status,
            terms: w.terms.clone(),
            owner_bps: w.owner_bps,
            contributors: w.contributors.clone(),
            file_hash: w.file_hash.clone(),
            vault_balance: U128(w.vault_balance),
            earned: U128(w.earned),
            locked: w.locked,
            depth: w.depth,
            created_at_ms: w.created_at_ms,
        }
    }
}

// ─────────────────────────────── NEP-199 ───────────────────────────────

pub const MAX_PAYOUT_LEN: u32 = 10;

/// NEP-199 payout: who a marketplace must pay when this token sells for `balance`.
#[near(serializers = [json])]
#[derive(Debug, PartialEq)]
pub struct NepPayout {
    pub payout: HashMap<AccountId, U128>,
}

impl Canon {
    /// Resale royalties follow the lineage: each ancestor takes its `upstream_bps` of what
    /// reaches it and the remainder lands in that ancestor's vault. The seller keeps the rest.
    /// Licence NFTs pay 100% to their seller.
    fn compute_payout(&self, token_id: &TokenId, balance: u128, max_len_payout: Option<u32>) -> NepPayout {
        let seller = self.tokens.owner_by_id.get(token_id).unwrap_or_else(|| env::panic_str("ERR_NO_TOKEN"));
        let mut payout: HashMap<AccountId, U128> = HashMap::new();
        let mut add = |acc: AccountId, amt: u128| {
            if amt > 0 {
                let cur = payout.get(&acc).map(|v| v.0).unwrap_or(0);
                payout.insert(acc, U128(cur + amt));
            }
        };
        if !self.works.contains_key(token_id) {
            add(seller, balance);
        } else {
            let chain = self.chain(token_id);
            let mut incoming = balance;
            for (i, (id, _)) in chain.iter().enumerate() {
                let upstream = match chain.get(i + 1) {
                    Some((_, parent)) => incoming * parent.terms.upstream_bps as u128 / BPS,
                    None => 0,
                };
                let kept = incoming - upstream;
                let to = if i == 0 { seller.clone() } else { self.vault_id(id) };
                add(to, kept);
                incoming = upstream;
            }
        }
        let max = max_len_payout.unwrap_or(MAX_PAYOUT_LEN).min(MAX_PAYOUT_LEN);
        require!(payout.len() as u32 <= max, "ERR_PAYOUT_TOO_LONG");
        let total: u128 = payout.values().map(|v| v.0).sum();
        require!(total == balance, "ERR_INVARIANT_SUM");
        NepPayout { payout }
    }
}

#[near]
impl Canon {
    /// NEP-199: payout for a sale of `token_id` at `balance` yoctoNEAR.
    pub fn nft_payout(&self, token_id: TokenId, balance: U128, max_len_payout: Option<u32>) -> NepPayout {
        self.compute_payout(&token_id, balance.0, max_len_payout)
    }

    /// NEP-199: transfer (by the owner or an approved marketplace) and return the payout
    /// the marketplace must honour. Refused while a withdrawal is in flight.
    #[payable]
    pub fn nft_transfer_payout(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
        balance: U128,
        max_len_payout: Option<u32>,
    ) -> NepPayout {
        assert_one_yocto();
        self.assert_not_locked(&token_id);
        let payout = self.compute_payout(&token_id, balance.0, max_len_payout);
        let sender = env::predecessor_account_id();
        self.tokens.internal_transfer(&sender, &receiver_id, &token_id, approval_id, memo);
        event("sale", json!({ "token_id": token_id, "to": receiver_id, "balance": balance, "payout": payout.payout }));
        payout
    }
}

// ─────────────────────────── NEP-171 / 177 / 178 / 181 ───────────────────────────

#[near]
impl NonFungibleTokenCore for Canon {
    #[payable]
    fn nft_transfer(&mut self, receiver_id: AccountId, token_id: TokenId, approval_id: Option<u64>, memo: Option<String>) {
        self.assert_not_locked(&token_id);
        self.tokens.nft_transfer(receiver_id, token_id, approval_id, memo)
    }

    #[payable]
    fn nft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<bool> {
        self.assert_not_locked(&token_id);
        self.tokens.nft_transfer_call(receiver_id, token_id, approval_id, memo, msg)
    }

    fn nft_token(&self, token_id: TokenId) -> Option<Token> {
        self.tokens.nft_token(token_id)
    }
}

#[near]
impl NonFungibleTokenResolver for Canon {
    #[private]
    fn nft_resolve_transfer(
        &mut self,
        previous_owner_id: AccountId,
        receiver_id: AccountId,
        token_id: TokenId,
        approved_account_ids: Option<HashMap<AccountId, u64>>,
    ) -> bool {
        self.tokens.nft_resolve_transfer(previous_owner_id, receiver_id, token_id, approved_account_ids)
    }
}

#[near]
impl NonFungibleTokenApproval for Canon {
    #[payable]
    fn nft_approve(&mut self, token_id: TokenId, account_id: AccountId, msg: Option<String>) -> Option<Promise> {
        self.assert_not_locked(&token_id);
        self.tokens.nft_approve(token_id, account_id, msg)
    }

    #[payable]
    fn nft_revoke(&mut self, token_id: TokenId, account_id: AccountId) {
        self.tokens.nft_revoke(token_id, account_id)
    }

    #[payable]
    fn nft_revoke_all(&mut self, token_id: TokenId) {
        self.tokens.nft_revoke_all(token_id)
    }

    fn nft_is_approved(&self, token_id: TokenId, approved_account_id: AccountId, approval_id: Option<u64>) -> bool {
        self.tokens.nft_is_approved(token_id, approved_account_id, approval_id)
    }
}

#[near]
impl NonFungibleTokenEnumeration for Canon {
    fn nft_total_supply(&self) -> U128 {
        self.tokens.nft_total_supply()
    }

    fn nft_tokens(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        self.tokens.nft_tokens(from_index, limit)
    }

    fn nft_supply_for_owner(&self, account_id: AccountId) -> U128 {
        self.tokens.nft_supply_for_owner(account_id)
    }

    fn nft_tokens_for_owner(&self, account_id: AccountId, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        self.tokens.nft_tokens_for_owner(account_id, from_index, limit)
    }
}

#[near]
impl NonFungibleTokenMetadataProvider for Canon {
    fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }
}

#[cfg(test)]
mod tests;
