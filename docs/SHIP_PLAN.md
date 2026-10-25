---
title: "Chama: Ship Plan to 12:00 on 26 October"
date: "25 October 2026"
---

**Deadline:** everything shipped by **12:00 on Monday 26 October** (Lisbon time). It is 19:00 on Sunday as this plan starts, so there are 17 hours, including sleep. Gates that were "hour 4 / hour 6" now have clock times.

**Rule:** if a gate is missed, cut from the cut list in `INTERFACE.md`. Never cut: contribute, verifier approval, the visible tranche, the blocked over-cap payment, the backup video.

# Timeline

| Time | Lydia (on-chain) | Frontend teammate | Pitch teammate |
|---|---|---|---|
| **19:00 to 20:00** | Contract skeleton with all signatures from `INTERFACE.md` (including `add_supplier`). Deploy to testnet | Scaffold spike (20-minute rule), then the page on mock data with cold-storage fixtures | Script and five slides drafted, using `PITCH_PLAN` and `PITCH_STORY` |
| **20:00** | Share contract ID and generated bindings | Receive bindings | |
| **20:00 to 22:30** | Pool, contribute, approve, release | All four states from mock data | Slides v1 done. Lydia records herself saying the opening once for timing |
| **22:30 GATE 1** | Pool and release work on testnet | Fund and release switched to live | Run through the script with slides |
| **22:30 to 23:30** | Reject, refund (continue if energy allows) | Wire the blocked state and explorer links | |
| **23:30** | **Stop for the night** (or push to gate 2 if you can safely work to about 01:00) | | |
| **07:00 to 09:00** | Caps, spend, allowlist, tests, `demo-reset.sh`, `demo-flow.sh` | Remaining functions to live, mobile layout | Slides v2, Q&A prep, a full run with a timer |
| **09:00 GATE 2** | Refund, caps and spend work on testnet. **Allowlist works, or is cut and the supplier claim dropped** | All functions live or mocked and labelled | |
| **09:00 to 09:30** | **Code freeze** at 09:30. README and repo tidy | Bug fixes only | |
| **09:30 to 10:00** | Take final screenshots: pool, Funded, Spend, **Blocked over-cap**, Refund | Same | Drop screenshots into the slides |
| **10:00 to 10:30** | Record the **backup video** (the full demo, 80 seconds) | Check mobile and the links | |
| **10:30 to 11:15** | Rehearsal 1 and 2 with the live demo and timer | | |
| **11:15 to 11:30** | Final checks: repo public, README, links work, video uploaded, slides exported | | |
| **11:30 SUBMIT** | **Submit with 30 minutes of buffer** | | |
| 12:00 | Deadline | | |

**Insurance:** record a first backup video as soon as the flow works end to end, even if rough. Do it at gate 1 if the release flow is already live.

# What "shipped" probably includes (confirm against the hackathon submission page)

- [ ] Public repo with a clear README (what it is, how to run it, testnet only, v1 disclosure)
- [ ] Contract ID on testnet and explorer links
- [ ] Demo video (the backup)
- [ ] Slides or pitch deck (exported PDF)
- [ ] Live demo link or run instructions
- [ ] Team names and the track (Genesis)

# Risks and what to cut

| Risk | Cut or fallback |
|---|---|
| Gate 1 missed (no release flow by 22:30) | Cut the allowlist now. Focus on pool, release and refund |
| Gate 2 missed (no caps and spend by 09:00) | Cut the allowlist and the refund UI (show refund as an explorer transaction). Keep the blocked over-cap payment |
| Testnet slow in the room | Switch to the backup video without apologising |
| Frontend not live | Run the page in mock mode for the unfinished functions and say so honestly |
| Late finish | Do not skip the video or the rehearsal. Cut features, not those |

# After shipping (before the VC pitch on 28 and 29 October)

1. One pilot conversation with an SME (Kitale or Kibera).
2. One person agrees to be the verifier.
3. Check the market figures against their original sources.
4. A short conversation with a lawyer or licensed partner about the returns structure.
5. Update the pitch to the VC version (traction, ask, fee numbers).
