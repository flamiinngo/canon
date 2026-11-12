//! Canon vault.
//!
//! One vault per work, deployed to `<token_id>.<registry>` with **no access
//! keys** and **no upgrade method**. The only thing it can do is release funds,
//! and only when the registry asks. The registry in turn only asks on behalf of
//! the work's current NFT owner, so control of the money follows the token.

use near_sdk::json_types::U128;
use near_sdk::{env, near, require, AccountId, NearToken, PanicOnDefault, Promise};

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Vault {
    registry: AccountId,
}

#[near]
impl Vault {
    /// Called once by the registry in the same batch that creates the account.
    #[init]
    pub fn new(registry: AccountId) -> Self {
        require!(env::predecessor_account_id() == registry, "ERR_ONLY_REGISTRY");
        Self { registry }
    }

    /// Sends `amount` yoctoNEAR to `to`. Registry only.
    pub fn release(&mut self, to: AccountId, amount: U128) -> Promise {
        require!(env::predecessor_account_id() == self.registry, "ERR_ONLY_REGISTRY");
        require!(amount.0 > 0, "ERR_ZERO_AMOUNT");
        require!(amount.0 <= self.available().0, "ERR_INSUFFICIENT_BALANCE");
        Promise::new(to).transfer(NearToken::from_yoctonear(amount.0))
    }

    /// Balance that can leave the vault without breaking its storage staking.
    pub fn available(&self) -> U128 {
        let locked = env::storage_byte_cost().saturating_mul(env::storage_usage().into());
        U128(env::account_balance().saturating_sub(locked).as_yoctonear())
    }

    pub fn registry(&self) -> AccountId {
        self.registry.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn ctx(predecessor: AccountId, balance: u128) {
        let mut b = VMContextBuilder::new();
        b.current_account_id("ember.canon.testnet".parse().unwrap())
            .predecessor_account_id(predecessor)
            .account_balance(NearToken::from_yoctonear(balance));
        testing_env!(b.build());
    }

    fn registry() -> AccountId {
        "canon.testnet".parse().unwrap()
    }

    #[test]
    fn registry_can_release() {
        ctx(registry(), 10u128.pow(25));
        let mut v = Vault::new(registry());
        let _ = v.release(accounts(1), U128(10u128.pow(24)));
    }

    #[test]
    #[should_panic(expected = "ERR_ONLY_REGISTRY")]
    fn stranger_cannot_release() {
        ctx(registry(), 10u128.pow(25));
        let mut v = Vault::new(registry());
        ctx(accounts(2), 10u128.pow(25));
        let _ = v.release(accounts(2), U128(1));
    }

    #[test]
    #[should_panic(expected = "ERR_ONLY_REGISTRY")]
    fn only_registry_can_initialise() {
        ctx(accounts(2), 10u128.pow(25));
        Vault::new(registry());
    }

    #[test]
    #[should_panic(expected = "ERR_INSUFFICIENT_BALANCE")]
    fn cannot_release_more_than_available() {
        ctx(registry(), 10u128.pow(24));
        let mut v = Vault::new(registry());
        let _ = v.release(accounts(1), U128(10u128.pow(25)));
    }
}
