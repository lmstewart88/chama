# Submission notes (Hack Meridian Lisbon, Genesis track)

These notes explain exactly what we built, what each submitted link shows, and how to check it. They were added after submission so reviewers have an accurate picture.

## What we built this weekend

One Soroban smart contract (Rust, compiled to WASM) on Stellar testnet. A pool of USDC that:

1. Takes contributions until a 1,000 USDC goal is reached. Nothing is released at that point.
2. Releases money in **three steps** (40% / 30% / 30%), in order, only when a **separate verifier wallet** approves. The verifier cannot be the same wallet as the business (enforced when the contract is created).
3. Lets the business wallet spend released money only **to suppliers the admin has approved**, and only **within per-category caps** (Equipment 250, Installation 150 in the demo).
4. If the verifier rejects a step, refunds each contributor their share of the money that was never released: `contribution x unreleased / total raised` (300 / 180 / 120 USDC in the demo).

Contract source: `contracts/pool/src/lib.rs`. Interface and error codes: `docs/INTERFACE.md`. Chama began as an earlier prototype (`chama-pool` v1); the verifier release, caps, approved suppliers, refunds, scripts and web app were built this weekend.

## What each link shows

| Link | What it is |
|---|---|
| **Live app** (top of the README) | The web app in live mode. It reads the deployed contract on Stellar testnet and is built to sign actions with a Freighter wallet using test USDC. |
| **Demo video** (YouTube, unlisted) | A walkthrough of the **simulated guided demo**: same steps and numbers, but on mock data, so nothing in the video is on chain. The live testnet version is the app linked at the top of the README. The timestamp in the video description ("product demo starts at 1:28") is inaccurate; that point is the end screen, so watch from the start. |
| **Earlier simulated build** (link in the submission form) | Mock data only. No wallet, no contract. Kept as a failsafe. |

## How to verify the on-chain part

- **Tests:** run `cargo test`. 13 tests pass: the 12 required cases in `docs/INTERFACE.md` plus a rounding test.
- **Contract and token IDs** (see `.env.example` and `web/src/services/config.ts`):
  - Contract: `CCIN5YYNDCAKI5L25MVCXUX3N4ROHI6ZPJUPWDYUFF2KBEL6NHOVKCRE`
  - Token (our own test USDC): `CCFFHHB6VMBBJWP5FWFNLTB4AUQLSTMVYTO5CN4BMU3BWACOQMLB4G6Z`
  - Paste either ID into https://stellar.expert/explorer/testnet to inspect it. Every reset creates a new contract ID (see Reset below), so older IDs in the git history are expected to differ.
- **End-to-end run:** `scripts/demo-flow.sh` runs the whole story from the command line against the contract in `.env`: three contributions, verifier approval, a 200 USDC supplier payment, a refused 100 USDC over-cap payment (`#7`), a refused payment to an unapproved wallet (`#12`), a rejection, and refunds of 300 / 180 / 120. It passed in full on testnet before submission. It needs the team's testnet keys, so reviewers will mostly rely on the tests and the contract on the explorer.
- **Reset:** `scripts/demo-reset.sh` deploys a fresh contract and sets up the demo wallets. Each reset creates a new contract ID, so the live pool is shared and may show Funded or Failed after use. That is expected. After a reset, the Vercel environment variables must be updated and the app rebuilt.

## Honest limits

- **The verifier attests to the real world; the contract cannot.** It enforces who signs, the order of steps, the caps, who can be paid and the refund maths. It does not check what was bought.
- **Testnet only, not audited.** The token is a test USDC we issued for the demo, not real USDC.
- **Released money that is not spent stays in the contract** under its caps. Returning unspent released funds is a next step.
- **The 1.5% platform fee shown in the app is an illustration.** It is not in the contract and is not charged.
- **No returns are offered or promised.** A returns structure would need a licensed partner and sits on the roadmap, with M-Pesa and bank cash-out, pilots (targets in Kibera and Kitale, none agreed), and the AI agent and x402 payments. None of these are built.
- **The web app still says "milestone"** in places where our pitch says "step". It is the same thing.
- **The older guided demo shows "independent verifier".** The contract enforces a *separate* verifier wallet, which is what we claim.

## Team

Backend and contract: Lydia Mangeni. Frontend and UX: April Walker. Pitch and research: Gianna Shamone.
