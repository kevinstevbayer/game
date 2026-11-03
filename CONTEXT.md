# CONTEXT: OVERFLOW (paste this into EVERY AI session)

## Game
Overflow: a beaver foreman is hired to hold back the entire ocean with sticks. Browser incremental game, ~3 h, finite, three endings. You build a dam (elevation-view grid), survive rising tides and telegraphed surges, write rule rows that automate beaver crews, and treat floods as progress (silt = meta currency). Hidden layer: the sea is not attacking, it is returning to its old bed, which the valley sits in.

Core verb: place/reinforce dam cells. Core tension: visible stress and forecast; a cell bursts when load > strength; breaks shed load onto neighbours (cascades). Core depth: you author crew rule rows, not just buy output.

## Current phase
P0 done; P1 (Lore and opening storyline) and P2 (Mechanics lock) are locked. P3 (Technical foundation) is active on `phase/p3`. Work is sequential: see docs/PHASES.md. Only read the files named in your prompt.
## Prework already built (will be re-audited in P4-1)
M0 Boot not started. Reference core exists and is tested: src/core/{rng,hash,dam,sea,step}.js, src/data/balance.js, tools/{sim,probe,cascade}.js, tests/core.test.js (11 pass), tsc clean.

## Tech (fixed; do not change without a DECISIONS.md entry)
- Plain HTML + ES2022 modules + JSDoc types checked by `tsc --noEmit` (checkJs, strict). No bundler, no framework, no runtime dependencies. Dev deps only: typescript, @types/node, playwright.
- Canvas 2D at 320x180 internal resolution, integer scale, `image-rendering: pixelated`.
- Fixed timestep 30 Hz (DT_S = 1/30). Render at display rate with interpolation.
- Runs from a static server. Target 60 fps on a throttled mid laptop. Sim tick budget 1 ms (measured 0.016 ms at OCEAN).

## INVARIANTS (never violate; reject any patch that does)
1. `src/core/**` is pure: no DOM, canvas, audio, `Date.now`, `performance`, `Math.random`, `Math.sin/cos/pow/exp/log`. Allowed math: + - * / `Math.sqrt` `Math.min/max/abs/floor/imul`. Time and RNG are injected (tick counter, seeded sfc32).
2. All state lives in one `SimState` plus a `MetaState`. Both are JSON/typed-array serializable. No class instances, functions, Maps, or cycles in state.
3. Mutations go through `dispatch(state, command)` or `stepSim(state)`. render/ui/audio/vfx NEVER mutate state.
4. Every tunable number is in `src/data/balance.js` (or another data file). No magic numbers in logic.
5. Hot paths allocate nothing: typed arrays preallocated at tier creation; no array/object literals inside `stepSim`, `computeLoads`, `resolveCascade`.
6. Same seed + same command log => same state hash at every tick (golden tests enforce it).
7. Save format is versioned; any state-shape change ships a migration and a fixture.
8. The game boots and passes `npm run smoke` at every commit on main.
9. Names, art, music motifs, and story canon are approved by the designer; AI uses placeholders and flags them.
10. No external assets or hosts. Audio is synthesized; art is generated through the palette tool.

## Code style (precision rules)
- Units in names: `_s`, `_cells`, `_px`, `_hz`. Ticks are integers; seconds derived via DT_S.
- Functions <= 40 lines. No classes in core. No default params that hide behavior. No implicit coercion (`===` only). No `any`.
- Typed arrays: Uint8Array materials, Float32Array loads/fatigue. Cell index `i = row * w + col`, row 0 = bottom.
- Errors in core return codes/booleans, never throw in hot paths. Dev-mode assertions via `assertInvariants(state)`.
- JSDoc every exported function; `npm run typecheck` must pass.

## File map
- src/data/balance.js: all numbers (TICK_HZ, MATERIALS, PHYS, TIERS, VALLEY_CAP)
- src/core/rng.js: sfc32 PRNG, deriveSeed
- src/core/hash.js: FNV-1a for golden state hashes
- src/core/dam.js: dam grid, computeLoads (component load redistribution), resolveCascade, fatigue, leaks
- src/core/sea.js: parabolic tide, seeded surges, forecast with shrinking uncertainty
- src/core/step.js: SimState, createSim, stepSim, hashState
- tools/sim.js: structural survival bot (policies x tiers). tools/probe.js: repair-effect probe. tools/cascade.js: first-cascade size distribution
- tests/core.test.js: node:test suite
- docs/: BRIEF, ARCHITECTURE, GAME_DESIGN (mechanics + numbers), AI_ROLES, TICKETS, TEST_PLAN, STORY_BIBLE, DECISIONS, CHANGELOG

## Verified facts (from running the code; do not re-derive)
- Load model: depth-based hydrostatic load; broken/unbuilt regions orphan their load; LOAD_TRANSFER=0.4 of it goes to intact boundary cells (0.6 produced total collapse in the median case; 0.4 gives median first cascade 7.7% of cells, p90 total collapse).
- Structural survival over 6 tides x 20 seeds: BAY sticks-only floods 20/20, BAY byDepth 0/20, SEA byDepth 20/20 (needs better materials), OCEAN byDepth 19/20, overbuilt policy 0/20 everywhere.
- Repair matters: BAY byDepth median tides survived 11 -> 20+ with repair; OCEAN 4 -> 8.
- Economy and pacing are UNTUNED. Do not claim balance.

## Status of unknowns (open; do not invent answers)
Economy rates, upgrade costs, research tree values, silt payouts, and rule-engine tuning are v0 proposals in GAME_DESIGN.md and need sim + playtest validation.

## Phase contract: P1 (locked)

P1 locks the world rules, timeline, role-based cast, five-minute STREAM opening, and R01-R04 clue texts. The valley occupies the sea's old bed; the sea is non-magical and has no spoken voice. Canon names remain placeholders pending later designer decisions. The P1 reader gate used three AI-simulated first-read perspectives as a user-approved substitute for three independent readers; this is a documented process deviation, not human playtest evidence. Later phases may rely on the P1 story IDs, clue schedule, and opening beats, subject to the documented P2 timing reconciliation and P10 tutorial-breach setup.

## Phase contract: P2 (locked)

P2 locks strict data schemas and source tables for tiers, crews, rules, silt upgrades, relic thresholds, economy/progression settings, and the five-minute STREAM pacing. The first purchase target is inclusive at 20 seconds; STREAM clears after five clean 60-second tides at 5:00. The 30-minute paper simulation is a clean-run lower-bound scenario, not balance evidence; its manual-tap policy and zero-flood assumptions remain unvalidated, and it reports three gaps longer than two minutes. Watcher effects and ending/offline thresholds have data homes but need runtime tests when those systems are implemented. The TypeScript check was unavailable in the lock environment; Node tests and JavaScript syntax checks passed. P4-1 must re-audit `src/core/sea.js`, including the move of unchanged surge/forecast constants into `src/data/balance.js`.
