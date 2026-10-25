#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    vec, Address, Env, Symbol,
};

const U: i128 = 10_000_000;
fn ce(e: Error) -> soroban_sdk::Error { soroban_sdk::Error::from_contract_error(e as u32) }

struct T<'a> {
    env: Env,
    pool: ChamaPoolClient<'a>,
    token: TokenClient<'a>,
    admin: Address,
    verifier: Address,
    recipient: Address,
    amara: Address,
    baraka: Address,
    chidi: Address,
    supplier: Address,
    stranger: Address,
}

fn setup<'a>() -> T<'a> {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let recipient = Address::generate(&env);
    let amara = Address::generate(&env);
    let baraka = Address::generate(&env);
    let chidi = Address::generate(&env);
    let supplier = Address::generate(&env);
    let stranger = Address::generate(&env);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token_addr = sac.address();
    let minter = StellarAssetClient::new(&env, &token_addr);
    minter.mint(&amara, &(500 * U));
    minter.mint(&baraka, &(300 * U));
    minter.mint(&chidi, &(200 * U));
    let pool_id = env.register(
        ChamaPool,
        (
            admin.clone(),
            verifier.clone(),
            recipient.clone(),
            token_addr.clone(),
            1000 * U,
            vec![&env, 4000u32, 3000u32, 3000u32],
        ),
    );
    let pool = ChamaPoolClient::new(&env, &pool_id);
    let token = TokenClient::new(&env, &token_addr);
    T { env, pool, token, admin, verifier, recipient, amara, baraka, chidi, supplier, stranger }
}

fn fund(t: &T) {
    t.pool.contribute(&t.amara, &(500 * U));
    t.pool.contribute(&t.baraka, &(300 * U));
    t.pool.contribute(&t.chidi, &(200 * U));
}

fn caps(t: &T) {
    t.pool.set_caps(
        &0,
        &vec![&t.env, (symbol_short!("equipment"), 250 * U), (Symbol::new(&t.env, "installation"), 150 * U)],
    );
    t.pool.add_supplier(&t.supplier);
}

// 1
#[test]
fn partial_contribution_keeps_open() {
    let t = setup();
    t.pool.contribute(&t.amara, &(500 * U));
    let (st, goal, raised, released, next) = t.pool.get_state();
    assert_eq!(st, Status::Open);
    assert_eq!((goal, raised, released, next), (1000 * U, 500 * U, 0, 0));
    assert_eq!(t.pool.get_contribution(&t.amara), 500 * U);
    assert_eq!(t.token.balance(&t.pool.address), 500 * U);
}

// 2
#[test]
fn overshoot_rejected() {
    let t = setup();
    t.pool.contribute(&t.amara, &(500 * U));
    t.pool.contribute(&t.baraka, &(300 * U));
    let e = t.pool.try_contribute(&t.chidi, &(201 * U));
    assert_eq!(e, Err(Ok(ce(Error::Overshoot))));
    let z = t.pool.try_contribute(&t.chidi, &0);
    assert_eq!(z, Err(Ok(ce(Error::ZeroAmount))));
}

// 3
#[test]
fn reaching_goal_funds_without_release() {
    let t = setup();
    fund(&t);
    let (st, _, raised, released, _) = t.pool.get_state();
    assert_eq!(st, Status::Funded);
    assert_eq!((raised, released), (1000 * U, 0));
    let e = t.pool.try_contribute(&t.amara, &U);
    assert_eq!(e, Err(Ok(ce(Error::WrongStatus))));
}

// 4
#[test]
fn verifier_equal_recipient_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let a = Address::generate(&env);
    let v = Address::generate(&env);
    let tok = Address::generate(&env);
    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| env.register(
        ChamaPool,
        (a.clone(), v.clone(), v.clone(), tok.clone(), 1000 * U, vec![&env, 10_000u32]),
    )));
    assert!(r.is_err());
    let r2 = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| env.register(
        ChamaPool,
        (a.clone(), v.clone(), Address::generate(&env), tok.clone(), 1000 * U, vec![&env, 5000u32, 4000u32]),
    )));
    assert!(r2.is_err());
}

