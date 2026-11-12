//! Unit tests. Each attack listed on the Proof page has a test here.

use super::*;
use near_sdk::test_utils::{get_created_receipts, get_logs, VMContextBuilder};
use near_sdk::{testing_env, PromiseResult, RuntimeFeesConfig};

const NEAR: u128 = 1_000_000_000_000_000_000_000_000;
const DEP: u128 = NEAR; // generous registration deposit; surplus is refunded

fn acc(s: &str) -> AccountId {
    s.parse().unwrap()
}

fn ctx(pred: &str, deposit: u128) {
    let mut b = VMContextBuilder::new();
    b.current_account_id(acc("canon.testnet"))
        .predecessor_account_id(acc(pred))
        .signer_account_id(acc(pred))
        .attached_deposit(NearToken::from_yoctonear(deposit))
        .account_balance(NearToken::from_near(10_000));
    testing_env!(b.build());
}

fn callback(result: PromiseResult) {
    let mut b = VMContextBuilder::new();
    b.current_account_id(acc("canon.testnet"))
        .predecessor_account_id(acc("canon.testnet"))
        .account_balance(NearToken::from_near(10_000));
    testing_env!(b.build(), near_sdk::test_vm_config(), RuntimeFeesConfig::test(), Default::default(), vec![result]);
}

fn terms(derivatives: bool, commercial: bool, upstream_bps: u16, price_near: u128) -> Terms {
    Terms { derivatives, commercial, upstream_bps, price: U128(price_near * NEAR) }
}

fn c(account: &str, role: &str, bps: u16) -> Contributor {
    Contributor { account_id: acc(account), role: role.to_string(), bps }
}

fn contract() -> Canon {
    ctx("deployer.testnet", 0);
    Canon::new(Base58CryptoHash::from([7u8; 32]))
}

fn register(k: &mut Canon, who: &str, id: &str, parent: Option<&str>, t: Terms, owner_bps: u16, contributors: Vec<Contributor>) {
    ctx(who, DEP);
    let _ = k.register_work(id.into(), id.into(), None, None, format!("sha256:{id}"), t, owner_bps, contributors, parent.map(String::from));
}

fn approve(k: &mut Canon, who: &str, id: &str) {
    ctx(who, 1);
    k.approve(id.into());
}

/// The Ember Field family used across the UI: ember ← relief ← motion.
fn ember_family() -> Canon {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 7000, vec![c("cy.testnet", "Materials", 3000)]);
    approve(&mut k, "ada.testnet", "ember-relief");
    register(&mut k, "dee.testnet", "ember-motion", Some("ember-relief"), terms(false, true, 0, 150), 8000, vec![c("fay.testnet", "Score", 2000)]);
    approve(&mut k, "ben.testnet", "ember-motion");
    k
}

fn buy(k: &mut Canon, who: &str, id: &str) -> TokenId {
    let price = k.get_work(id.into()).unwrap().terms.price.0;
    ctx(who, price + NEAR / 10);
    k.buy_license(id.into(), "games".into())
}

fn transfer(k: &mut Canon, from: &str, to: &str, id: &str) {
    ctx(from, 1);
    k.nft_transfer(acc(to), id.into(), None, None);
}

// ───────────────────────────── Registration ─────────────────────────────

#[test]
fn original_is_approved_and_owned_by_creator() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    let w = k.get_work("ember".into()).unwrap();
    assert_eq!(w.status, Status::Approved);
    assert_eq!(w.owner_id, acc("ada.testnet"));
    assert_eq!(w.vault_id, acc("ember.canon.testnet"));
}

#[test]
fn vault_is_created_without_any_access_key() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    let receipts = get_created_receipts();
    let vault = receipts.iter().find(|r| r.receiver_id == acc("ember.canon.testnet")).expect("vault receipt");
    let dbg = format!("{:?}", vault.actions);
    assert!(dbg.contains("CreateAccount"), "{dbg}");
    assert!(!dbg.contains("AddKey"), "vault must never receive an access key: {dbg}");
}

#[test]
#[should_panic(expected = "ERR_BAD_SPLITS")]
fn splits_must_total_100_percent() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 9_000, vec![]);
}

#[test]
#[should_panic(expected = "ERR_BAD_SPLITS")]
fn splits_over_100_percent_rejected() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 9_000, vec![c("cy.testnet", "x", 2_000)]);
}

#[test]
#[should_panic(expected = "ERR_DUPLICATE_CONTRIBUTOR")]
fn duplicate_contributors_rejected() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 8_000, vec![c("cy.testnet", "x", 1_000), c("cy.testnet", "y", 1_000)]);
}

#[test]
#[should_panic(expected = "ERR_TOKEN_EXISTS")]
fn token_ids_are_unique() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "eve.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
}

