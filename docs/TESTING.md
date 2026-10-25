# Testing checklist

Run after every slice, from a fresh `scripts/demo-reset.sh`.

## Demo numbers
- Goal 1,000 USDC. Contributions: Amara 500, Baraka 300, Chidi 200.
- Milestones 4000 / 3000 / 3000 bps = 400 / 300 / 300 USDC.
- After approving milestone 1: released = 400.
- Tranche 1 caps: equipment 250, installation 150.
- Cooling-unit payment 200: equipment spent 200, remaining 50.
- A further payment of 100 from Equipment: refused with CapExceeded.
- Reject milestone 2: refund pool = 1,000 - 400 = 600. Refunds: Amara 300, Baraka 180, Chidi 120.

## Per slice
- [ ] Slice 1 (fund): three wallets contribute from the page; the pool bar and shares are right.
- [ ] Slice 2 (release): approve milestone 1; 400 released; only the verifier can approve.
- [ ] Slice 3 (caps): cooling-unit payment 200 succeeds; a further 100 shows Blocked; a payment to an unapproved wallet shows Blocked (if the allowlist is built); only the recipient can spend.
- [ ] Slice 4 (refund): reject milestone 2; refunds 300 / 180 / 120; a second refund is refused.

## Layers
1. Contract unit tests: `cargo test`
2. CLI smoke test: `scripts/demo-flow.sh`
3. UI check on live testnet from the page
If the page misbehaves, run the same step from the CLI. CLI works: UI bug. CLI fails: contract bug.
