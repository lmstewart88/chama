# DEMO.md: demo script (cold-storage case)

**Scenario:** a group of diaspora contributors pools 1,000 USDC to fund a cold-storage unit for a produce SME in Kenya. A separate verifier wallet releases the money in three tranches. The SME can only pay approved suppliers, inside category caps. The whole pitch runs 2:30 to 3:00 (see `PITCH_PLAN`). This demo is about 70 to 80 seconds of it.

## Setup numbers (use these so the maths on screen is predictable)

| Item | Value |
|---|---|
| Goal | 1,000 USDC |
| Contributors | Amara 500, Baraka 300, Chidi 200 |
| Milestones (bps) | 4000 / 3000 / 3000 = 400 / 300 / 300 USDC |
| Milestone names | 1 Order and deliver the unit, 2 Install and power, 3 Commissioning and first operation |
| Tranche 1 caps | Equipment 250, Installation 150 (sum 400) |
| Approved suppliers | `cooling_supplier` (cooling unit), `installer` |
| Unapproved wallet | `stranger` (used to show the allowlist block) |

Pre-fund every wallet with testnet USDC the night before. Do not rely on faucets during the demo.

## Wallets (create before the demo, keep keys in `.env`, never commit)

`admin`, `verifier`, `recipient` (the SME), `amara`, `baraka`, `chidi`, `cooling_supplier`, `installer`, `stranger`

## Script

| # | Demo time | Who | Action | On screen |
|---|---|---|---|---|
| 1 | 0:00 | Driver | Amara, Baraka and Chidi contribute | Pool bar fills to 1,000, status Funded, contributor list shown |
| 2 | 0:12 | Driver | Verifier approves milestone 1 | Tranche 1 (400) becomes spendable, explorer link shown |
| 3 | 0:25 | Driver | SME pays the cooling-unit supplier 200 from Equipment (cap 250) | Spent 200 of 250, payment visible in explorer |
| 4 | 0:38 | Driver | SME tries to pay 100 more from Equipment (only 50 left) | Blocked: CapExceeded, with the numbers |
| 5 | 0:50 | Driver | SME tries to pay `stranger` 50 from Equipment | Blocked: SupplierNotApproved (**only if the allowlist is built**) |
| 6 | 1:00 | Driver | Verifier rejects milestone 2 | Status Failed |
| 7 | 1:08 | Driver | Contributors claim refunds | Refund pool = 1,000 - 400 = 600. Amara 300, Baraka 180, Chidi 120 |

**Line to say at step 4:** "This is the product. The business cannot take the money and walk away."

## Expected numbers (check these live)

- After step 2: Released = 400.
- After step 3: Equipment spent 200, remaining 50.
- After step 7: Amara 500 x 600 / 1000 = 300. Baraka 300 x 600 / 1000 = 180. Chidi 200 x 600 / 1000 = 120. Total 600.
- The 200 released but unspent stays in the contract under its caps. Contributors are refunded from the unreleased 600 only.

## Reset

`./demo-reset.sh` redeploys the contract, initialises it with the numbers above, registers the approved suppliers, sets the tranche 1 caps and prints the contract ID. Run it before every rehearsal.

## Fallbacks

- Wallet connection fails: use pre-signed script actions for contribute and approve.
- Testnet is slow: switch to the backup video without apologising.
- Allowlist not built by the hour-6 gate: skip step 5 and use the wording in `CLAIMS.md`.

## Be honest in the room

- The verifier attests. The contract enforces who signs, not whether the work is real.
- The contract limits who is paid and how much per category. It does not check what was bought.
- The fee line is illustrative and not charged on testnet.
- Chama began as an earlier prototype (chama-pool v1). The milestone release, caps, allowlist, refund and this interface were built this weekend. Confirm this is true before saying it.
- No returns are promised. The AI agent and x402 are on the roadmap.

## Rehearsal checklist

- [ ] Reset runs in one command
- [ ] Every step shows an explorer link
- [ ] Demo timed under 80 seconds, twice
- [ ] Backup video recorded twice: once when the hour-6 flow works, once after polish
- [ ] Pitcher and driver know who says what