#[test]
#[should_panic(expected = "ERR_BAD_TOKEN_ID")]
fn licence_namespace_is_reserved() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "licence-0", None, terms(true, true, 2000, 40), 10_000, vec![]);
}

#[test]
#[should_panic(expected = "ERR_DEPOSIT")]
fn registration_requires_storage_and_vault_deposit() {
    let mut k = contract();
    ctx("ada.testnet", 1);
    let _ = k.register_work("ember".into(), "Ember".into(), None, None, "sha256:x".into(), terms(true, true, 2000, 40), 10_000, vec![], None);
}

#[test]
fn failed_vault_creation_rolls_back_registration() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    callback(PromiseResult::Failed);
    assert!(!k.on_vault_created("ember".into(), acc("ada.testnet"), U128(NEAR / 10)));
    assert!(k.get_work("ember".into()).is_none());
    assert!(k.nft_token("ember".into()).is_none());
}

// ─────────────────────────── Approval workflow ──────────────────────────

#[test]
fn derivative_is_pending_until_parent_owner_approves() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    assert_eq!(k.get_work("ember-relief".into()).unwrap().status, Status::Pending);
    approve(&mut k, "ada.testnet", "ember-relief");
    assert_eq!(k.get_work("ember-relief".into()).unwrap().status, Status::Approved);
    assert_eq!(k.get_work("ember".into()).unwrap().children, vec!["ember-relief".to_string()]);
}

#[test]
#[should_panic(expected = "ERR_NOT_PARENT_OWNER")]
fn stranger_cannot_approve_derivative() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    approve(&mut k, "ben.testnet", "ember-relief");
}

#[test]
#[should_panic(expected = "ERR_NOT_PARENT_OWNER")]
fn previous_parent_owner_cannot_approve_after_selling() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    transfer(&mut k, "ada.testnet", "eve.testnet", "ember");
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    approve(&mut k, "ada.testnet", "ember-relief");
}

#[test]
#[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
fn approval_requires_full_access_key_signature() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    ctx("ada.testnet", 0);
    k.approve("ember-relief".into());
}

#[test]
#[should_panic(expected = "ERR_DERIVATIVES_CLOSED")]
fn cannot_derive_from_closed_work() {
    let mut k = contract();
    register(&mut k, "kai.testnet", "quarry", None, terms(false, true, 0, 80), 10_000, vec![]);
    register(&mut k, "ben.testnet", "quarry-remix", Some("quarry"), terms(true, true, 0, 10), 10_000, vec![]);
}

#[test]
#[should_panic(expected = "ERR_PARENT_NOT_APPROVED")]
fn cannot_derive_from_pending_work() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    register(&mut k, "dee.testnet", "ember-motion", Some("ember-relief"), terms(false, true, 0, 150), 10_000, vec![]);
}

// ───────────────────────────── Clearance ────────────────────────────────

#[test]
fn full_lineage_clears() {
    let k = ember_family();
    let c = k.clearance("ember-motion".into());
    assert!(c.cleared);
    assert_eq!(c.checks.len(), 3);
}

#[test]
#[should_panic(expected = "ERR_NOT_CLEARED")]
fn non_commercial_ancestor_blocks_licence() {
    let mut k = contract();
    register(&mut k, "ivy.testnet", "moth-light", None, terms(true, false, 0, 0), 10_000, vec![]);
    register(&mut k, "jun.testnet", "moth-fragments", Some("moth-light"), terms(false, true, 0, 20), 10_000, vec![]);
    approve(&mut k, "ivy.testnet", "moth-fragments");
    assert!(!k.clearance("moth-fragments".into()).cleared);
    buy(&mut k, "studio.testnet", "moth-fragments");
}

#[test]
#[should_panic(expected = "ERR_NOT_CLEARED")]
fn revoked_derivative_cannot_be_licensed() {
    let mut k = ember_family();
    ctx("ada.testnet", 1);
    k.revoke("ember-relief".into());
    // The revocation also blocks everything built on the revoked work.
    buy(&mut k, "studio.testnet", "ember-motion");
}

#[test]
#[should_panic(expected = "ERR_NOT_CLEARED")]
fn pending_derivative_cannot_be_licensed() {
    let mut k = contract();
    register(&mut k, "ada.testnet", "ember", None, terms(true, true, 2000, 40), 10_000, vec![]);
    register(&mut k, "ben.testnet", "ember-relief", Some("ember"), terms(true, true, 2500, 100), 10_000, vec![]);
    buy(&mut k, "studio.testnet", "ember-relief");
}

// ───────────────────────────── Licensing ────────────────────────────────

