//! Canon vault: one per work, deployed to `<token_id>.<registry>` with **no
//! access keys** and **no upgrade method**.
//!
//! It is deliberately tiny (`no_std`, no allocator, no JSON) so it can be
//! published once as an immutable NEP-591 global contract and shared by every
//! vault for a few KB of storage.
//!
//! * `new()`: records the caller as the registry. The registry calls it in the
//!   same batch that creates the account, so nobody else can get in first.
//! * `release(to, amount)`: registry only. Borsh args `(String, u128)`. Sends
//!   `amount` yoctoNEAR to `to` and returns that transfer as its result, so the
//!   registry's callback sees whether it succeeded.
//! * `available()` / `registry()`: views for anyone to verify the vault.
#![no_std]

#[cfg(target_arch = "wasm32")]
mod wasm {
    /// NEAR host functions used by the vault (imported from the `env` module).
    mod sys {
        extern "C" {
            pub fn read_register(register_id: u64, ptr: u64);
            pub fn register_len(register_id: u64) -> u64;
            pub fn predecessor_account_id(register_id: u64);
            pub fn input(register_id: u64);
            pub fn storage_usage() -> u64;
            pub fn account_balance(balance_ptr: u64);
            pub fn value_return(value_len: u64, value_ptr: u64);
            pub fn panic_utf8(len: u64, ptr: u64) -> !;
            pub fn promise_batch_create(account_id_len: u64, account_id_ptr: u64) -> u64;
            pub fn promise_batch_action_transfer(promise_index: u64, amount_ptr: u64);
            pub fn promise_return(promise_id: u64);
            pub fn storage_write(key_len: u64, key_ptr: u64, value_len: u64, value_ptr: u64, register_id: u64) -> u64;
            pub fn storage_read(key_len: u64, key_ptr: u64, register_id: u64) -> u64;
            pub fn storage_has_key(key_len: u64, key_ptr: u64) -> u64;
        }
    }

    const REGISTRY_KEY: &[u8] = b"r";
    /// NEAR storage staking cost per byte (10^19 yoctoNEAR).
    const BYTE_COST: u128 = 10_000_000_000_000_000_000;
    const MAX_ACCOUNT_LEN: usize = 64;

    #[panic_handler]
    fn panic(_: &core::panic::PanicInfo) -> ! {
        core::arch::wasm32::unreachable()
    }

    fn fail(msg: &str) -> ! {
        unsafe { sys::panic_utf8(msg.len() as u64, msg.as_ptr() as u64) }
    }

    /// Reads register 0 into `buf`, returning the length.
    fn read0(buf: &mut [u8]) -> usize {
        let len = unsafe { sys::register_len(0) } as usize;
        if len > buf.len() {
            fail("ERR_INPUT_TOO_LONG");
        }
        unsafe { sys::read_register(0, buf.as_mut_ptr() as u64) };
        len
    }

    fn predecessor(buf: &mut [u8; MAX_ACCOUNT_LEN]) -> usize {
        unsafe { sys::predecessor_account_id(0) };
        read0(buf)
    }

    fn registry(buf: &mut [u8; MAX_ACCOUNT_LEN]) -> usize {
        if unsafe { sys::storage_read(REGISTRY_KEY.len() as u64, REGISTRY_KEY.as_ptr() as u64, 0) } == 0 {
            fail("ERR_NOT_INITIALIZED");
        }
        read0(buf)
    }

    fn available() -> u128 {
        let mut bal = [0u8; 16];
        unsafe { sys::account_balance(bal.as_mut_ptr() as u64) };
        let balance = u128::from_le_bytes(bal);
        let locked = (unsafe { sys::storage_usage() } as u128).saturating_mul(BYTE_COST);
        balance.saturating_sub(locked)
    }

    /// Writes `n` as a JSON string (`"123"`) into `out`, returning the length.
    fn json_u128(mut n: u128, out: &mut [u8; 42]) -> usize {
        let mut digits = [0u8; 40];
        let mut i = digits.len();
        loop {
            i -= 1;
            digits[i] = b'0' + (n % 10) as u8;
            n /= 10;
            if n == 0 {
                break;
            }
        }
        let d = &digits[i..];
        out[0] = b'"';
        out[1..=d.len()].copy_from_slice(d);
        out[d.len() + 1] = b'"';
        d.len() + 2
    }

    #[no_mangle]
    pub extern "C" fn new() {
        if unsafe { sys::storage_has_key(REGISTRY_KEY.len() as u64, REGISTRY_KEY.as_ptr() as u64) } == 1 {
            fail("ERR_ALREADY_INITIALIZED");
        }
        let mut who = [0u8; MAX_ACCOUNT_LEN];
        let n = predecessor(&mut who);
        unsafe { sys::storage_write(REGISTRY_KEY.len() as u64, REGISTRY_KEY.as_ptr() as u64, n as u64, who.as_ptr() as u64, 1) };
    }

    #[no_mangle]
    pub extern "C" fn release() {
        // 1. Only the registry.
        let mut reg = [0u8; MAX_ACCOUNT_LEN];
        let rl = registry(&mut reg);
        let mut who = [0u8; MAX_ACCOUNT_LEN];
        let wl = predecessor(&mut who);
        if rl != wl || reg[..rl] != who[..wl] {
            fail("ERR_ONLY_REGISTRY");
        }
        // 2. Borsh (String to, u128 amount).
        let mut args = [0u8; 4 + MAX_ACCOUNT_LEN + 16];
        unsafe { sys::input(0) };
        let n = read0(&mut args);
        if n < 4 {
            fail("ERR_BAD_ARGS");
        }
        let to_len = u32::from_le_bytes([args[0], args[1], args[2], args[3]]) as usize;
        if to_len == 0 || to_len > MAX_ACCOUNT_LEN || n != 4 + to_len + 16 {
            fail("ERR_BAD_ARGS");
        }
        let mut amt = [0u8; 16];
        amt.copy_from_slice(&args[4 + to_len..4 + to_len + 16]);
        let amount = u128::from_le_bytes(amt);
        // 3. Never break storage staking.
        if amount == 0 {
            fail("ERR_ZERO_AMOUNT");
        }
        if amount > available() {
            fail("ERR_INSUFFICIENT_BALANCE");
        }
        // 4. Pay and hand the transfer's result back to the registry.
        unsafe {
            let p = sys::promise_batch_create(to_len as u64, args[4..].as_ptr() as u64);
            sys::promise_batch_action_transfer(p, amt.as_ptr() as u64);
            sys::promise_return(p);
        }
    }

    #[no_mangle]
    pub extern "C" fn available_balance() {
        let mut out = [0u8; 42];
        let n = json_u128(available(), &mut out);
        unsafe { sys::value_return(n as u64, out.as_ptr() as u64) };
    }

    #[no_mangle]
    pub extern "C" fn registry_id() {
        let mut reg = [0u8; MAX_ACCOUNT_LEN];
        let n = registry(&mut reg);
        let mut out = [0u8; MAX_ACCOUNT_LEN + 2];
        out[0] = b'"';
        out[1..=n].copy_from_slice(&reg[..n]);
        out[n + 1] = b'"';
        unsafe { sys::value_return((n + 2) as u64, out.as_ptr() as u64) };
    }
}
