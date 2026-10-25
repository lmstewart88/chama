---
title: "Chama: Build Order (Contract and Frontend)"
date: "25 October 2026"
---

**Refreshed 25 Oct, 19:15.** Hour gates are replaced by clock times. The full schedule is in `SHIP_PLAN`. Deadline: submit by 11:30, ship by 12:00 on 26 Oct.

**For:** Lydia (on-chain) and the frontend teammate. **Interface:** `INTERFACE.md`.

# Soroban or smart contract first?

They are the same thing: Soroban is Stellar's smart-contract platform, and the Chama contract is written in Rust on Soroban. The real question is contract versus frontend, and the answer is both in parallel, with the contract on the critical path.

# Build order

| Time | On-chain (Lydia) | Frontend (teammate) |
|---|---|---|
| 19:00 to 20:00 | Contract skeleton with all signatures from `INTERFACE.md`, including `add_supplier`. Deploy to testnet | Scaffold spike (20-minute rule), then the page on mock data with cold-storage fixtures |
| 20:00 | Share the contract ID and generated bindings | Receive bindings |
| 20:00 to 22:30 | Pool, contribute, approve, release | All four states from mock data |
| **22:30 Gate 1** | Pool and release work on testnet | Fund and release switched to live |
| 22:30 to 23:30 | Reject and refund (continue if energy allows) | Blocked state and explorer links |
| Night | Stop (or push on to about 01:00 if safe) | |
| 07:00 to 09:00 | Caps, spend, allowlist, tests, `demo-reset.sh`, `demo-flow.sh` | Remaining functions live, mobile layout |
| **09:00 Gate 2** | Refund, caps and spend work. Allowlist works **or is cut** | All functions live or labelled mock |
| **09:30 Code freeze** | README and repo tidy | Bug fixes only |
| 09:30 to 10:30 | Screenshots, then backup video | Same |
| 10:30 to 11:15 | Two rehearsals | |
| **11:30 Submit** | Buffer before the 12:00 deadline | |

# Rules for working in parallel

1. **The interface is frozen.** If a signature must change, tell the other person immediately and update `INTERFACE.md` first.
2. **Mock first, live second.** Each function in `chama.ts` has a `LIVE` flag, so the page always runs.
3. **Bindings are generated, not hand-written.** After each redeploy run `stellar contract bindings typescript` and share the new contract ID.
4. **Amounts have 7 decimals** (500 USDC is 5_000_000_000). Use `bigint` and the `format.ts` helpers.
5. **Testnet only. Never commit keys.**
6. **Say only what the contract does.** See `CLAIMS`.

# If the contract runs late

The demo still works. The frontend runs on mock data for any function not yet live, and the demo shows real transactions for the slices that are. Cut order: the supplier allowlist, then the refund UI, then the separate verifier view. Never cut contribute, verifier approval, the visible tranche, the blocked over-cap payment or the backup video.
