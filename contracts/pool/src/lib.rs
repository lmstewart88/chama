#![no_std]
//! Chama pool: a USDC pool that releases money only when a separate verifier signs,
//! lets the recipient (the SME) pay only approved suppliers inside per-category caps,
//! and refunds contributors pro rata if a milestone is rejected.
//! Interface source of truth: docs/INTERFACE.md. Do not change signatures without agreeing.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env,
    IntoVal, Symbol, TryFromVal, Val, Vec,
};

const TTL_THRESHOLD: u32 = 100_000;
const TTL_EXTEND_TO: u32 = 500_000;
const BPS_DENOM: i128 = 10_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    BadConfig = 2,
    WrongStatus = 3,
    ZeroAmount = 4,
    Overshoot = 5,
    NotInOrder = 6,
    CapExceeded = 7,
    NotApproved = 8,
    AlreadyRefunded = 9,
    NothingToRefund = 10,
    CapsTooLarge = 11,
    SupplierNotApproved = 12,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Status {
    Open,
    Funded,
    Complete,
    Failed,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // instance storage (config and counters)
    Admin,
    Verifier,
    Recipient,
    Token,
    Goal,
    TotalRaised,
    Status,
    MilestoneBps,
    NextMilestone,
    Released,
    // persistent storage (per key)
    Approved(u32),
    Contribution(Address),
    Refunded(Address),
    Cap(u32, Symbol),
    CapCats(u32),
    Spent(u32, Symbol),
    Supplier(Address),
}

// ---------- storage helpers ----------

fn bump_instance(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn iget<V: TryFromVal<Env, Val>>(env: &Env, key: &DataKey) -> V {
    match env.storage().instance().get::<DataKey, V>(key) {
        Some(v) => v,
        None => panic_with_error!(env, Error::NotInitialized),
    }
}

fn iset<V: IntoVal<Env, Val>>(env: &Env, key: &DataKey, val: &V) {
    env.storage().instance().set(key, val);
}

fn pget<V: TryFromVal<Env, Val>>(env: &Env, key: &DataKey) -> Option<V> {
    let v = env.storage().persistent().get::<DataKey, V>(key);
    if v.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
    }
    v
}

