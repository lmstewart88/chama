---
title: "Chama MVP: Frontend Plan"
date: "25 October 2026"
---

**Owner:** frontend teammate. **Time:** about 7 hours of work before the 09:30 code freeze (about 6 if the Scaffold Stellar template works). **Works to:** `docs/INTERFACE.md`. **Framework details:** `docs/FRONTEND_FRAMEWORK.md`.

**Goal:** one page that makes the four demo moments obvious from the back of a room: fund the pool, verifier releases a tranche, an over-cap spend is Blocked, a rejected milestone refunds contributors.

**Refreshed 25 Oct, 19:15.** Fixtures are now a cold-storage unit (Equipment and Installation caps), the agent slice is replaced by the supplier-allowlist slice, and hour gates are clock times. Deadline: submit by 11:30, ship by 12:00 (see `SHIP_PLAN`).

# Step 0: framework spike (15 to 20 minutes, before anything else)

Stellar's official Scaffold templates (React or Svelte) ship wallet connect, network switching and generated typed clients. Test whether that saves time.

1. In a scratch folder, run the Scaffold init with the React template (the form shown at the workshop is `stellar scaffold init my-app --template ...`; if the subcommand is missing, find the install step in the Scaffold docs).
2. Run the app. Can you connect a wallet and see the example component call its contract?
3. **Decide at the 20-minute mark.**
   - **Works:** adopt it (Path A in `FRONTEND_FRAMEWORK.md`). Tell the backend lead so the repo layout is changed once, together.
   - **Doesn't work or is unclear:** use plain Vite + React + TypeScript (Path B). Do not spend more time on it.

# Slices

Work one slice ahead of the backend on mock data. When the backend lead commits the bindings for a slice, flip that slice from mock to live.

| Slice | Page deliverable | Mock to live when | Done when |
|---|---|---|---|
| 1. Fund the pool | Pool bar (raised vs goal), each contributor's share, status chip | `contribute`, `get_state`, `get_contribution` are live | Three wallets fund it from the page and the bar fills |
| 2. Verifier release | Milestone timeline, Approve button (verifier role), tranche shown as released | `approve_milestone`, `get_milestone` are live | Approving milestone 1 shows 400 released |
| 3. Caps and spend | Caps table (cap, spent, remaining), spend form with a supplier dropdown, spend log, red **Blocked** state | `set_caps`, `spend`, `get_remaining` are live | Cooling-unit payment 200 succeeds, a further 100 shows Blocked (cap) |
| 4. Reject and refund | Reject button, refund panel with each contributor's amount | `reject_milestone`, `refund`, `get_refundable` are live | Refunds show 300 / 180 / 120 |
| 5. Allowlist block (only if built) | Approved-supplier list and an "Unknown wallet" option in the spend form | `add_supplier`, `is_supplier` are live | A payment to the unknown wallet shows Blocked: not an approved supplier |

# Timeline

| Time | Work | Gate |
|---|---|---|
| 19:00 to 20:00 | Step 0 spike. Create the `web/` (or scaffold app) skeleton. Read `INTERFACE.md` | Framework decided |
| 20:00 to 22:30 | Page on mock data with cold-storage fixtures: slices 1 and 2, then the layout for slices 3 and 4 | **Gate 1, 22:30: click-through of all four demo moments on mock data. Slides get draft screenshots** |
| 22:30 to 23:30 | Flip slices 1 and 2 to live. Build the Blocked state and caps table | Stop for the night |
| 07:00 to 09:00 | Flip slices 3 and 4 (and 5 if built) to live. Explorer links on every action. Disabled and loading states | **Gate 2, 09:00: full demo from one `demo-reset.sh`** |
| 09:00 to 09:30 | Bug fixes only | **Code freeze 09:30** |
| 09:30 to 10:30 | Final screenshots, check mobile, record the backup video with the backend lead | Better take kept |

# Page layout, top to bottom

1. **Header.** Project name ("Cold-storage unit", a produce SME), status chip (Open, Funded, Complete, Failed), a role switcher (Contributor Amara, Baraka, Chidi; Verifier; Project wallet) in demo mode.
2. **Pool.** Progress bar of raised vs goal in whole USDC, then one row per contributor with their amount and percentage share.
3. **Milestones.** Three cards in a row: tranche size, status (Pending, Approved, Rejected), and the Approve and Reject buttons visible only to the verifier role.
4. **Caps and spend.** Table of categories with cap, spent and remaining. A spend form (category, supplier dropdown, amount). A spend log below, newest first, each row with an explorer link.
5. **Refunds.** Visible when the status is Failed: each contributor's refundable amount and a Claim refund button.
6. **Footer.** The contract ID and a link to it on the explorer.

# States every action must handle

| State | What the user sees |
|---|---|
| Idle | Button enabled only when the action is valid for the current status and role |
| Sending | Button shows a spinner; the rest of the page stays usable |
| Success | Green confirmation with the transaction hash as an explorer link |
| Blocked (cap exceeded) | Red banner: category, cap, already spent, attempted amount, and "Blocked by the contract" |
| Blocked (not an approved supplier) | Red banner: "This wallet is not on the approved supplier list. No money moved." (only if the allowlist is built) |
| Other error | Plain-language message with the raw error in a collapsed details line |
| Wrong status | Button disabled with a short reason ("Waiting for the pool to be funded") |

# What you need from the backend lead

| Item | When |
|---|---|
| `docs/INTERFACE.md` frozen | 20:00 |
| Bindings committed and the contract ID in `.env` | 20:00 (skeleton), then after every redeploy |
| Error number table for the contract errors (including `SupplierNotApproved`) | Gate 1, 22:30 |
| `demo-reset.sh` working | Gate 2, 09:00 |
| A message each time something is redeployed | Every time |

# Test checklist (run after each slice from a fresh reset)

- [ ] Slice 1: three wallets contribute; the bar reaches 1,000; shares are 50, 30 and 20 percent
- [ ] Slice 2: only the verifier sees Approve; milestone 1 approves; released shows 400
- [ ] Slice 3: cooling-unit payment 200 succeeds (equipment remaining 50); a further 100 shows Blocked; the log shows both attempts
- [ ] Slice 5 (if built): a payment to the unknown wallet shows Blocked: not an approved supplier
- [ ] Slice 4: reject milestone 2; refunds show 300 / 180 / 120; a second claim is refused
- [ ] Every successful action shows a working explorer link
- [ ] If the page misbehaves, run the same step from the CLI (`scripts/demo-flow.sh`). CLI works: UI bug. CLI fails: contract bug

# Cut list (in order)

1. The allowlist UI (if the allowlist is cut at Gate 2)
2. Real wallet connect (keep demo-mode role switcher)
3. The refund panel (show refunds as explorer transactions instead)
4. A separate verifier view (the verifier role switch already covers it)

Never cut: contribute, the Approve action, the visible released tranche, the Blocked state, the backup video.

# Risks

| Risk | Mitigation |
|---|---|
| Bindings arrive late | Mock per function from the start, so slices flip one at a time |
| `bigint` mistakes | One `format.ts` helper; never use `number` for amounts |
| Wallet connect trouble | Demo-mode signing with testnet keys is the default; real wallet is an upgrade |
| Browser errors about `Buffer` or `global` | Add a Node polyfill plugin for Vite |
| Scaffold spike eats the morning | Hard 20-minute limit, then Path B |
