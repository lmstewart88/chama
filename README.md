# Chama

> **Try the live app: https://chama-lovat.vercel.app/#/projects/enterprise**
>
> - **Live testnet app (use this one):** https://chama-lovat.vercel.app/#/projects/enterprise
>   Reads the deployed Chama pool contract on Stellar testnet. Actions are signed by a
>   Freighter wallet on testnet and use test USDC only. No real funds.
> - **Earlier simulated build (backup):** the link in our submission form. It runs on mock
>   data with no wallet and no contract. It shows the same steps, but nothing is on chain.
>   We kept it as a failsafe in case the live app or Freighter is unavailable.
>
> To see the contract working without a wallet, see `scripts/demo-flow.sh` and the backup
> video. The contract has 13 passing tests (`cargo test`), and the contract and token IDs
> are in `.env.example`.
>
> The live pool is one shared testnet contract. If someone has already used it, it may show Funded or Failed instead of Open, with contributions or refunds left by earlier visitors. That is expected; the team resets it between runs.

Demo video (simulated guided demo, not on chain): https://youtu.be/cLbUqV0q44g

Full explanation of what each link shows and how to verify: [docs/SUBMISSION_NOTES.md](docs/SUBMISSION_NOTES.md)

Diaspora communities already pool money for projects back home (mchango, chama, pardner, susu). Chama makes that money visible and rule-based on Stellar: contributors pool USDC into a Soroban contract to finance infrastructure for an SME, such as a cold-storage unit. A separate verifier wallet releases it in tranches, and released money can only be spent on supplier wallets approved by the admin, inside per-category caps. If a milestone is rejected, contributors get back their share of what was never released.

Built for Hack Meridian Lisbon (Genesis track), 25 to 26 October 2026.

## MVP

1. Three wallets fund the pool, and each contributor's share is shown.
2. The verifier approves milestone 1, and the tranche becomes spendable.
3. The project wallet spends within its category cap; an over-cap spend is refused.
4. The verifier rejects a later milestone, and contributors claim pro-rata refunds.

The AI agent, x402 payments, a contract acting as payer, mobile-money and bank off-ramps, and any returns structure (with a licensed partner) are roadmap, not built. Testnet only: no returns are promised.

Chama began as an earlier prototype (chama-pool v1). Confirm and state exactly what was built this weekend before submitting.

## Why Stellar

Low-cost USDC transfers, Soroban smart contracts for the rules, and a route to local payouts through anchors. See `docs/` for the interface, demo script and technical plan.

## Built this weekend

A running log. Add a line when you finish something.

- [ ] Repo and scaffold
- [ ] Slice 1: fund the pool
- [ ] Slice 2: verifier release
- [ ] Slice 3: caps and spend
- [ ] Slice 4: reject and refund

## Prior work

An earlier prototype (`lmstewart88/chama-pool`) pooled funds and released everything when the goal was met. It was built before this hackathon. This repository starts fresh: the verifier, milestones, caps, refunds and the web app are all new this weekend.

## Team

- Backend (Soroban contract, scripts): Lydia Mangeni
- Frontend/ UX (web app): April Walker
- Pitch and research: Gianna Shamone

## Docs

- `docs/INTERFACE.md`: the contract interface (source of truth)
- `docs/DEMO.md`: the 3-minute demo script
- `docs/TECHNICAL_PLAN.md`: two work packages
- `docs/TESTING.md`: test checklist and demo numbers
