# Chama Pool React frontend

The approved reference-based homepage remains the default route. Its visual
layout is preserved. Explore projects opens the funding workspace.

## Start locally

Use Node 22.12 or newer (the `.nvmrc` selects Node 22).

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite on the same computer. For verification:

```sh
npm test
npm run build
```

The build output is `dist/`. For Vercel, set the root to `web` when installed in
the team repository, build command `npm run build` and output directory `dist`.
This source has not been pushed to the team GitHub repository.

## Interactive demo

Open Fresh Food Cold Storage. Other projects are illustrative opportunities.

1. Connect the demo account (Amara). Review and confirm 500 USDC.
2. Select Baraka and confirm 300 USDC, then Chidi and confirm 200 USDC.
3. Select Verifier, open Milestones, review and approve milestone 1: 400 USDC.
4. Select Project operator, open Spending and pay the approved cooling supplier
   200 USDC from Equipment. Try another 100: cap 250, spent 200, remaining 50.
5. Select the unknown wallet and try 50 USDC: SupplierNotApproved.
6. Select Verifier and reject milestone 2.
7. Open Refunds and select each contributor to review and claim 300 / 180 / 120.
   Claimed accounts cannot claim twice. Approved allocations remain spendable.

The guided next-step panel also helps switch accounts and select the relevant view.
Contributions, decisions, payments and refunds have review dialogs. Failed payment
attempts are recorded locally in Spending. Successful mock actions appear in Activity.
Reset demo or reload to restart. Everything is in memory and no wallet is connected.

## Implementation

* `src/pages/About.tsx`: approved homepage (preserve its design).
* `src/pages/ProjectWorkspace.tsx`: guided demo and account-specific controls.
* `src/components/ProjectCard.tsx`: project discovery cards.
* `src/types.ts`: contract-shaped frontend types and service interface.
* `src/services/mock.ts`: async mock with exact named errors and per-milestone caps.
* `src/services/index.ts`: single adapter selection point for later integration.
* `src/format.ts`: bigint seven-decimal parsing/formatting.
* `docs/CONTRACT_INTERFACE.md`: supplied backend specification snapshot.
* `docs/BACKEND_HANDOFF.md`: live integration requirements.

All amounts are bigint token base units. Never JSON.stringify these objects without
converting bigint to strings. Percentage display alone uses small Number values.

## Not live yet

Real wallet connection/signing, deployed contract calls, real supplier addresses,
RPC transaction polling, explorer links, evidence uploads, admin configuration and
revenue distributions are not implemented. The supplier allowlist is implemented
only in the mock and still requires backend confirmation. No secret keys are used.

## Photos

Illustrative photographs are credited to Rockwill, ColdHubs / Food Planet Prize
and BasiGo. These do not imply partnerships. Confirm publication rights or replace
with licensed images before a public launch.
