# Instructions for AI coding tools

## Project
Chama: a Soroban contract on Stellar testnet plus a one-page web app. A USDC pool releases only when an independent verifier approves a milestone, refunds contributors if one is rejected, and lets the project wallet spend released money only within category caps.

## Source of truth
`docs/INTERFACE.md` defines every contract function, role, error and test. Do not change the interface without the human telling you to; if a change is needed, update `docs/INTERFACE.md` first.

## Folders and owners
- `contracts/`, `scripts/`, `packages/bindings/`: backend. `packages/bindings` is generated; do not hand-edit.
- `web/`: frontend.
- `docs/`: shared.
Stay inside your own folder.

## Soroban rules
- `#![no_std]`. Persistent storage with `extend_ttl` on writes.
- Call `require_auth()` for the role that must sign.
- Update state before any external token transfer.
- Use checked arithmetic on every i128 operation.
- Build in stages and write the tests listed in `docs/INTERFACE.md` alongside each stage.

## Commands
- Build: `stellar contract build`
- Test: `cargo test`
- Bindings: `stellar contract bindings typescript --network testnet --contract-id $CHAMA_CONTRACT_ID --output-dir packages/bindings --overwrite`

## Safety
- Testnet only. Never put secret keys in code, docs or commits; they live in `.env`, which is git-ignored.
- Amounts have 7 decimals (500 USDC = 5_000_000_000). Use bigint in TypeScript.
- Keep `main` runnable. Commit small and often.