fn pset<V: IntoVal<Env, Val>>(env: &Env, key: &DataKey, val: &V) {
    env.storage().persistent().set(key, val);
    env.storage()
        .persistent()
        .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

// ---------- checked arithmetic ----------

fn add(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_add(b)
        .unwrap_or_else(|| panic_with_error!(env, Error::BadConfig))
}

fn sub(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_sub(b)
        .unwrap_or_else(|| panic_with_error!(env, Error::BadConfig))
}

fn mul_div(env: &Env, a: i128, b: i128, d: i128) -> i128 {
    let p = a
        .checked_mul(b)
        .unwrap_or_else(|| panic_with_error!(env, Error::BadConfig));
    p / d
}

// ---------- internal reads ----------

fn status(env: &Env) -> Status {
    iget(env, &DataKey::Status)
}

fn milestone_bps(env: &Env) -> Vec<u32> {
    iget(env, &DataKey::MilestoneBps)
}

fn spent(env: &Env, idx: u32, category: &Symbol) -> i128 {
    pget(env, &DataKey::Spent(idx, category.clone())).unwrap_or(0)
}

fn cap(env: &Env, idx: u32, category: &Symbol) -> i128 {
    pget(env, &DataKey::Cap(idx, category.clone())).unwrap_or(0)
}

fn is_approved(env: &Env, idx: u32) -> bool {
    pget(env, &DataKey::Approved(idx)).unwrap_or(false)
}

fn contribution_of(env: &Env, addr: &Address) -> i128 {
    pget(env, &DataKey::Contribution(addr.clone())).unwrap_or(0)
}

fn has_refunded(env: &Env, addr: &Address) -> bool {
    pget(env, &DataKey::Refunded(addr.clone())).unwrap_or(false)
}

/// Planned tranche size for milestone idx, computed from the goal.
/// Once the pool is Funded, total_raised == goal, so this equals the released amount.
/// The last milestone takes the remainder so rounding dust is never stranded.
fn planned_tranche(env: &Env, idx: u32) -> i128 {
    let bps = milestone_bps(env);
    let n = bps.len();
    if idx >= n {
        panic_with_error!(env, Error::BadConfig);
    }
    let goal: i128 = iget(env, &DataKey::Goal);
    if idx == n - 1 {
        let mut earlier: i128 = 0;
        for i in 0..(n - 1) {
            earlier = add(
                env,
                earlier,
                mul_div(env, goal, bps.get(i).unwrap() as i128, BPS_DENOM),
            );
        }
        sub(env, goal, earlier)
    } else {
        mul_div(env, goal, bps.get(idx).unwrap() as i128, BPS_DENOM)
    }
}

fn refund_amount(env: &Env, addr: &Address) -> i128 {
    let total: i128 = iget(env, &DataKey::TotalRaised);
    let released: i128 = iget(env, &DataKey::Released);
    if total <= 0 {
        return 0;
    }
    let refund_pool = sub(env, total, released);
    mul_div(env, contribution_of(env, addr), refund_pool, total)
}

#[contract]
pub struct ChamaPool;

#[contractimpl]
impl ChamaPool {
    /// Deploy and set up in one step.
    pub fn __constructor(
        env: Env,
        admin: Address,
        verifier: Address,
        recipient: Address,
        token: Address,
        goal: i128,
        milestones_bps: Vec<u32>,
    ) {
        if goal <= 0 || milestones_bps.is_empty() || verifier == recipient {
            panic_with_error!(&env, Error::BadConfig);
        }
        let mut sum: u32 = 0;
        for b in milestones_bps.iter() {
            sum = sum
                .checked_add(b)
                .unwrap_or_else(|| panic_with_error!(&env, Error::BadConfig));
        }
        if sum != 10_000 {
            panic_with_error!(&env, Error::BadConfig);
        }
        iset(&env, &DataKey::Admin, &admin);
        iset(&env, &DataKey::Verifier, &verifier);
        iset(&env, &DataKey::Recipient, &recipient);
        iset(&env, &DataKey::Token, &token);
        iset(&env, &DataKey::Goal, &goal);
        iset(&env, &DataKey::TotalRaised, &0i128);
        iset(&env, &DataKey::Status, &Status::Open);
        iset(&env, &DataKey::MilestoneBps, &milestones_bps);
        iset(&env, &DataKey::NextMilestone, &0u32);
        iset(&env, &DataKey::Released, &0i128);
        bump_instance(&env);
    }

    // ---------- writes ----------

    pub fn contribute(env: Env, from: Address, amount: i128) {
        from.require_auth();
        bump_instance(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::ZeroAmount);
        }
        if status(&env) != Status::Open {
            panic_with_error!(&env, Error::WrongStatus);
        }
        let goal: i128 = iget(&env, &DataKey::Goal);
        let total: i128 = iget(&env, &DataKey::TotalRaised);
        let new_total = add(&env, total, amount);
        if new_total > goal {
            panic_with_error!(&env, Error::Overshoot);
        }
        // update state first, then move money
        let new_contrib = add(&env, contribution_of(&env, &from), amount);
        pset(&env, &DataKey::Contribution(from.clone()), &new_contrib);
        iset(&env, &DataKey::TotalRaised, &new_total);
        let funded = new_total == goal;
        if funded {
            iset(&env, &DataKey::Status, &Status::Funded);
        }
        let token_addr: Address = iget(&env, &DataKey::Token);
        token::Client::new(&env, &token_addr).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        env.events()
            .publish((Symbol::new(&env, "contributed"), from), amount);
        if funded {
            env.events().publish((Symbol::new(&env, "funded"),), new_total);
        }
    }

    pub fn set_caps(env: Env, idx: u32, caps: Vec<(Symbol, i128)>) {
        let admin: Address = iget(&env, &DataKey::Admin);
        admin.require_auth();
        bump_instance(&env);
        if idx >= milestone_bps(&env).len() {
            panic_with_error!(&env, Error::BadConfig);
        }
        if is_approved(&env, idx) {
            panic_with_error!(&env, Error::WrongStatus);
        }
        let mut sum: i128 = 0;
        for (_, c) in caps.iter() {
            if c < 0 {
                panic_with_error!(&env, Error::BadConfig);
            }
            sum = add(&env, sum, c);
        }
        if sum > planned_tranche(&env, idx) {
            panic_with_error!(&env, Error::CapsTooLarge);
        }
        // replace any earlier caps for this milestone
        let old: Vec<Symbol> = pget(&env, &DataKey::CapCats(idx)).unwrap_or(Vec::new(&env));
        for cat in old.iter() {
            env.storage().persistent().remove(&DataKey::Cap(idx, cat));
        }
        let mut cats: Vec<Symbol> = Vec::new(&env);
        for (cat, c) in caps.iter() {
            pset(&env, &DataKey::Cap(idx, cat.clone()), &c);
            cats.push_back(cat);
        }
        pset(&env, &DataKey::CapCats(idx), &cats);
    }

    pub fn add_supplier(env: Env, supplier: Address) {
        let admin: Address = iget(&env, &DataKey::Admin);
        admin.require_auth();
        bump_instance(&env);
        pset(&env, &DataKey::Supplier(supplier.clone()), &true);
        env.events()
            .publish((Symbol::new(&env, "supplier_added"),), supplier);
    }

    pub fn approve_milestone(env: Env, idx: u32) {
        let verifier: Address = iget(&env, &DataKey::Verifier);
        verifier.require_auth();
        bump_instance(&env);
        if status(&env) != Status::Funded {
            panic_with_error!(&env, Error::WrongStatus);
        }
        let next: u32 = iget(&env, &DataKey::NextMilestone);
        if idx != next {
            panic_with_error!(&env, Error::NotInOrder);
        }
        let bps = milestone_bps(&env);
        let total: i128 = iget(&env, &DataKey::TotalRaised);
        let released: i128 = iget(&env, &DataKey::Released);
        let last = idx == bps.len() - 1;
        let tranche = if last {
            sub(&env, total, released)
        } else {
            mul_div(&env, total, bps.get(idx).unwrap() as i128, BPS_DENOM)
        };
        // update state before anything else; the tranche stays in the contract
        pset(&env, &DataKey::Approved(idx), &true);
        iset(&env, &DataKey::Released, &add(&env, released, tranche));
        iset(&env, &DataKey::NextMilestone, &(next + 1));
        if last {
            iset(&env, &DataKey::Status, &Status::Complete);
        }
        env.events()
            .publish((Symbol::new(&env, "approved"), idx), tranche);
    }

    pub fn reject_milestone(env: Env, idx: u32) {
        let verifier: Address = iget(&env, &DataKey::Verifier);
        verifier.require_auth();
        bump_instance(&env);
        if status(&env) != Status::Funded {
            panic_with_error!(&env, Error::WrongStatus);
        }
        let next: u32 = iget(&env, &DataKey::NextMilestone);
        if idx != next {
            panic_with_error!(&env, Error::NotInOrder);
        }
        iset(&env, &DataKey::Status, &Status::Failed);
        env.events().publish((Symbol::new(&env, "rejected"),), idx);
    }

    pub fn refund(env: Env, contributor: Address) {
        contributor.require_auth();
        bump_instance(&env);
        if status(&env) != Status::Failed {
            panic_with_error!(&env, Error::WrongStatus);
        }
        if has_refunded(&env, &contributor) {
            panic_with_error!(&env, Error::AlreadyRefunded);
        }
        let amount = refund_amount(&env, &contributor);
        if amount <= 0 {
            panic_with_error!(&env, Error::NothingToRefund);
        }
        // set the flag before the transfer
        pset(&env, &DataKey::Refunded(contributor.clone()), &true);
        let token_addr: Address = iget(&env, &DataKey::Token);
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &contributor,
            &amount,
        );
        env.events()
            .publish((Symbol::new(&env, "refunded"), contributor), amount);
    }

    pub fn spend(env: Env, idx: u32, category: Symbol, to: Address, amount: i128) {
        let recipient: Address = iget(&env, &DataKey::Recipient);
        recipient.require_auth();
        bump_instance(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::ZeroAmount);
        }
        if !is_approved(&env, idx) {
            panic_with_error!(&env, Error::NotApproved);
        }
        let is_sup: bool = pget(&env, &DataKey::Supplier(to.clone())).unwrap_or(false);
        if !is_sup {
            panic_with_error!(&env, Error::SupplierNotApproved);
        }
        let already = spent(&env, idx, &category);
        let new_spent = add(&env, already, amount);
        if new_spent > cap(&env, idx, &category) {
            panic_with_error!(&env, Error::CapExceeded);
        }
        // update state first, then pay
        pset(&env, &DataKey::Spent(idx, category.clone()), &new_spent);
        let token_addr: Address = iget(&env, &DataKey::Token);
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );
        env.events()
            .publish((Symbol::new(&env, "spent"), idx, category, to), amount);
    }

    // ---------- views ----------

    pub fn get_state(env: Env) -> (Status, i128, i128, i128, u32) {
        bump_instance(&env);
        (
            status(&env),
            iget(&env, &DataKey::Goal),
            iget(&env, &DataKey::TotalRaised),
            iget(&env, &DataKey::Released),
            iget(&env, &DataKey::NextMilestone),
        )
    }

    pub fn get_contribution(env: Env, addr: Address) -> i128 {
        contribution_of(&env, &addr)
    }

    pub fn get_milestone(env: Env, idx: u32) -> (u32, i128, bool) {
        let bps = milestone_bps(&env);
        if idx >= bps.len() {
            panic_with_error!(&env, Error::BadConfig);
        }
        (
            bps.get(idx).unwrap(),
            planned_tranche(&env, idx),
            is_approved(&env, idx),
        )
    }

    pub fn get_milestone_count(env: Env) -> u32 {
        milestone_bps(&env).len()
    }

    pub fn get_cap(env: Env, idx: u32, category: Symbol) -> i128 {
        cap(&env, idx, &category)
    }

    pub fn get_spent(env: Env, idx: u32, category: Symbol) -> i128 {
        spent(&env, idx, &category)
    }

    pub fn get_remaining(env: Env, idx: u32, category: Symbol) -> i128 {
        sub(&env, cap(&env, idx, &category), spent(&env, idx, &category))
    }

    /// 0 unless the pool has failed and this address has not yet claimed.
    pub fn get_refundable(env: Env, addr: Address) -> i128 {
        if status(&env) != Status::Failed || has_refunded(&env, &addr) {
            return 0;
        }
        refund_amount(&env, &addr)
    }

    pub fn is_supplier(env: Env, addr: Address) -> bool {
        pget(&env, &DataKey::Supplier(addr)).unwrap_or(false)
    }

    pub fn get_config(env: Env) -> (Address, Address, Address, Address) {
        (
            iget(&env, &DataKey::Admin),
            iget(&env, &DataKey::Verifier),
            iget(&env, &DataKey::Recipient),
            iget(&env, &DataKey::Token),
        )
    }
}

#[cfg(test)]
mod test;