// 5
#[test]
fn only_right_roles_can_act() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);
    let pool_id = env.register(
        ChamaPool,
        (admin.clone(), verifier.clone(), recipient.clone(), token, 1000 * U, vec![&env, 10_000u32]),
    );
    let pool = ChamaPoolClient::new(&env, &pool_id);
    // no auths mocked: every protected call must fail
    assert!(pool.try_approve_milestone(&0).is_err());
    assert!(pool.try_reject_milestone(&0).is_err());
    assert!(pool.try_spend(&0, &symbol_short!("equipment"), &admin, &1).is_err());
    assert!(pool.try_add_supplier(&admin).is_err());
}

// 6
#[test]
fn out_of_order_fails() {
    let t = setup();
    fund(&t);
    assert_eq!(t.pool.try_approve_milestone(&1), Err(Ok(ce(Error::NotInOrder))));
    assert_eq!(t.pool.try_reject_milestone(&2), Err(Ok(ce(Error::NotInOrder))));
}

// 7
#[test]
fn full_lifecycle() {
    let t = setup();
    // before funded
    assert_eq!(t.pool.try_approve_milestone(&0), Err(Ok(ce(Error::WrongStatus))));
    fund(&t);
    t.pool.approve_milestone(&0);
    assert_eq!(t.pool.get_state().3, 400 * U);
    t.pool.approve_milestone(&1);
    assert_eq!(t.pool.get_state().3, 700 * U);
    t.pool.approve_milestone(&2);
    let (st, _, raised, released, next) = t.pool.get_state();
    assert_eq!(st, Status::Complete);
    assert_eq!(released, raised);
    assert_eq!(next, 3);
    assert_eq!(t.pool.get_milestone(&0), (4000, 400 * U, true));
    assert_eq!(t.pool.get_milestone_count(), 3);
    assert_eq!(t.pool.try_approve_milestone(&2), Err(Ok(ce(Error::WrongStatus))));
}

// 8
#[test]
fn spend_caps_and_order() {
    let t = setup();
    fund(&t);
    caps(&t);
    let eq = symbol_short!("equipment");
    // before approval
    assert_eq!(t.pool.try_spend(&0, &eq, &t.supplier, &(10 * U)), Err(Ok(ce(Error::NotApproved))));
    t.pool.approve_milestone(&0);
    t.pool.spend(&0, &eq, &t.supplier, &(200 * U));
    assert_eq!(t.token.balance(&t.supplier), 200 * U);
    assert_eq!(t.pool.get_spent(&0, &eq), 200 * U);
    assert_eq!(t.pool.get_remaining(&0, &eq), 50 * U);
    assert_eq!(t.pool.try_spend(&0, &eq, &t.supplier, &(100 * U)), Err(Ok(ce(Error::CapExceeded))));
    assert_eq!(t.token.balance(&t.supplier), 200 * U);
    assert_eq!(t.pool.try_spend(&0, &eq, &t.supplier, &0), Err(Ok(ce(Error::ZeroAmount))));
    // category with no cap
    assert_eq!(
        t.pool.try_spend(&0, &symbol_short!("other"), &t.supplier, &U),
        Err(Ok(ce(Error::CapExceeded)))
    );
}

