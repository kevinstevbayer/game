# TICKETS (milestone ladder; proof required before the next gate)

Template: TITLE / GOAL (player-visible) / SCOPE (max 3 files) / OUT OF SCOPE / ACCEPTANCE (numbered, testable) / PROOF (screenshot, GIF, or steps) / STATE CHANGES (+ migration?).
Rule: a ticket is done when the proof exists and `npm test && npm run typecheck && npm run smoke` pass.

## M0 Boot (proof: tag m0, smoke passes, screenshot)
| ID | Goal | Acceptance | Proof |
|---|---|---|---|
| T-001 | Static page boots | index.html + main.js load as ES modules; 320x180 canvas, integer scale, pixelated; no console errors | screenshot |
| T-002 | Fixed-timestep loop | accumulator at 30 Hz; dt cap 0.25 s; render interpolates; FPS in debug overlay (key F3) | overlay screenshot |
| T-003 | Draw the real dam | renders a Dam from core/: cells as colored rects by material, sea line from stepSim level | screenshot of STREAM tier with a built wall and rising water |
| T-004 | Input to commands | pointer drag fires PLACE through `dispatch`; view never mutates state | placing sticks changes cells; unit test on dispatch |
| T-005 | Smoke test | tools/smoke.js (Playwright): loads page, no console errors, advances 120 frames, one PLACE changes state, saves PNG | CI log + PNG |
| T-006 | Dependency lint | tools/check-deps.js enforces layer direction and core banned identifiers | failing example test |

## M1 Toy (proof: 5 strangers, 3 min each; pass if >= 3 keep playing; tag m1)
| ID | Goal | Acceptance |
|---|---|---|
| T-010 | Tap trees -> timber | TAP_TREE command; HUD shows Timber; cost deducted on PLACE; cannot go negative (property test) |
| T-011 | Tide plays out | STREAM tide visible: sea rises/falls; surge pulse visible; forecast strip shows ETA and uncertainty band |
| T-012 | Stress overlay | key toggles color by load/strength; ratio thresholds from balance.js; pattern + color |
| T-013 | Burst feedback | CELL_BROKEN/CASCADE events; placeholder beep and 3-frame shake; valley meter visible; Flood state shows a plain "Flooded" card |
| T-014 | Repair | REPAIR on fatigued cell; cost 25% ceil min 1; overlay shows fatigue |
| T-015 | Debug panel | F4: add resources, skip time x30, set tier, force surge, dump state hash |
Gate: toy test results recorded in docs/DECISIONS.md. If failed, change the core verb or tension, not the polish.

## M2 Loop (proof: 5 rounds in a row no crash; tag m2)
| ID | Goal | Acceptance |
|---|---|---|
| T-020 | economy.js | Timber/Mud/Stone, costs table, ruin discount, 1.15^n cost tables; unit tests incl. fuzz (never negative, no NaN) |
| T-021 | Crews | Gatherer production per tick; Lodge capacity; HIRE command; golden hash updated |
| T-022 | rules.js | Rule rows, conditions, selectors, actions per GAME_DESIGN section 5; deterministic tie-break; 20 unit tests |
| T-023 | Mason + starter rule | Mason executes PATCH from starter rule; visible patching during a staged breach |
| T-024 | Flood + washout | washout turns submerged cells into ruins; clean-tide counter; tier clear after 5 clean tides |
| T-025 | Silt (minimal) | silt payout formula incl. flood decay; MetaState; unit tests incl. flood-farming bound |
| T-026 | Save v1 | versioned save, tmp/bak rotation, crc, migrations scaffold, fixture save_v1.json; fuzz corrupt-save test |

## M3 Vertical slice (proof: stranger plays STREAM to RIVER at final quality; tag m3)
T-030 art pass through tools/palette.js and atlas (16 colors); T-031 audio engine core (bus, limiter, SFX recipes: place, repair, creak, surge horn, burst, silt chime); T-032 pressure-linked rumble; T-033 VFX toolkit (tween, particles, trauma shake, hit-stop, dither wipe, spray); T-034 first music layers (pad + pulse reacting to max ratio); T-035 HUD polish and tutorial script (GAME_DESIGN section 8); T-036 settings (volume, effects intensity, reduce motion, stress overlay pattern); T-037 first relic at lifetime silt 15 with codex stub.

## M4 Content (proof: validators pass; sim covers every unlock; tag m4)
T-040 tiers 3-5 data and Quarryman/Watcher/Digger; T-041 materials unlocks; T-042 Silt Garden 12 upgrades; T-043 rule vocabulary unlocks and Rule Slot upgrades; T-044 data-validate.js schema checks; T-045 sim bots (greedy economy, rule-based, flood farmer) with pacing table; T-046 balance pass 1 using sim (log in docs/BALANCE_LOG.md).

## M5 Systems and story (proof: all three endings reachable; tag m5)
T-050 story JSON engine (events, flags in MetaState); T-051 12 relics with writer batches + story-lint; T-052 antagonist beats (THE REEVE commissions, optional objectives); T-053 endings Hold/Release/Terrace; T-054 codex; T-055 music: leitmotifs, tension layer, three ending cues.

## M6 Polish (tag m6)
T-060 perf pass vs budgets; T-061 accessibility pass; T-062 mobile touch pass; T-063 cross-browser golden hash (Chrome, Firefox); T-064 share cards (PNG of final dam + stats); T-065 Daily Tide (shared seed, spoiler-free result card).

## M7 Playtest (tag m7)
T-070 five to ten silent playtests; log drop-off points; T-071 fix top 5; T-072 opt-in anonymous counters (time to first place, furthest tier, quit point).

## M8 Launch (tag v1.0)
T-080 static hosting; T-081 page copy, 15 s clip, 5 screenshots; T-082 press kit via tools/press-kit.js; T-083 soft launch and feedback loop.
