# P2 Design and Balance Review

Review date: 2026-11-03
Scope: `docs/GAME_DESIGN.md`, P2 data tables, and the repository tools that support its VERIFIED claims.

## VERIFIED claims rerun

| GAME_DESIGN claim | Tool rerun | Result |
|---|---|---|
| Section 2: load transfer is 40%; first cascade distribution has median 7.7% and p90 100% (n=51). | `node tools/cascade.js` | Reproduced: `LOAD_TRANSFER=0.4`, p10 4.5%, p50 7.7%, p90 100%, max 100%, n=51. |
| Section 2: fatigue gains at `0.4 * (ratio - 0.6)^2`; a repaired by-depth dam roughly doubles survival (BAY 11→20+, SEA 1→2, OCEAN 4→8). | `node tools/probe.js` | Reproduced medians: BAY 11→20/20, SEA 1→2/20, OCEAN 4→8/20. The formula itself is implemented in `src/core/dam.js`; current probe validates the survival outcome, not an independent numerical fit of the formula. |
| Section 2: six-tide, 20-seed structural survival results for the three material policies. | `node tools/sim.js 6 20` | Reproduced the stated counts: BAY sticks 20/20, by-depth 0/20; SEA by-depth 20/20; OCEAN by-depth 19/20; overbuilt 0/20 in each tier. |

`node tools/probe.js` also measured average tick times of BAY 0.0065 ms and OCEAN 0.0173 ms in this run. These are environment-specific measurements, not balance targets.

## UNVALIDATED claims and validation needed

| Claim / design area | Status and validation needed |
|---|---|
| Section 3: three-hour target including building, floods, and meta play. | UNVALIDATED; now has a data home in `PROGRESSION_SETTINGS.designRunTarget_s`. Validate with a deterministic economy bot that includes placement, repair, floods, upgrades, and relic acquisition; report median and range over a documented seed set. |
| Sections 4–6: manual action costs, crew economy and behavior, rules, flood payouts/decay, upgrade effects, and relic progression. | Tables contain many source values, but gameplay outcomes are not validated by the table validators. Add unit tests for cost rounding and caps, rule execution, flood payout decay/floor, silt upgrade stacking, and relic unlock ordering; then run economy and flood-farmer bots. |
| Section 5: Watcher adds +2 s forecast lead, -15% uncertainty, stacking to 3. | Values now live in `WATCHER_SETTINGS` in `src/data/crews.js` and have regression assertions. Runtime stacking remains unimplemented; validate cumulative effects and the cap when crew behavior is implemented. `baseRate: 0` remains the explicit placeholder for “n/a”. |
| Section 7: forecast visibility, uncertainty shrink, and worst-case readout. | Add deterministic tests at the 10 s lead boundary, 2 s zero-uncertainty boundary, and surge window, plus a UI check that worst-case stress uses the upper bound. Existing core forecast tests cover part, not all, of this claim. |
| Section 8: first purchase within 20 s; 2:30 progress; tutorial events; 5:00 Tier 1 clear. | Aligned to the locked P1 opening and five 60-second tides. The paper script reports 0:20, meeting the inclusive target. Validate onboarding timing in an instrumented playable build and silent playtests. |
| Section 9: flood farming, offline economy (25%, capped at 8 h), and fairness/accessibility constraints. | Add tests for offline elapsed-time clamping and no offline tide/dam advancement; compare flood-farmer and clean bots; automate flash-rate/accessibility checks and verify keyboard play in the later playable build. |
| Section 10: Release requires 6 relics; Terrace requires all 12 and 500 silt. | Thresholds now have data homes in `src/data/progression.js`. Test ending availability below, at, and above each threshold; verify Hold requires clearing OCEAN. |

The P2-4 paper run is only a clean-run lower-bound scenario: zero floods, no placement/repair spending after the first STREAM row, no upgrades, and a hand-authored tapping/purchase policy. It reached STREAM at 5:00, RIVER at 12:30, reported three action gaps longer than two minutes, and ended at 30:00 with 53 clean-tide silt. These outputs do not validate the three-hour target or full progression balance.

## Data-home audit and gate status

- Physics constants and tier dimensions/timing are in `src/data/balance.js`; tiers are re-exported by `src/data/tiers.js`.
- Crew base rates/costs/unlocks and Lodge/hire multipliers are in `src/data/crews.js`; Watcher forecast modifiers are in `WATCHER_SETTINGS` in the same module.
- Rule vocabulary/row limits are in `src/data/rules.js`.
- Upgrade values, clean/flood payout parameters, and relic lifetime thresholds are in `src/data/silt.js` and `src/data/relics.js`.
- Placement/ruin and repair costs, ending thresholds, and tutorial timings have explicit data homes in `src/data/progression.js`; the offline rate/cap are in `src/data/balance.js` per the architecture contract; surge minimum and forecast zero-uncertainty thresholds are also in `balance.js` and consumed by `src/core/sea.js`.

P2 implementation and review tickets are complete. The designer approved the phase on 2026-11-03 and P2 is locked as `p2-lock`. The 30-minute paper run still reports three activity gaps longer than two minutes, which remains a balance follow-up. TypeScript verification could not run in this environment and is documented in `docs/P2_GATE_RECORD.md`.
