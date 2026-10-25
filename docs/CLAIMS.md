---
title: "Chama: Claims We Can Make (and Must Not)"
date: "25 October 2026"
---

**Rule:** every slide and spoken line says only what the contract does, what the team has agreed, or what is clearly labelled as next. Judges and VCs will test the strongest claim.

# What the contract does (MVP)

| Claim | Status | Safe wording |
|---|---|---|
| Money is pooled with tracked shares | Built | "Each contributor's share is recorded on-chain" |
| Money is released only when the verifier signs | Built | "Nothing moves until the verifier signs" |
| The verifier is a different wallet from the SME | Built (checked at setup) | "A separate signer", not "independent" |
| Spending is capped per category | Built | "The contract refuses any payment over a category cap" |
| Payments only go to approved suppliers | **Planned, in the hour-6 gate** | If built: "The SME can only pay suppliers the admin has approved". If not: leave this line out |
| Refunds are automatic and proportional | Built | "Contributors get back their share of what was never released" |
| Refund numbers are computed by the contract | Built | "300, 180 and 120 come from the contract, not the screen" |

# What the contract does NOT do

| Do not say | Why | Say instead |
|---|---|---|
| "The contract checks the work is real" | The verifier attests. The contract only enforces who signs | "The verifier attests, and the contract enforces the rest" |
| "Money can only be spent on the equipment" | The contract checks the payee, amount and category, not what was bought | "Money can only go to approved suppliers, inside caps" (if the allowlist is built) |
| "Independent verifier" as a technical fact | The contract checks a different wallet, not a different person | "Separate verifier wallet" and, in the story, "an independent engineer or auditor" |
| "All your money is protected" | Released tranches are not clawed back | "Unreleased money is refundable. A released tranche is earned by verified work" |
| "Contributors earn returns" | No returns, and regulation applies | "Returns structure with a licensed partner" on the roadmap |
| "Chama takes a 1.5% fee" | The fee is UI-only | "Illustrative: 1.5% = 15 USDC. Not charged on testnet" |
| "Our customers" or "our pilots" | Nothing is agreed yet | "Pilot targets in Kibera and Kitale" |
| The agent or x402 in the product | Roadmap only | "Next: agents and micropayments" |

# Likely judge questions about the contract

| Question | Answer |
|---|---|
| What happens to released but unspent money after a rejection? | It stays in the contract under its caps. Contributors are refunded from what was never released. Returning unspent released funds is a next step |
| Can the SME pay itself? | Only if it is a registered supplier and inside the caps. The admin controls the list. (If the allowlist is not built: "Only inside the category caps.") |
| Who is the verifier? | A separate wallet held by an independent person, such as a local engineer or auditor. Role, not a named person, until one agrees |
| What if the verifier and SME collude? | Small first tranche, category caps and the supplier list limit the loss. Multiple verifiers and a vetting network are next |
| Is the fee in the contract? | No. It is shown in the UI as illustrative |

# Pitch versions

| Round | When | Length | Focus |
|---|---|---|---|
| Judging | Tomorrow (26 Oct) | Aim for 2:30 to 3:00 (up to 5 allowed) | Working MVP, problem, technical execution |
| VC pitch (six finalists) | 28 and 29 Oct | Same core, plus traction and ask | Add: one real pilot conversation, a named verifier, fee numbers, regulatory plan |

# Between judging and the VC pitch

1. Have one conversation with an SME in Kitale or Kibera and, if it goes well, ask for a pilot or letter of support.
2. Ask one person to agree to be the verifier.
3. Check the remittance and cost figures against their original sources.
4. Speak to a licensed partner or lawyer about the returns structure, even briefly.
