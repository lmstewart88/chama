---
title: "Chama MVP: Technical Implementation Plan"
date: "25 October 2026"
---

# Technical plan: two work packages

**Refreshed 25 Oct, 19:15.** Changes since the first version: the AI agent and x402 are roadmap only (removed from the MVP), a supplier allowlist is added (cut at Gate 2 if it is not working), the demo case is a cold-storage unit for an SME, and the hour-based gates are replaced by clock times (Gate 1 at 22:30 tonight, Gate 2 at 09:00, code freeze at 09:30, submit by 11:30, deadline 12:00). See `SHIP_PLAN` for the full schedule and `CLAIMS` for what the slides may say.


**MVP:** one Soroban contract on Stellar testnet plus a one-page web app. A pool of USDC releases only when an independent verifier approves a milestone, refunds contributors if one is rejected, and lets the project wallet spend released money only to approved supplier wallets and only within category caps.

**Contract of work between the two builders:** `docs/INTERFACE.md`. Package A builds it on-chain; Package B codes to it with mock data until Package A commits the generated bindings (skeleton at 20:00, refreshed after each gate).

| | Package A: On-chain | Package B: Web app |
|---|---|---|
| Owner | Backend lead | Frontend teammate |
| Folders | `contracts/`, `scripts/`, `packages/bindings/` | `web/` |
| Time | about 8.5 hours | about 7 hours |
| First handoff | Skeleton bindings by 20:00 tonight, refreshed after each gate | Page on mock data by Gate 1 (22:30) |

Assumptions to verify in the first hour: tool versions (`stellar --version`, Rust, Node 20+), the testnet USDC contract ID, and how you will get testnet USDC (see A4). Commands below are the standard Stellar CLI forms; run `stellar <command> --help` if a flag differs on your version.

## Repo layout (create at 19:00)

```
chama/
  AGENTS.md              rules for AI coding tools (follow docs/INTERFACE.md)
  README.md              problem, solution, Stellar pieces, "Built this weekend" log
  .env.example           variable names only, never real keys
  .gitignore             .env, target/, node_modules/
  contracts/pool/        Cargo.toml, src/lib.rs, src/test.rs
  packages/bindings/     generated TypeScript client (do not hand-edit)
  scripts/               setup-wallets.sh, deploy.sh, demo-reset.sh, demo-flow.sh
  web/                   Vite + React + TypeScript app
  docs/                  INTERFACE.md, DEMO.md, pitch material
```

Branches: `contracts` (A), `web` (B), `docs` (pitch). Merge to `main` at each checkpoint. `main` must always run.

---

# Package A: On-chain (backend lead)

## A1. Contract skeleton (19:00 to 20:00)

- New contract at `contracts/pool` (`stellar contract init`, or copy the v1 structure). `#![no_std]`, `soroban-sdk` from the workspace.
- Define `DataKey` (persistent storage): `Admin, Verifier, Recipient, Token, Goal, TotalRaised, Status, MilestoneBps, Approved(u32), NextMilestone, Released, Contribution(Address), Refunded(Address), Cap(u32, Symbol), Spent(u32, Symbol), Supplier(Address)`.
- Define `Status` enum (`Open, Funded, Complete, Failed`) and a `contracterror` enum from `INTERFACE.md`.
- Use `__constructor(admin, verifier, recipient, token, goal, milestones_bps)` so deploy and setup are one step. If the constructor causes trouble with your SDK version, fall back to `initialize` with an already-initialised guard.
- Validate in the constructor: `goal > 0`, `milestones_bps` non-empty and summing to 10_000, `verifier != recipient`.
- Extend TTL on every write that touches persistent entries.

**Done when:** the crate builds with `stellar contract build` and a test can construct the contract.

## A2. Pool and release (20:00 to 22:30): Gate 1

- `contribute(from, amount)`: `from.require_auth()`; status `Open`; `amount > 0`; reject if `total_raised + amount > goal`; transfer from `from` to the contract with the token client; update `Contribution(from)` and `TotalRaised`; set `Funded` when the total equals the goal. Nothing is released here.
- `approve_milestone(idx)`: `verifier.require_auth()`; status `Funded`; `idx == NextMilestone`; tranche = `total_raised * bps[idx] / 10_000`; for the last milestone use `total_raised - Released` so rounding dust is never stranded; **update state before any external call**; the tranche stays in the contract and becomes spendable; last milestone sets `Complete`.
- Views: `get_state`, `get_contribution`, `get_milestone`.
- Emit events as listed in `INTERFACE.md`.

