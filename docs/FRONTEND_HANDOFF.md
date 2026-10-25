---
title: "Chama: Frontend Handoff (answers to the frontend questions)"
date: "25 October 2026"
---

**Source of truth:** `docs/INTERFACE.md` (updated tonight). This page answers the five questions in one place. Amounts are token base units (`i128`, 7 decimals): **500 USDC = 5_000_000_000**. Use `bigint` in TypeScript.

# 0. The repo

The repo is created from the starter zip: see `REPO_AND_FRONTEND_GUIDE`, Part 1 (about 10 minutes). Lydia creates it, adds you as a collaborator, and you clone it. Until it exists, work from the zip on your own machine.

# 1. Contract functions (exact calls and inputs)

| Action | Call | Inputs | Who signs |
|---|---|---|---|
| Contribute | `contribute(from, amount)` | `from`: Address, `amount`: i128 | The contributor |
| Approve a milestone | `approve_milestone(idx)` | `idx`: u32 (0, 1, 2 in order) | Verifier |
| Reject a milestone | `reject_milestone(idx)` | `idx`: u32 (must be the next one) | Verifier |
| Spend | `spend(idx, category, to, amount)` | `idx`: u32, `category`: Symbol (`equipment` or `installation`), `to`: Address (an approved supplier), `amount`: i128 | Recipient (the SME) |
| Claim a refund | `refund(contributor)` | `contributor`: Address | The contributor |
| Set caps (setup, scripts) | `set_caps(idx, caps)` | `idx`: u32, `caps`: Vec of (Symbol, i128) | Admin |
| Register a supplier (setup, scripts) | `add_supplier(supplier)` | `supplier`: Address | Admin |
| Deploy and setup | `__constructor(admin, verifier, recipient, token, goal, milestones_bps)` | Addresses, `goal`: i128, `milestones_bps`: Vec<u32> (demo: 4000, 3000, 3000) | Deployer |

`set_caps`, `add_supplier` and the constructor run in the setup scripts (`demo-reset.sh`), not from the page. The page needs the first five rows.

# 2. Data to display (read-only views)

| You need | Call | Returns |
|---|---|---|
| Pool total, goal, status, released, next milestone | `get_state()` | `(status, goal, total_raised, released, next_milestone)` |
| A wallet's contribution | `get_contribution(addr)` | i128 |
| A milestone's share, tranche and status | `get_milestone(idx)` | `(bps, tranche_amount, approved)` |
| Number of milestones | `get_milestone_count()` | u32 (demo: 3) |
| Category budget (cap) | `get_cap(idx, category)` | i128 |
| Category spending so far | `get_spent(idx, category)` | i128 |
| Category remaining | `get_remaining(idx, category)` | i128 (cap minus spent) |
| A wallet's refund | `get_refundable(addr)` | i128. It is 0 unless the pool has failed and the wallet has not claimed |
| Is an address an approved supplier | `is_supplier(addr)` | bool (only if the allowlist is built) |
| Who holds each role | `get_config()` | `(admin, verifier, recipient, token)` |

- **Status values:** `Open`, `Funded`, `Complete`, `Failed`.
- **Percentage share** = contribution / total_raised, calculated in the UI.
- **There is no on-chain contributor list.** Read `get_contribution` for the known demo wallets (Amara, Baraka, Chidi), and optionally the `contributed` events.
- **Categories and milestone count** can be fixed in `config.ts` for the demo: `equipment`, `installation`, 3 milestones.
- **Events** (for the spend log and explorer links): `contributed`, `funded`, `approved`, `rejected`, `refunded`, `spent`, `supplier_added`.

# 3. Wallet roles

| Role | In the demo | Can do | Cannot do |
|---|---|---|---|
| Admin | `admin` | `set_caps` (before the tranche is approved), `add_supplier` | Move money |
| Verifier | `verifier` | `approve_milestone`, `reject_milestone` | Spend. Must be a different wallet from the recipient (checked at setup) |
| Recipient (the SME) | `recipient` | `spend`, only to approved suppliers and inside caps | Approve or reject |
| Contributors | `amara`, `baraka`, `chidi` | `contribute`, `refund` | Anything else |
| Suppliers | `cooling_supplier`, `installer` | Receive payments | Sign anything. The `stranger` wallet is not approved and is used to show the block |

In demo mode the role switcher picks which testnet key signs. Keys stay in local env files and are never committed.

# 4. Rules and errors

## When each action is allowed

