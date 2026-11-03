# TEST PLAN

## Pyramid
1. Unit (node:test, core only): rng goldens, loads, cascade, sea, forecast, economy, rules, meta, save. BUILT: 11 tests (rng 2, loads 2, cascade 2, sea 2, determinism 1, fuzz invariants 1, perf 1).
2. Golden state: hashState at checkpoints for fixed (seed, command log). Any logic change breaks it deliberately; update with a DECISIONS.md line.
3. Property/fuzz: random commands and random dams: never NaN, resources >= 0, load >= 0, fatigue in [0,1], valley in [0,100], cascade terminates. BUILT for dam/sim; SPEC for economy/rules.
4. Save fixtures: one real save per released version loaded by tests.
5. Smoke (Playwright): boots, no console errors, frames advance, one command works, PNG saved.
6. Sim bots (tools/): pacing and exploit detection.
7. Human playtests: toy test, then 5-10 silent sessions.

## Invariants asserted every tick in dev (assertInvariants)
all numbers finite; loads >= 0; fatigue in [0,1]; valley in [0,cap]; intact cells have strength > 0; broken cells have mat 0 and ruin 1; resources >= 0; crew count <= lodge capacity; rule rows <= cap; hash unchanged by view code (frozen state test).

## Verified results so far (this repo, Node 22)
- Tick cost: OCEAN 0.016 ms, BAY 0.007 ms (budget 1 ms).
- LOAD_TRANSFER=0.4: first-cascade size median 7.7% of cells, p10 4.5%, p90 100% (n=51 first cascades, BAY/SEA/OCEAN byDepth).
- Structural survival (6 tides x 20 seeds): table in GAME_DESIGN section 2.
- Repair effect (median tides survived, 15 seeds, cap 20): BAY 11 -> 20, SEA 1 -> 2, OCEAN 4 -> 8.

## Balance targets (UNVALIDATED; sim must confirm)
| Metric | Target |
|---|---|
| Time to first purchase | < 20 s |
| Time between meaningful decisions (tides) | < 30 s early, < 60 s late |
| Dead zone with nothing to do | < 2 min |
| Greedy bot clean-run time to ending | 1.1x to 2x the 66-min minimum |
| Rule-based bot vs manual-style bot | within 2x (no dominant strategy) |
| Flood farmer vs clean play | flood farming never reaches the ending faster |
| Floods per tier for a median player | 1-3 |
| Weakest tier survival with correct materials | >= 90% |
| Weakest tier survival with sticks-only | <= 10% from BAY on |

## Sim bots to build (tools/)
1. structural (BUILT): fixed dam policies vs tiers.
2. economy greedy: buys cheapest payback; builds by fatigue-free rule.
3. rules bot: uses starter + upgraded rule rows; compares against manual.
4. flood farmer: tries to maximize silt via deliberate floods.
5. idle bot: only offline economy; must not damage the dam.

## Playtest protocol
Toy test (M1): 5 people, 3 minutes, no instructions; record: time to first place, time to first purchase, did they read the overlay, did they keep playing when told they could stop. Silent observation in M7: note every pause > 10 s and every quit point. Fix the biggest drop-off first.
