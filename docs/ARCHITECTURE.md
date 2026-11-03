# ARCHITECTURE: Overflow

Status key: [BUILT] exists and is tested; [SPEC] specified, not built.

## 1. Principles
1. Determinism first: the sim is a pure function of (seed, command log). Everything else (render, audio, VFX, UI) is a disposable view.
2. Data over code: content and numbers are tables; logic is small, pure, typed functions.
3. No allocation in hot paths: typed arrays, preallocated scratch buffers.
4. Fail fast in dev (assertions, schema validation), fail safe in prod (backup saves, clamped values).
5. Every module has a test that can run headless in Node.

## 2. Layers and dependency direction
```
data/  <-  core/  <-  app/ (dispatch, save, loop)  <-  view layers: render/ ui/ audio/ vfx/
```
Arrows point to what a layer may import. `core/` imports only `data/` and itself. View layers import `core/` types and read state; they never import each other except through the event bus. Violations fail the `tools/check-deps.js` lint [SPEC].

## 3. Modules
| Module | Responsibility | Status |
|---|---|---|
| data/balance.js | all numbers, materials, tiers | BUILT |
| data/{crews,rules,silt,relics,story}.js | content tables | SPEC |
| core/rng.js | sfc32, deriveSeed | BUILT |
| core/hash.js | FNV-1a | BUILT |
| core/dam.js | grid, loads, cascade, fatigue, leaks, preview | BUILT (preview SPEC) |
| core/sea.js | tide, surges, forecast | BUILT |
| core/step.js | SimState, stepSim, hashState | BUILT |
| core/economy.js | resources, costs, crew production | SPEC |
| core/rules.js | rule-row interpreter | SPEC |
| core/commands.js | dispatch(state, cmd) | SPEC |
| core/meta.js | silt, upgrades, relics, endings | SPEC |
| app/loop.js | fixed-timestep accumulator | SPEC |
| app/save.js, app/migrations.js | versioned persistence | SPEC |
| render/*, ui/* | canvas drawing, HUD, input | SPEC |
| audio/*, vfx/* | event subscribers (procedural) | SPEC |

## 4. Tick pipeline (one fixed tick, 30 Hz)
```
dispatch queued commands (player + crew rule outputs)   [commands.js]
 -> advance clock, compute sea level                    [sea.js]
 -> resolveCascade(dam, effLevel)                       [dam.js]  (breaks, loads consistent)
 -> updateFatigue                                       [dam.js]
 -> leaks -> valley meter, flood check                  [step.js]
 -> economy: crew production, rule evaluation timers    [economy.js, rules.js]
 -> emit events into the ring buffer                    [events.js]
 -> tide rollover: payouts, tier progress               [meta.js]
```
Order is fixed and documented; changing it requires a DECISIONS.md entry and golden-hash update.

## 5. State schema (all serializable)
```
SimState {
  tick:int, seed:uint32, tierIndex:int, tideIndex:int, tideTick:int,
  dam: { w,h, mat:Uint8Array, ruin:Uint8Array, fat:Float32Array, (scratch buffers not saved) },
  tide: { surges:[{t0_s, mag_cells, bias}] },       // derived from seed+tideIndex, not saved
  valley:number, sluiceOpen:bool, flooded:bool, brokenTotal:int, maxRatio:number, level:number
}
EconState { timber, mud, stone: number; crews: Crew[]; lodgeLevel:int }      [SPEC]
Crew { type:uint8, level:uint8, rules: RuleRow[], cooldown_ticks:int }      [SPEC]
MetaState { silt, siltLifetime:int, upgrades:Uint8Array, relics:Uint32 bitmask,
            clearedTiers:int, floodsPerTier:Uint8Array, flags:Uint32, endingsSeen:Uint8 } [SPEC]
```
Derived or scratch data (tide surges, base loads, BFS queue) is rebuilt on load, never saved.

## 6. Determinism rules
- Time unit is the integer tick. Seconds exist only as `tick * DT_S` for display and data tables.
- Allowed math in core: + - * / `Math.sqrt` (IEEE correctly rounded) `min max abs floor imul`. No `sin cos pow exp log` (engine-dependent last-bit differences). Tide uses parabola 4u(1-u).
- RNG: sfc32 seeded by `deriveSeed(runSeed, tideIndex, STREAM_ID)`. One stream per concern; never share a stream between systems.
- Iteration order over cells and crews is by index ascending; tie-breaks by lowest index.
- Float32Array stores round deterministically; compute in double, store once per tick.
- Golden test: hash of (mat, ruin, fat, header) at checkpoints must match across runs and across Node/Chrome/Firefox (Playwright smoke compares Chrome and Firefox hashes) [SPEC].

## 7. Numerics and precision
- Loads in "cell depth" units (1.0 = one cell of water). Strength in the same unit. Ratio = load / effectiveStrength.
- Epsilon policy: comparisons use strict `>`; tests use 1e-5 tolerance on Float32 values.
- Valley meter and resources are doubles; displayed values are floored, never rounded up.
- Cost scaling: `cost(n) = floor(base * 1.15^n)` computed by iterative multiplication from a stored table (no `Math.pow`), tables generated once in `data/`.

## 8. Cascade algorithm (BUILT, in dam.js)
1. Base load per cell = max(0, level - (row + 0.5)).
2. Intact cells carry their base load. Each connected region of empty cells (4-neighbour BFS) orphans the sum of its base loads.
3. `LOAD_TRANSFER` (0.4) of that sum is split equally across the region's intact boundary contacts (each adjacency counts once).
4. Cells with load > effective strength break (simultaneously per pass); loop until a pass breaks nothing. Max passes = w*h, so it always terminates.
Properties tested: termination, stability after resolve, shallow dam never breaks, order independence (simultaneous passes), no NaN under fuzz.

## 9. Commands and events [SPEC]
Commands (all validated, return `{ok:boolean, code:int}`): PLACE(cell, mat), REPAIR(cell), TAP_TREE, HIRE(crewType), SET_RULES(crewId, rules), TOGGLE_SLUICE, BUY_UPGRADE(id), START_NEXT_TIER, ACK_RELIC(id).
Events (int enums into a preallocated ring buffer, drained once per frame by views): CELL_BROKEN(i), CASCADE(count), CELL_PLACED(i), SURGE_WARNING(eta), SURGE_PEAK, TIDE_END(clean), FLOOD, SILT_GAIN(n), RELIC_FOUND(id), TIER_CLEARED, ENDING(id).

## 10. Rendering [SPEC]
- Internal 320x180 offscreen canvas, integer scale to the window, letterboxed. Positions rounded to integers.
- Layers: sky/sea (parallax rows), dam cells from a sprite atlas, water overlay, crews, HUD. Dirty-rect optional after profiling.
- Stress overlay: cell tint from ratio (green <0.5, amber 0.5-0.8, red >0.8), toggled by key.
- Interpolation: render uses previous and current state for crew positions only; the dam is static between ticks.
- Preview query `previewMaxRatio(dam, level)` (pure, scratch-buffer, no mutation of live loads) powers the "worst case" readout using forecast upper bound.

## 11. Audio and VFX contracts [SPEC]
- Subscribe to events only. Audio engine per the playbook: SFX recipes (data), pitch-linked pressure rumble (level or max ratio drives gain and filter), creak recipes on fatigue thresholds, surge horn, cascade burst, silt chime, relic motif.
- VFX: event-to-effect table in `data/vfx.js`: shake (trauma), hit-stop on CASCADE, spray particles on surge peak, dust on CELL_PLACED, silt settle particles on FLOOD end. Effects intensity and reduce-motion honored globally; max 3 flashes/s.

## 12. Save format [SPEC]
`{ v:int, savedAtTick:int, seed, sim:{...}, econ:{...}, meta:{...}, crc:uint32 }` where typed arrays are base64. Three keys: `overflow_save`, `overflow_save_tmp`, `overflow_save_bak`. Write tmp, verify by parse + crc, rotate. Migrations: `migrations[v]` upgrades v -> v+1; never edit an old migration; fixtures in `tests/fixtures/save_v*.json`.
Time away: store wall-clock `lastSeen`; on load, elapsed = clamp(now - lastSeen, 0, OFFLINE_CAP_S); advance ONLY the economy (crew production at rule-free baseline), never the tide or dam, so offline play cannot destroy a dam. Offline cap in balance.js.

## 13. Performance budgets (measured where noted)
| Item | Budget | Measured |
|---|---|---|
| stepSim, OCEAN tier | 1 ms | 0.016 ms |
| stepSim, BAY tier | 1 ms | 0.007 ms |
| Render frame | 4 ms | not built |
| Heap growth over 10 min | 0 steady-state | not built |
| Initial load | < 2 s, < 500 KB gz | not built |

## 14. Tooling
- `npm test` (node:test), `npm run typecheck` (tsc checkJs strict), `npm run sim|probe|cascade`.
- `tools/smoke.js` [SPEC]: Playwright headless; loads index.html, asserts no console errors, canvas present, advances N frames, injects a PLACE command, asserts state changed, saves a PNG.
- `tools/data-validate.js` [SPEC]: hand-written schema validators for every file in data/, runs pre-commit.
- `tools/check-deps.js` [SPEC]: enforces the layer dependency direction and the core purity bans via regex on imports and banned identifiers.
- CI (optional): GitHub Actions runs test, typecheck, smoke on every push.

## 15. Definition of done (every ticket)
Typecheck clean, tests pass, smoke passes, no new magic numbers, state-shape changes have a migration + fixture, CHANGELOG line, visible proof attached (screenshot or steps).