| Action | Allowed when |
|---|---|
| `contribute` | Status is `Open`, amount > 0, and it does not take the total above the goal |
| `approve_milestone(idx)` | Status is `Funded` and `idx` is the next milestone (in order) |
| `reject_milestone(idx)` | Status is `Funded` and `idx` is the next milestone. Status becomes `Failed` |
| `spend` | The milestone is approved, `to` is an approved supplier, amount > 0, and `spent + amount <= cap` |
| `refund` | Status is `Failed` and the wallet has not claimed before |

Refund = contribution x (total_raised - released) / total_raised, rounded down. With the demo numbers: 300, 180 and 120. Released tranches are not clawed back.

## Errors and the message to show

| Error | When it happens | Show the user |
|---|---|---|
| `CapExceeded` | A spend would pass the category cap | **Blocked by the contract.** Cap, already spent, remaining, attempted. "No money moved." |
| `SupplierNotApproved` | `to` is not an approved supplier (if the allowlist is built) | **Blocked by the contract.** "This wallet is not on the approved supplier list. No money moved." |
| `NotApproved` | Spending from a milestone that has not been approved | "This milestone has not been approved yet." |
| `NotInOrder` | Approving or rejecting a milestone out of order | "Milestones are approved in order." |
| `WrongStatus` | The action does not fit the pool's current status | "This isn't available while the pool is [status]." |
| `Overshoot` | A contribution would take the pool above its goal | "That would pass the funding goal." |
| `ZeroAmount` | Amount is 0 or less | "Enter an amount above zero." |
| `AlreadyRefunded` | The wallet already claimed | "You've already claimed this refund." |
| `NothingToRefund` | The wallet has no refundable amount | "Nothing to claim for this wallet." |
| `CapsTooLarge` | Caps add up to more than the tranche (setup only) | Not shown in the UI |
| `BadConfig`, `NotInitialized` | Setup problems | "Setup error. Run the reset." |

The contract returns errors as `Error(Contract, #N)`. **The numbers are fixed now:**

| # | Error | # | Error |
|---|---|---|---|
| 1 | `NotInitialized` | 7 | `CapExceeded` |
| 2 | `BadConfig` | 8 | `NotApproved` |
| 3 | `WrongStatus` | 9 | `AlreadyRefunded` |
| 4 | `ZeroAmount` | 10 | `NothingToRefund` |
| 5 | `Overshoot` | 11 | `CapsTooLarge` |
| 6 | `NotInOrder` | 12 | `SupplierNotApproved` |

**Order of checks** (the same input always gives the same error): `contribute` checks ZeroAmount, WrongStatus, Overshoot. Approve and reject check WrongStatus, NotInOrder. `spend` checks ZeroAmount, NotApproved, SupplierNotApproved, CapExceeded. `refund` checks WrongStatus (pool has not failed), AlreadyRefunded, NothingToRefund. If the allowlist is cut at Gate 2, error 12 is never returned.

Anything unknown shows a plain message with the raw error in a collapsed line.

# 5. Connection details (when deployed)

| Item | Value | When |
|---|---|---|
| Network | Stellar testnet | Now |
| Network passphrase | `Test SDF Network ; September 2015` | Now |
| RPC URL | `https://soroban-testnet.stellar.org` | Now |
| Contract ID | Lydia posts it in the team chat after the first deploy | About 20:00 tonight, then after every redeploy |
| USDC token address | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` (from Stellar's x402 docs. **Verify before use**; Lydia confirms at deploy) | Now, to confirm |
| TypeScript bindings | Generated with `stellar contract bindings typescript --network testnet --contract-id $POOL_ID --output-dir packages/bindings --overwrite`, committed to `packages/bindings` | About 20:00 (skeleton), then after every interface or contract change |
| Explorer | `https://stellar.expert/explorer/testnet/tx/<hash>` | Now |

Put these in `.env` as `VITE_CONTRACT_ID`, `VITE_RPC_URL`, `VITE_NETWORK_PASSPHRASE`. Never commit `.env`.

# Repayments and returns

**Not included in this build.** There is no repayment, revenue-share or returns function in the contract or in `INTERFACE.md`, and the UI must not show returns. They are planned for later, through a licensed partner, and appear only as a roadmap line ("returns structure with a licensed partner"). The only money flows in the MVP are: contribute, release on approval, spend inside caps to approved suppliers, and refund of what was never released. The platform fee is a UI-only illustrative line.

# Open items for Lydia (do not block the frontend)

1. Use the fixed error numbers above when building the contract.
2. Confirm the supplier allowlist is in or cut at Gate 2.
3. Confirm the USDC token ID on deploy.
4. Confirm `spend` stays allowed after a rejection.