#[test]
fn licence_payment_splits_up_the_family_tree() {
    let mut k = ember_family();
    let licence = buy(&mut k, "studio.testnet", "ember-motion");
    assert_eq!(licence, "licence-0");

    // Same numbers the UI shows for a 150 NEAR licence.
    let near = |n: u128, d: u128| n * NEAR / d;
    assert_eq!(k.get_work("ember-motion".into()).unwrap().vault_balance.0, near(90, 1));
    assert_eq!(k.get_claimable(acc("fay.testnet")).0, near(225, 10));
    assert_eq!(k.get_work("ember-relief".into()).unwrap().vault_balance.0, near(21, 1));
    assert_eq!(k.get_claimable(acc("cy.testnet")).0, near(9, 1));
    assert_eq!(k.get_work("ember".into()).unwrap().vault_balance.0, near(75, 10));

    // The studio now holds a licence NFT.
    assert_eq!(k.nft_token(licence).unwrap().owner_id, acc("studio.testnet"));
    assert!(k.has_licence(acc("studio.testnet"), "ember-motion".into()));
    assert!(get_logs().iter().any(|l| l.contains("\"event\":\"license\"")));
}

#[test]
fn quote_matches_price_exactly_for_awkward_amounts() {
    let k = ember_family();
    for price in [1u128, 7, 99, 10_001, 333_333_333, 150 * NEAR + 1, 7 * NEAR / 3] {
        let total: u128 = k.cascade(&"ember-motion".to_string(), price).iter().map(|p| p.amount.0).sum();
        assert_eq!(total, price, "price {price}");
    }
}

#[test]
#[should_panic(expected = "ERR_DEPOSIT")]
fn underpaying_for_a_licence_fails() {
    let mut k = ember_family();
    ctx("studio.testnet", 149 * NEAR);
    k.buy_license("ember-motion".into(), "games".into());
}

#[test]
fn licence_can_be_resold_and_access_follows_the_holder() {
    let mut k = ember_family();
    let licence = buy(&mut k, "studio.testnet", "ember-motion");
    transfer(&mut k, "studio.testnet", "studio2.testnet", &licence);
    assert!(!k.has_licence(acc("studio.testnet"), "ember-motion".into()));
    assert!(k.has_licence(acc("studio2.testnet"), "ember-motion".into()));
}

// ───────────────────────────── Withdrawals ──────────────────────────────

#[test]
#[should_panic(expected = "ERR_NOT_OWNER")]
fn stranger_cannot_withdraw() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("eve.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
}

#[test]
#[should_panic(expected = "ERR_NOT_OWNER")]
fn seller_cannot_withdraw_after_the_sale() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    transfer(&mut k, "ben.testnet", "eve.testnet", "ember-relief");
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
}

#[test]
fn buyer_withdraws_income_earned_before_the_sale() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    transfer(&mut k, "ben.testnet", "eve.testnet", "ember-relief");
    ctx("eve.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
    assert!(k.get_work("ember-relief".into()).unwrap().locked);
    callback(PromiseResult::Successful(vec![]));
    assert!(k.on_withdraw("ember-relief".into(), acc("eve.testnet"), U128(21 * NEAR)));
    let w = k.get_work("ember-relief".into()).unwrap();
    assert_eq!(w.vault_balance.0, 0);
    assert!(!w.locked);
    // The contributor's credit never moved with the sale.
    assert_eq!(k.get_claimable(acc("cy.testnet")).0, 9 * NEAR);
}

#[test]
#[should_panic(expected = "ERR_TOKEN_LOCKED")]
fn cannot_sell_while_a_withdrawal_is_in_flight() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
    transfer(&mut k, "ben.testnet", "eve.testnet", "ember-relief");
}

#[test]
#[should_panic(expected = "ERR_TOKEN_LOCKED")]
fn cannot_withdraw_twice_concurrently() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
}

#[test]
fn failed_withdrawal_unlocks_and_keeps_the_balance() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
    callback(PromiseResult::Failed);
    assert!(!k.on_withdraw("ember-relief".into(), acc("ben.testnet"), U128(21 * NEAR)));
    let w = k.get_work("ember-relief".into()).unwrap();
    assert!(!w.locked);
    assert_eq!(w.vault_balance.0, 21 * NEAR);
}

#[test]
#[should_panic(expected = "ERR_TOKEN_LISTED")]
fn cannot_drain_vault_while_listed_for_sale() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("ben.testnet", NEAR / 100);
    k.nft_approve("ember-relief".into(), acc("market.testnet"), None);
    ctx("ben.testnet", 1);
    let _ = k.withdraw("ember-relief".into());
}

#[test]
#[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
fn withdraw_requires_full_access_key_signature() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("ben.testnet", 0);
    let _ = k.withdraw("ember-relief".into());
}

// ───────────────────────────── Claims ───────────────────────────────────

