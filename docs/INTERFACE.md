# INTERFACE.md: Contract interface (frozen at hour 1)

Single Soroban contract for the hackathon MVP. Everyone codes against this file. Do not change it without telling the other two.

**Changelog (25 Oct, evening):** added a supplier allowlist (`add_supplier`, `is_supplier`, `SupplierNotApproved`). Removed the agent and x402 from the MVP (roadmap only). Clarified that `spend` stays allowed for approved tranches after a rejection. The fee is UI-only and is not in the contract. Also added `get_config`, `get_milestone_count` and a rule that `get_refundable` returns 0 unless the pool has failed and the address has not claimed.

**Purpose:** a pool funds a project (for example a cold-storage unit for an SME). A separate verifier wallet releases the money in tranches. Released money stays in the contract and can only be spent through `spend`, to supplier wallets registered by the admin and within per-category caps. If the verifier rejects a milestone, contributors get back their share of what was never released.

**Units:** all amounts are in token base units (i128). Testnet USDC has 7 decimals, so 1 USDC = 10_000_000. The demo uses whole-USDC helpers in the UI.

**Token:** testnet USDC SEP-41 contract. ID from Stellar's x402 docs: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` (verify before use).

## Roles

| Role | Who signs | Can do |
|---|---|---|
| admin | project setup | `set_caps` (before the tranche is approved), `add_supplier` |
| verifier | independent person | `approve_milestone`, `reject_milestone`. Must differ from `recipient` |
| recipient | project wallet (the SME) | `spend` |
| contributor | anyone | `contribute`, `refund` |

## Status

`Open` (collecting) -> `Funded` (goal reached) -> `Complete` (all milestones approved), or `Failed` (a milestone rejected).

## Storage keys (persistent; `extend_ttl` on writes)

`Admin, Verifier, Recipient, Token, Goal, TotalRaised, Status, MilestoneBps(Vec<u32>), Approved(u32), NextMilestone, Released, Contribution(Address), Refunded(Address), Cap(u32, Symbol), Spent(u32, Symbol), Supplier(Address)`

## Functions

```
__constructor(admin, verifier, recipient, token, goal, milestones_bps: Vec<u32>)
```
- `goal > 0`. `milestones_bps` non-empty and sums to exactly 10_000. `verifier != recipient`.

```
contribute(from: Address, amount: i128)
```
- `from.require_auth()`. Status `Open`, `amount > 0`, `total_raised + amount <= goal` (no overshoot).
- Transfers USDC from `from` to the contract. Updates `Contribution(from)` and `TotalRaised`.
- If `total_raised == goal`, status becomes `Funded`. Nothing is released here.

```
set_caps(idx: u32, caps: Vec<(Symbol, i128)>)
```
- `admin.require_auth()`. Allowed until milestone `idx` is approved.
- Sum of caps must be `<= tranche_amount(idx)`. Replaces any earlier caps for `idx`.

```
add_supplier(supplier: Address)
```
- `admin.require_auth()`. Allowed in any status. Idempotent. Emits `supplier_added`.
- Only registered suppliers can be paid by `spend`. **Cut rule:** if this is not working by the hour-6 gate, remove it and drop the supplier claim from the slides (see `CLAIMS.md`).

```
approve_milestone(idx: u32)
```
- `verifier.require_auth()`. Status `Funded`. `idx == NextMilestone` (in order).
- `tranche_amount(idx) = total_raised * bps[idx] / 10_000`. For the last milestone use `total_raised - Released` so rounding dust is never stranded.
- Update state first (`Approved`, `Released += tranche`, `NextMilestone += 1`). The tranche stays in the contract and becomes spendable under its caps.
- If this was the last milestone, status becomes `Complete`.

```
reject_milestone(idx: u32)
```
- `verifier.require_auth()`. Status `Funded`. `idx == NextMilestone`. Status becomes `Failed`.
- Released tranches are not clawed back.

```
refund(contributor: Address)
```
- `contributor.require_auth()`. Status must be `Failed`. One refund per contributor.
- `refund_pool = total_raised - Released`. Refund = `Contribution * refund_pool / total_raised`, rounded down.