// 9
#[test]
fn reject_then_refund_pro_rata_once() {
    let t = setup();
    fund(&t);
    t.pool.approve_milestone(&0);
    t.pool.reject_milestone(&1);
    assert_eq!(t.pool.get_state().0, Status::Failed);
    assert_eq!(t.pool.get_refundable(&t.amara), 300 * U);
    t.pool.refund(&t.amara);
    t.pool.refund(&t.baraka);
    t.pool.refund(&t.chidi);
    assert_eq!(t.token.balance(&t.amara), 300 * U);
    assert_eq!(t.token.balance(&t.baraka), 180 * U);
    assert_eq!(t.token.balance(&t.chidi), 120 * U);
    assert_eq!(t.pool.get_refundable(&t.amara), 0);
    assert_eq!(t.pool.try_refund(&t.amara), Err(Ok(ce(Error::AlreadyRefunded))));
    // 400 released stays in the contract
    assert_eq!(t.token.balance(&t.pool.address), 400 * U);
    // refund before failure / by non-contributor
    let t2 = setup();
    fund(&t2);
    assert_eq!(t2.pool.try_refund(&t2.amara), Err(Ok(ce(Error::WrongStatus))));
    t2.pool.reject_milestone(&0);
    assert_eq!(t2.pool.try_refund(&t2.stranger), Err(Ok(ce(Error::NothingToRefund))));
}

// 10
#[test]
fn caps_too_large() {
    let t = setup();
    fund(&t);
    let r = t.pool.try_set_caps(
        &0,
        &vec![&t.env, (symbol_short!("equipment"), 300 * U), (Symbol::new(&t.env, "installation"), 150 * U)],
    );
    assert_eq!(r, Err(Ok(ce(Error::CapsTooLarge))));
    // replacing caps works, and caps lock once approved
    caps(&t);
    t.pool.approve_milestone(&0);
    let r2 = t.pool.try_set_caps(&0, &vec![&t.env, (symbol_short!("equipment"), 100 * U)]);
    assert_eq!(r2, Err(Ok(ce(Error::WrongStatus))));
}

// 11
#[test]
fn supplier_allowlist() {
    let t = setup();
    fund(&t);
    t.pool.set_caps(&0, &vec![&t.env, (symbol_short!("equipment"), 250 * U)]);
    t.pool.approve_milestone(&0);
    let eq = symbol_short!("equipment");
    assert!(!t.pool.is_supplier(&t.supplier));
    assert_eq!(
        t.pool.try_spend(&0, &eq, &t.supplier, &(50 * U)),
        Err(Ok(ce(Error::SupplierNotApproved)))
    );
    t.pool.add_supplier(&t.supplier);
    assert!(t.pool.is_supplier(&t.supplier));
    t.pool.spend(&0, &eq, &t.supplier, &(50 * U));
    assert_eq!(t.token.balance(&t.supplier), 50 * U);
    assert_eq!(
        t.pool.try_spend(&0, &eq, &t.stranger, &(10 * U)),
        Err(Ok(ce(Error::SupplierNotApproved)))
    );
}

// 12
#[test]
fn spend_after_rejection_still_works_and_refund_formula() {
    let t = setup();
    fund(&t);
    caps(&t);
    t.pool.approve_milestone(&0);
    t.pool.reject_milestone(&1);
    let eq = symbol_short!("equipment");
    t.pool.spend(&0, &eq, &t.supplier, &(200 * U));
    assert_eq!(t.token.balance(&t.supplier), 200 * U);
    t.pool.refund(&t.amara);
    assert_eq!(t.token.balance(&t.amara), 300 * U);
}

// rounding: last tranche takes the remainder
#[test]
fn rounding_dust_goes_to_last_tranche() {
    let env = Env::default();
    env.mock_all_auths();
    let (a, v, r, i) = (
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    );
    let sac = env.register_stellar_asset_contract_v2(i);
    let tok = sac.address();
    let donor = Address::generate(&env);
    StellarAssetClient::new(&env, &tok).mint(&donor, &1000);
    let id = env.register(
        ChamaPool,
        (a, v, r, tok.clone(), 1000i128, vec![&env, 3333u32, 3333u32, 3334u32]),
    );
    let pool = ChamaPoolClient::new(&env, &id);
    pool.contribute(&donor, &1000);
    pool.approve_milestone(&0);
    pool.approve_milestone(&1);
    pool.approve_milestone(&2);
    let (_, _, raised, released, _) = pool.get_state();
    assert_eq!(released, raised);
    let _ = Symbol::new(&env, "x");
}