#[test]
fn contributor_claims_and_failed_claims_are_restored() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("cy.testnet", 0);
    let _ = k.claim();
    assert_eq!(k.get_claimable(acc("cy.testnet")).0, 0);
    callback(PromiseResult::Failed);
    k.on_claim(acc("cy.testnet"), U128(9 * NEAR));
    assert_eq!(k.get_claimable(acc("cy.testnet")).0, 9 * NEAR);
}

#[test]
#[should_panic(expected = "ERR_NOTHING_TO_CLAIM")]
fn cannot_claim_what_you_are_not_owed() {
    let mut k = ember_family();
    ctx("eve.testnet", 0);
    let _ = k.claim();
}

// ───────────────────────── NEP-199 resale royalties ─────────────────────────

fn payout_of(p: &NepPayout, who: &str) -> u128 {
    p.payout.get(&acc(who)).map(|v| v.0).unwrap_or(0)
}

#[test]
fn resale_royalties_flow_up_the_lineage() {
    let k = ember_family();
    // dee sells Motion for 10 NEAR: 25% to Relief's lineage, of which 20% goes on to Ember.
    let p = k.nft_payout("ember-motion".into(), U128(10 * NEAR), None);
    assert_eq!(payout_of(&p, "dee.testnet"), 75 * NEAR / 10); // seller keeps 7.5
    assert_eq!(payout_of(&p, "ember-relief.canon.testnet"), 2 * NEAR); // relief vault 2.0
    assert_eq!(payout_of(&p, "ember.canon.testnet"), NEAR / 2); // ember vault 0.5
    let total: u128 = p.payout.values().map(|v| v.0).sum();
    assert_eq!(total, 10 * NEAR);
}

#[test]
fn original_resale_pays_the_seller_in_full() {
    let k = ember_family();
    let p = k.nft_payout("ember".into(), U128(3 * NEAR), None);
    assert_eq!(p.payout.len(), 1);
    assert_eq!(payout_of(&p, "ada.testnet"), 3 * NEAR);
}

#[test]
fn payout_sums_exactly_for_awkward_amounts() {
    let k = ember_family();
    for b in [1u128, 3, 99, 10_007, 7 * NEAR / 3, 123_456_789_012_345] {
        let p = k.nft_payout("ember-motion".into(), U128(b), None);
        assert_eq!(p.payout.values().map(|v| v.0).sum::<u128>(), b, "balance {b}");
    }
}

#[test]
#[should_panic(expected = "ERR_PAYOUT_TOO_LONG")]
fn payout_respects_max_len() {
    let k = ember_family();
    k.nft_payout("ember-motion".into(), U128(NEAR), Some(2));
}

#[test]
fn marketplace_sale_transfers_and_returns_payout() {
    let mut k = ember_family();
    ctx("dee.testnet", NEAR / 100);
    k.nft_approve("ember-motion".into(), acc("market.testnet"), None);
    ctx("market.testnet", 1);
    let p = k.nft_transfer_payout(acc("eve.testnet"), "ember-motion".into(), None, None, U128(4 * NEAR), None);
    assert_eq!(k.nft_token("ember-motion".into()).unwrap().owner_id, acc("eve.testnet"));
    assert_eq!(payout_of(&p, "dee.testnet"), 3 * NEAR);
    assert!(get_logs().iter().any(|l| l.contains("\"event\":\"sale\"")));
}

#[test]
#[should_panic(expected = "Sender not approved")]
fn unapproved_marketplace_cannot_sell() {
    let mut k = ember_family();
    ctx("market.testnet", 1);
    k.nft_transfer_payout(acc("eve.testnet"), "ember-motion".into(), None, None, U128(NEAR), None);
}

#[test]
#[should_panic(expected = "ERR_TOKEN_LOCKED")]
fn cannot_sell_through_marketplace_mid_withdrawal() {
    let mut k = ember_family();
    buy(&mut k, "studio.testnet", "ember-motion");
    ctx("dee.testnet", NEAR / 100);
    k.nft_approve("ember-motion".into(), acc("market.testnet"), None);
    ctx("dee.testnet", 1);
    k.nft_revoke_all("ember-motion".into());
    ctx("dee.testnet", 1);
    let _ = k.withdraw("ember-motion".into());
    ctx("dee.testnet", 1);
    k.nft_transfer_payout(acc("eve.testnet"), "ember-motion".into(), None, None, U128(NEAR), None);
}

#[test]
fn licence_resale_pays_the_holder_in_full() {
    let mut k = ember_family();
    let licence = buy(&mut k, "studio.testnet", "ember-motion");
    let p = k.nft_payout(licence, U128(2 * NEAR), None);
    assert_eq!(p.payout.len(), 1);
    assert_eq!(payout_of(&p, "studio.testnet"), 2 * NEAR);
}
