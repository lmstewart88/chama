---
title: "Chama: Stakeholders, User Journeys and Frontend Direction"
date: "25 October 2026"
---

**Companion to:** the four screen mockups ("Chama App Screens"), `FRONTEND_PLAN.md` and `FRONTEND_FRAMEWORK.md`.

**Refreshed 25 Oct, 19:15:** the example is a cold-storage unit for an SME (commercial wedge), the recipient is the SME owner, and suppliers appear on an approved list. The agent is roadmap only.

# What the tool is

Chama is a **shared project page** where a group pools USDC for one project back home, an independent verifier releases the money in tranches, and the project can only spend it inside category caps. It is not a wallet app and not a marketplace. One project, one page, four roles, four states.

**The one idea every screen must make obvious:** *the money moves only when someone independent says the work is done, and everyone can see it.*

# Stakeholders

## Primary users (the four roles in the contract)

| Stakeholder | Who they are | What they want | What worries them | What they must see and do on the page |
|---|---|---|---|---|
| **Contributor** | A diaspora member putting in part of the pool (Amara, Baraka, Chidi in the demo) | To help a real project and know where the money goes | "Will it be skimmed? Is the project real? Can I get my money back?" | Their own share of the pool, the progress bar, the milestone rules in plain words, a clear Contribute action, and the refund rule |
| **Verifier** | An independent person, such as a local engineer, who is not the project owner | To approve only work they have seen | Being pressured to approve; unclear evidence; blame if it goes wrong | The evidence for the milestone, exactly what Approve releases, an equally clear Reject, and proof that they are independent |
| **Project owner (recipient)** | The SME owner or contractor running the project (for example the cold-storage unit); its wallet pays approved suppliers | To get paid on time and buy what the project needs | Money stuck behind rules they don't understand | What is released and spendable, the caps per category, a payment form, and a clear reason when a payment is refused |
| **Admin** | The person setting up the project (you, in the demo) | To set milestones, caps and roles correctly once | Setting it up wrong and being unable to change it | Setup happens in scripts for the MVP; the page only shows the result |

## Secondary stakeholders (shape the design, no screen of their own)

| Stakeholder | Why they matter | Design consequence |
|---|---|---|
| **Hackathon judges and audience** | They decide the outcome and see the demo from a distance in 3 minutes | Large type, one obvious action per screen, a visibly red Blocked state, explorer links as proof |
| **Beneficiaries** (the SME's staff, local farmers and customers) | The reason for the project | Name the project in human terms ("Cold-storage unit"), not a contract ID |
| **Suppliers** (cooling-unit supplier, installer) | Receive the payments | Shown by name and wallet in the spend log and on the approved list (if the allowlist is built); no login in the MVP |
| **Local field partner or vetting network** | Makes "is the project real?" credible | Roadmap: shown as a "vetted by" line. Not built in the MVP |
| **Regulators and licensed partners** (later) | Needed before any returns, off-ramps or fiat | No returns language on the page; labelled testnet demo |

# What the roles need from the frontend

1. **One page, role-aware.** The same project page changes what is emphasised by role. In the demo a role switcher in the header stands in for real login.
2. **Plain language over crypto language.** "Release", "refund", "cap", "verifier". Say USDC once and what it is. Never show raw addresses as the main label; show names with a short address.
3. **Show the rules, not only the numbers.** Each screen says in a sentence what the contract will do ("Approving releases 400 USDC. Rejecting stops the project").
4. **Trust cues everywhere.** An explorer link on every action, the contract ID in the footer, a "testnet demo, no real money" line.
5. **Make refusals feel like the product working.** The Blocked state is a feature: it says the contract refused, why, and that no money moved.
6. **Phone-friendly layouts.** Diaspora contributors are likely on phones (an assumption to check). The mockups stack at phone width.
7. **Accessible by default.** Real buttons and labels, 44px touch targets, contrast checked, and Blocked and Approved shown by word as well as colour.

# User journeys (one per role)

**Contributor (Chidi)**
1. Opens the project link. Sees the goal, the progress bar and who has contributed.
2. Reads that money is released only on the verifier's approval, and refunded if a milestone is rejected.
3. Enters an amount and contributes. Sees a confirmation with a transaction link and their share update.
4. Later, sees the milestones move. If one is rejected, claims their refund.

**Verifier**
1. Opens the project once it is Funded. Sees the milestone and the evidence.
2. Understands exactly what Approve will release.
3. Approves or rejects. Sees the result and the transaction link.

**Project owner (project wallet)**
1. Sees released and spendable money, and the caps per category.
2. Pays a supplier within a cap and sees it logged with a link.
3. Tries a payment over a cap and sees it Blocked, with the numbers, and no money moved.

**Judge watching the demo**
1. Understands the project in 10 seconds from the title and one-line explanation.
2. Sees money go in, a release, a refusal and a refund, each with a link.
3. Can repeat the story in one sentence.

# How the mockups map to the stakeholders

| Screen | State | Main stakeholder | Moment it proves |
|---|---|---|---|
| 1. Pool open | Open, collecting | Contributor | Pooling and visible shares |
| 2. Funded | Awaiting milestone 1 | Verifier | Release only on independent approval |
| 3. Spend and Blocked | Milestone 1 approved | Project owner | Category caps refuse an over-cap payment |
| 4. Rejected | Stopped | Contributors | Pro-rata refund of what was never released |

# Design direction

- **Look:** calm, civic and trustworthy. A deep teal for primary actions, warm amber for "waiting", green for done, red only for Blocked and Rejected. Clean white cards on a pale ground.
- **Type:** Manrope for headings and large numbers, Inter for text and labels.
- **Hierarchy:** the biggest thing on each screen is the amount or the decision. One primary button per screen state.
- **Not in the MVP look:** crypto-style dark neon, token charts, wallet jargon.

# Implications for the frontend framework

| Decision | Because |
|---|---|
| A **role switcher** in demo mode, then real wallet connect as an upgrade | The demo needs four actors acting in turn on one page |
| One page, **state-driven sections**, no router | Four states of the same project; simpler for a two-person build |
| Components per card: pool, contributors, milestones, caps, spend form, spend log, refund panel | Matches the screens and the slices in `FRONTEND_PLAN.md` |
| A shared **status chip** and **ActionStatus** component (sending, success with link, Blocked, error) | The same feedback pattern appears on every action |
| Amounts always in whole USDC via the `format.ts` helpers | Readable to non-technical users and safe with `bigint` |
| Plain-language **rule line** under every action button | The key trust message for contributors and the verifier |
| Mobile-first layout with flex-wrap | Likely phone users, and judges may view on a laptop |

# Open questions for the team

1. **Who is the verifier in the real world?** A local engineer, a partner NGO, a panel? The pitch should name one example.
2. **Who sets the caps, and can they change?** In the MVP the admin sets them before approval and they are fixed after.
3. **How does a contributor first arrive?** A shared link in a WhatsApp group is the likely route. Worth one line in the pitch.
4. **How much of the evidence is shown?** The MVP shows a placeholder. A real version links to documents or photos.
5. **Are contributors really on phones?** Confirm with a quick check of your own network before the pitch claims it.