**Done when (Gate 1, 22:30):** tests 1 to 7 from `INTERFACE.md` pass, and on testnet three wallets fund the pool, the verifier approves milestone 1, and `get_state` shows the tranche released.

## A3. Reject, refund, caps, spend and allowlist (22:30 tonight to 09:00): Gate 2

- `reject_milestone(idx)`: verifier only; status `Funded`; `idx == NextMilestone`; set `Failed`. Released tranches are not clawed back.
- `refund(contributor)`: contributor auth; status `Failed`; once per contributor (`Refunded` flag); `refund_pool = total_raised - Released`; refund = `Contribution * refund_pool / total_raised`, rounded down. Set the flag before the transfer.
- `set_caps(idx, caps: Vec<(Symbol, i128)>)`: admin only, until milestone `idx` is approved; the caps must sum to at most the tranche amount (`CapsTooLarge` otherwise).
- `add_supplier(supplier)`: admin only; registers an approved supplier wallet. **Cut at Gate 2 if it is not working** (then drop the supplier claim from the slides, see `CLAIMS`).
- `spend(idx, category, to, amount)`: recipient auth; milestone `idx` must be approved; `to` must be a registered supplier else `SupplierNotApproved`; `Spent + amount <= Cap` else `CapExceeded`; update `Spent` first, then transfer from the contract to `to`. Still allowed after `Failed` for tranches already approved (open question, see `INTERFACE`).
- Views: `get_cap`, `get_spent`, `get_remaining`, `get_refundable`, `is_supplier`.
- Use checked arithmetic on every `i128` operation.

**Done when (Gate 2, 09:00):** tests 8 to 12 pass, and on testnet an over-cap `spend` reverts with `CapExceeded` and a payment to an unregistered wallet reverts with `SupplierNotApproved`.

## A4. Testnet setup and scripts (alongside, finish by 09:00)

- `scripts/setup-wallets.sh`: create and fund these identities with `stellar keys generate <name> --network testnet --fund`: `admin, verifier, recipient, amara, baraka, chidi, cooling_supplier, installer, stranger`. Keys stay in the local Stellar keystore or `.env`, never in git.
- **Testnet USDC:** the token contract ID from Stellar's x402 docs is `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` (verify before use). Classic wallets need a USDC trustline before they can hold it. Work out the faucet route in the first hour.
- **Fallback if USDC is a problem:** issue your own demo asset from an issuer account, give wallets trustlines, wrap it as a token contract with `stellar contract asset deploy`, and use that as `token`. Say plainly in the pitch that the demo uses a test asset.
- `scripts/deploy.sh`: build, deploy with constructor arguments, print the contract ID, write it to `.env`. Example shape: `stellar contract deploy --wasm <wasm> --source admin --network testnet -- --admin ... --verifier ... --recipient ... --token ... --goal 10000000000 --milestones_bps '[4000,3000,3000]'`.
- `scripts/demo-reset.sh`: redeploy, initialise, register `cooling_supplier` and `installer` as approved suppliers, set tranche 1 caps (equipment 250, installation 150 USDC), regenerate bindings. One command.
- `scripts/demo-flow.sh`: run the whole demo from the CLI (contribute x3, approve, spend, over-cap spend, spend to `stranger`, reject, refunds). This is the fallback if the UI fails and the basis for the backup video.
- Amounts have 7 decimals: 500 USDC is `5_000_000_000`.

## A5. Bindings handoff (skeleton at 20:00, repeat after every deploy)

```
stellar contract bindings typescript \
  --network testnet --contract-id $POOL_ID \
  --output-dir packages/bindings --overwrite
```

Commit `packages/bindings` and tell Package B in the shared chat. Regenerate and recommit after any interface change.

## A6. Tests (write alongside each feature)

Use `Env::default()` and `mock_all_auths()` for the happy paths, plus targeted auth-failure tests (only the verifier approves or rejects, only the recipient spends). The ten required tests are in `docs/INTERFACE.md`. A second person reviews the refund maths: with the demo numbers, a refund pool of 600 gives 300 / 180 / 120 for contributions of 500 / 300 / 200.

---

# Package B: Web app (frontend teammate)

## B1. App skeleton on mock data (19:00 to 22:30): Gate 1

- `web/`: Vite + React + TypeScript. One page, no routing.
- Build a small `chama.ts` data layer with the same functions as `INTERFACE.md`, returning mock data at first. When bindings arrive, replace the mock internals and keep the page unchanged.
- Mock data shape (mirrors the views):