```
spend(idx: u32, category: Symbol, to: Address, amount: i128)
```
- `recipient.require_auth()`. Milestone `idx` must be approved. `amount > 0`.
- Reverts with `SupplierNotApproved` if `to` is not a registered supplier.
- Reverts with `CapExceeded` if `Spent(idx, category) + amount > Cap(idx, category)`.
- Updates `Spent`, then transfers USDC from the contract to `to`.
- **Allowed after `Failed`** for tranches that were already approved (released money is not clawed back). Open question for Lydia: confirm this is the intended behaviour.
- The contract does not check what was bought, only who is paid, how much and in which category.

## Views

```
get_state() -> (status, goal, total_raised, released, next_milestone)
get_contribution(addr) -> i128
get_milestone(idx) -> (bps, tranche_amount, approved)
get_cap(idx, category) -> i128
get_spent(idx, category) -> i128
get_remaining(idx, category) -> i128      // cap minus spent
is_supplier(addr) -> bool
get_config() -> (admin, verifier, recipient, token)   // lets the UI show who holds each role
get_milestone_count() -> u32
```

- `get_refundable(addr)` returns 0 unless status is `Failed` and the address has not yet claimed, so the UI can show "Refunded" or "Nothing to claim".
- `get_cap`, `get_spent` and `get_remaining` take a category `Symbol` (demo values: `equipment`, `installation`).
- There is no on-chain list of contributors: the UI reads `get_contribution(addr)` for the known demo wallets, and can also read `contributed` events.

```
get_refundable(addr) -> i128
```

## Errors (contracterror)

`NotInitialized, BadConfig, WrongStatus, ZeroAmount, Overshoot, NotInOrder, CapExceeded, NotApproved, AlreadyRefunded, NothingToRefund, CapsTooLarge, SupplierNotApproved`

## Error numbers (fixed now, do not renumber)

Define the enum with explicit values so the frontend can map `Error(Contract, #N)` straight away:

```rust
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
```

**Order of checks (so the same input always gives the same error):**

- `contribute`: `ZeroAmount`, then `WrongStatus`, then `Overshoot`.
- `approve_milestone` and `reject_milestone`: `WrongStatus`, then `NotInOrder`.
- `spend`: `ZeroAmount`, then `NotApproved`, then `SupplierNotApproved`, then `CapExceeded`.
- `refund`: `WrongStatus` (the pool has not failed), then `AlreadyRefunded`, then `NothingToRefund` (no contribution).
- If the allowlist is cut at Gate 2, `SupplierNotApproved = 12` stays in the enum but is never returned.


## Events

`supplier_added(addr)`, `contributed(from, amount)`, `funded()`, `approved(idx, tranche)`, `rejected(idx)`, `refunded(addr, amount)`, `spent(idx, category, to, amount)`.

## Required tests

1. Contribution below goal: totals update, status stays `Open`, nothing released.
2. Overshoot rejected.
3. Reaching goal sets `Funded`, releases nothing.
4. `verifier == recipient` rejected at construction.
5. Only the verifier can approve or reject. Only the recipient can spend.
6. Out-of-order approval fails.
7. Full lifecycle with 3 milestones (4000/3000/3000 bps): tranches correct, last one exact, status `Complete`.
8. `spend` within cap works. `spend` over cap reverts. `spend` before approval reverts.
9. Reject after one approval: each contributor refunds `contribution * refund_pool / total_raised`, once only.
10. `CapsTooLarge` when caps sum above the tranche.
11. `spend` to an address that is not a registered supplier reverts with `SupplierNotApproved`. After `add_supplier`, the same payment works.
12. After a rejection, `spend` of already-released money within its caps still works, and `refund` still pays `contribution * (total_raised - Released) / total_raised`.

## Cut list (in this order)

1. Supplier allowlist, if not working by the hour-6 gate (also drop the supplier claim from the slides).
2. Refund UI (show it as an explorer transaction).
3. Separate verifier view (use the CLI in the demo).

Never cut: contribute, verifier approval, the visible tranche, `spend` blocking an over-cap payment, the backup video.

## Non-goals

No multi-pool factory, no KYC or token issuance, no on-chain verification of real-world facts (the verifier attests, the contract enforces who signs), no returns or revenue share, no fee in the contract (the fee line is UI-only and labelled illustrative). The AI agent and x402 are roadmap only and are not part of the MVP.
