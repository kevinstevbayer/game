# P2 Gate Record

**Phase:** LOCKED (`p2-lock`)
**Branch:** `phase/p2`
**Lock tag:** not created

## Gate checklist

| Requirement | Evidence | Result |
|---|---|---|
| Data validators pass | `node --test`: 18 tests pass, including strict schema, modifier, relic, and mechanics-data checks. | PASS |
| Cost table reproduces the formula for n=0..60 and is monotonic | `node tools/econ-tables.js` prints all five crew columns from base cost and iterative 1.15 scaling; checked in P2-3. | PASS |
| First purchase is within 20 seconds | `node tools/paper-sim.js`: first placement at 00:20; the documented target is inclusive. | PASS |
| Every GAME_DESIGN number has a data home | Audited in `docs/BALANCE_LOG.md`; additions are in `src/data/progression.js`, `WATCHER_SETTINGS`, `OFFLINE_SETTINGS`, and `PHYS`/tier data. | PASS |
| Designer sign-off | User approved the P2 changes and the inclusive 20-second / 5-minute pacing alignment on 2026-11-03. | PASS |

## Additional verification

- Paper simulation: RIVER clears at 12:30 in the zero-flood scenario; three activity gaps exceed two minutes. This remains a balance follow-up, not a P2 gate criterion.
- Physics claims marked VERIFIED were rerun with `node tools/sim.js 6 20`, `node tools/cascade.js`, and `node tools/probe.js`; results are recorded in `docs/BALANCE_LOG.md`.
- `git diff --check` and JavaScript syntax checks pass.
- `npm run typecheck` could not be run because npm/TypeScript are unavailable in this environment. The available pnpm also could not install/link dependencies because the sandbox rejected a symlink with EPERM. User approved the P2 lock with this limitation recorded; the successful Node tests do not replace the requested typecheck.

## Gate decision

P2 was approved by the designer and locked as `p2-lock` on 2026-11-03. The TypeScript check remains an explicit verification limitation for follow-up; it was not reported as passing.