```json
{
  "state": {"status": "Funded", "goal": "1000", "totalRaised": "1000", "released": "400", "nextMilestone": 1},
  "contributions": {"amara": "500", "baraka": "300", "chidi": "200"},
  "milestones": [
    {"bps": 4000, "tranche": "400", "approved": true},
    {"bps": 3000, "tranche": "300", "approved": false},
    {"bps": 3000, "tranche": "300", "approved": false}
  ],
  "caps": {"equipment": {"cap": "250", "spent": "200"}, "installation": {"cap": "150", "spent": "0"}},
  "suppliers": ["cooling_supplier", "installer"],
  "events": [{"type": "spent", "category": "equipment", "amount": "200", "tx": "..."}]
}
```

- Page sections, top to bottom: pool bar (raised vs goal) with each contributor's share; milestone timeline with status; verifier panel with Approve and Reject buttons; caps table (cap, spent, remaining per category); spend log with a visible **Blocked** state; refund panel.
- Show amounts as whole USDC in the UI; convert from 7-decimal base units in one helper.

**Done when (Gate 1, 22:30):** a full click-through of the four demo moments works on mock data.

## B2. Connect to the contract (22:30 tonight to 09:00)

- Install the generated client from `packages/bindings` and `@stellar/stellar-sdk`. Point it at testnet RPC and the contract ID from `.env`.
- **Signing, fastest route:** a demo mode that signs with the testnet demo keys (amara, baraka, chidi, verifier, recipient) loaded from local env. Testnet only, never commit keys, never reuse on mainnet. A role switcher in the UI selects who is acting.
- **Upgrade if time allows:** Freighter (`@stellar/freighter-api`) or Stellar Wallets Kit for real wallet connect.
- Poll `get_state` and the views every few seconds, or refetch after each action.

**Done when (Gate 2, 09:00):** pool bar, contributions and approve button work against the live testnet contract.

## B3. Blocked state, explorer links and polish (to the 09:30 code freeze)

- Over-cap `spend` shows a clear red **Blocked: cap exceeded** message with the cap, the spent amount and the attempted amount. A payment to an unapproved wallet shows **Blocked: not an approved supplier** (if the allowlist is built).
- Every action shows its transaction hash as a link to a Stellar testnet block explorer.
- Disabled-button states for wrong status (for example Approve before the pool is funded).
- Seed the page so the demo starts from a clean state after `demo-reset.sh`.

**Done when (09:30 code freeze):** the full demo runs from the page after one reset.

## B4. Supplier dropdown and allowlist states (only if the allowlist is built)

- The spend form's supplier field is a dropdown of approved suppliers (`cooling_supplier`, `installer`) plus a demo option, "Unknown wallet (stranger)", used to show the allowlist block.
- The AI agent and x402 are roadmap only: no `agent/` folder in the MVP.

## B5. Backup video support (10:00 to 10:30 tomorrow)

Record a rough first take as soon as the flow works end to end. After the code freeze, screen-record the full demo twice from a fresh reset and keep the better take as the backup.

---

# Shared rules

- **Interface changes** need both builders to agree, then `docs/INTERFACE.md` is updated first and the bindings regenerated.
- **Commits:** small and often, plain messages, `git pull --rebase` before push. Add a line to the README "Built this weekend" log when something is finished.
- **Checkpoints:** Gate 1 at 22:30 tonight (pool, approve, release on testnet; page on mock data), Gate 2 at 09:00 (over-cap spend reverts, allowlist works or is cut; page on live data), code freeze 09:30, submit by 11:30. If a gate is missed, drop everything not on the critical path.
- **Cut list, in order:** the supplier allowlist (if not working at Gate 2), refund UI (show the refund as an explorer transaction), separate verifier view (use the CLI). The agent and x402 are already out. Never cut contributing, verifier approval, the visible release, the blocked over-cap spend, or the backup video.

# Starter prompts for AI coding tools

**Package A (paste into your tool, with `docs/INTERFACE.md` and `AGENTS.md` in the repo):**
"Implement the Soroban contract in `contracts/pool` exactly as specified in `docs/INTERFACE.md`. Build in stages: first the constructor and `contribute`, then `approve_milestone`, then reject and refund, then caps and `spend`. Update state before external token transfers, use checked arithmetic, extend TTL on writes, and write the tests listed in the spec alongside each stage. Do not change the interface without telling me."

**Package B:**
"Build a one-page Vite + React + TypeScript app in `web/` that implements the four demo moments in `docs/DEMO.md`. Put all contract access behind a `chama.ts` data layer that matches `docs/INTERFACE.md`, returning the mock data shape in `docs/TECHNICAL_PLAN.md` for now. Show an explicit Blocked state when a spend exceeds its cap. When `packages/bindings` is committed, swap the mock internals for the generated client without changing the page."
