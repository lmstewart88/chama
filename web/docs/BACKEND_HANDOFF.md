# Backend handoff

The mock follows the supplied `docs/INTERFACE.md` snapshot, copied unchanged as
`docs/CONTRACT_INTERFACE.md`. The backend implementation remains unavailable.
This is a simulation, not a deployment or security guarantee.

## Frontend now prepared

* All token amounts are bigint with seven decimal places. `src/format.ts` handles
  string input/output without converting balances through JavaScript Number.
* Cold storage is the one interactive pool: 1,000 USDC, Amara 500, Baraka 300,
  Chidi 200; milestones 400/300/300, per milestone Equipment/Installation caps.
* `spend` receives project ID (frontend mapping), milestone index, category symbol,
  supplier address, amount and acting demo account.
* Error numbers 1 through 12 mirror the interface. Authorization errors are
  separate from that enum. No mock error is represented as an onchain rejection.
* Supplier registration and caps are setup fixtures, not user-facing setup calls.
* Approved spending remains allowed after Failed, following the written interface.
  Confirm this with Lydia before connecting a real contract.
* Refunds use total raised minus released and are claimable once per contributor.
* Async states, review dialogs, explicit blocked feedback and activity are ready.

## Mock read mapping

The FundingService exposes getState, getContribution, getMilestone,
getMilestoneCount, getCap, getSpent, getRemaining, getRefundable, isSupplier
and getConfig. Returned frontend objects adapt the contract tuples; view results
must be adapted to the generated bindings rather than assuming an SDK return shape.

listProjects/getProject are frontend aggregation, not multipool contract methods.
Other cards are illustrative only. Only the cold storage demo supports actions.

## Still needed

1. Implemented contract, deployed contract ID, confirmed testnet token ID and bindings.
2. Confirm allowlist inclusion, category semantics and spending after rejection.
3. Choose wallet signing; derive roles from the address, not a browser role selector.
4. Implement src/services/index.ts using the generated client. Keep the SDK and
   bindings out of components. Map project ID to the actual single pool contract.
5. Implement real wallet approval, submission and confirmation states, then refresh
   all reads after confirmed success. Do not treat submission as confirmation.
6. Add RPC/network errors, live refreshing, and real explorer links using actual hashes.
7. Add activity event retrieval and the known demo contributor wallet public keys.

Do not put wallet secret keys in VITE-prefixed variables or browser bundles.
No keys are needed for the current mock. Demo wallet names/addresses are placeholders.

No repayment or revenue-share function exists in this MVP. No returns are shown
in funding balances. Operating revenue collection and investment terms are roadmap.
