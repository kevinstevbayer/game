# PHASES: sequential development of Overflow

One phase active at a time. Each phase has its own prompts, its own output files, a gate that proves it, and a lock tag. Bugs are fixed inside the phase that owns them (see section 4). There is no "build the game" prompt anywhere in this project.

## 1. How the system works

### 1.1 Phase order and dependencies
| Phase | Name | Depends on | Produces | Ticket milestone |
|---|---|---|---|---|
| P0 | Game outline | none | BRIEF.md | DONE |
| P1 | Lore and opening storyline | P0 | world, timeline, cast, opening beat sheet, first relic texts | none (docs) |
| P2 | Mechanics lock | P0, P1 | GAME_DESIGN v1, data schemas, econ tables | none (docs + tables) |
| P3 | Technical foundation | P0 | boots, loop, smoke test, lint | M0 |
| P4 | Core simulation A (headless) | P2, P3 | physics, commands, events, basic economy | part of M1 |
| P5 | Toy (first playable) | P4 | dam on screen, input, stress overlay, placeholder feedback | M1 |
| P6 | Systems | P5 (toy PASSED) | crews, rule engine, flood/washout, silt (minimal), save v1 | M2 |
| P7 | Art direction and pipeline | P5 | palette, atlas, sprites, tools | part of M3 |
| P8 | Audio | P6 | SFX recipes, rumble, music layers | part of M3 |
| P9 | VFX and juice | P6 | toolkit, event-to-effect table | part of M3 |
| P10 | Vertical slice | P6, P7, P8, P9 | tutorial, HUD polish, Tier 1 to 2 at final quality | M3 |
| P11 | Narrative implementation | P1, P10 | story engine, opening, relics, codex, antagonist, endings | M5 |
| P12 | Content expansion | P10 | tiers 3-5, crews, silt upgrades | M4 |
| P13 | Balance | P11, P12 | tuned numbers, sim reports | part of M4/M5 |
| P14 | Polish and reach | P13 | settings, accessibility, mobile, share cards, daily tide | M6 |
| P15 | Playtest and fix | P14 | fix list executed | M7 |
| P16 | Launch | P15 | hosted build, page, clip | M8 |

GO/NO-GO gate: P5. If the toy test fails, the next work is a new core verb or tension model (back into P2), never more polish.

### 1.2 The prompt envelope (paste at the top of EVERY prompt)
```
PROJECT: Overflow. CURRENT PHASE: P<n> <name>. PROMPT: P<n>-<k>.
READ (only these; ignore everything else): CONTEXT.md + <files listed in the prompt>.
TASK: <one sentence>.
DELIVERABLES: <exact file paths>.
LOCKED (do not edit): all files owned by phases before P<n>, unless this prompt says FIX.
CONSTRAINTS: invariants in CONTEXT.md; no new dependencies; no invented names, art, canon, or balance numbers (use placeholders and flag them).
OUTPUT FORMAT: (1) plan in <= 10 lines, wait for my approval; (2) after approval, diffs or whole new files; (3) end with: files changed, risks, how to see the proof, CHANGELOG line.
DONE WHEN: <acceptance + proof>.
```

### 1.3 Phase lifecycle
1. Open: set the phase to ACTIVE in docs/PHASE_STATUS.md. Branch `phase/p<n>`.
2. Run its prompts in order, each in a fresh chat with only its READ files. Commit after each prompt with the prompt id in the message (`P4-2: commands.js dispatch`).
3. Auditor and QA review the phase as a whole (prompts in AI_ROLES.md).
4. Gate: run the gate checklist. All boxes or the phase stays open.
5. Lock: merge to main, `git tag p<n>-lock`, set LOCKED in PHASE_STATUS.md, add a "Phase contract" paragraph to CONTEXT.md (what later phases may rely on), update CHANGELOG.
6. Only then open the next phase.

### 1.4 Locked-phase rules
- A locked phase accepts bug fixes only. Procedure: bug ticket naming the phase, branch `fix/p<n>-<slug>` from the current main, minimal fix plus a regression test, rerun the gate tests of that phase AND the regression suites of every later phase, merge, tag `p<n>-fix<k>`, CHANGELOG line.
- A design change to a locked phase is a Change Request: DECISIONS.md entry, list of later phases affected, re-run their gates. If more than two later phases are affected, reconsider the change.
- Context hygiene: an AI session may only read the files in its prompt's READ list. This is what keeps one phase's bug from poisoning the next.

### 1.5 Standing regression suite (must stay green from P4 onward)
`npm test` (unit, golden hash, fuzz), `npm run typecheck`, `npm run smoke` (from P3). Any phase that breaks a prior phase's tests is not done.

## 2. Phase specifications

### P0. Game outline (DONE)
Goal: lock the one-page brief. Output: docs/BRIEF.md. Gate: pitch test (3 strangers hear the sentence, at least 2 ask a follow-up) and designer sign-off. Open item: pitch test not yet run.
- P0-1 prompt: "Stress-test docs/BRIEF.md: list the 5 weakest claims, 3 scope risks, and 3 features that violate the pillars. Do not rewrite it."

### P1. Lore and opening storyline
Goal: a complete, consistent world and a written opening, before any story code exists. Output files: docs/lore/WORLD.md, TIMELINE.md, docs/story/CAST.md, OPENING.md, RELICS_R01_R04.json. Names stay placeholders until the designer approves.
READ: CONTEXT.md, docs/BRIEF.md, docs/STORY_BIBLE.md.
- P1-1 World rules: "Write docs/lore/WORLD.md: geography (sea, old bed, valley, dam site), what is and is not magical (default: nothing), how beavers, villagers, and the Reeve's office relate, the economy in one paragraph, and 10 things the player will never be told. Tone per STORY_BIBLE. 600 words max."
- P1-2 Timeline: "Write docs/lore/TIMELINE.md: at most 25 dated entries from the time before the first dam to the present. For each entry add: who knew it, and which relic (R01-R12) reveals it, or NEVER."
- P1-3 Cast: "Write docs/story/CAST.md for FOREMAN, five crews, THE REEVE, THE SEA, PREDECESSORS. Per character: want, secret, how they speak (3 rules), one running joke, one moment that changes them. Role IDs only."
- P1-4 Opening beat sheet: "Write docs/story/OPENING.md as numbered beats B-001..B-030 covering the first 5 minutes (GAME_DESIGN section 8): what the player sees, hears, reads, and does in each beat, and which beat teaches which mechanic. At most 3 lines of text per beat. No lore dumps."
- P1-5 First relics: "Write RELICS_R01_R04.json using the schema in STORY_BIBLE.md: R01-R04 only, plus the clue each plants. At most 3 lines each."
- P1-6 Continuity audit (Auditor role): "Cross-check WORLD, TIMELINE, CAST, OPENING, RELICS against STORY_BIBLE and each other. List contradictions, clue-schedule violations, and anything the player learns too early. Do not rewrite."
Gate: P1-6 shows 0 critical contradictions; 3 readers read OPENING and retell the premise in one sentence; designer approves names. Regression: JSON schema check on the relic file. Lock tag p1-lock.

### P2. Mechanics lock
Goal: every rule and number in one place, with schemas, before code depends on it. Output: docs/GAME_DESIGN.md v1, src/data/{crews,rules,silt,relics,tiers}.js tables, tools/econ-tables.js, docs/BALANCE_LOG.md started.
READ: CONTEXT.md, docs/GAME_DESIGN.md, src/data/balance.js, docs/ARCHITECTURE.md sections 5 and 7.
- P2-1 Schemas: "Write hand-written validators (no dependencies) for crews, rules, silt, relics, tiers in src/data/validate.js plus tests/data.test.js. Reject unknown keys, non-finite numbers, and negative costs."
- P2-2 Tables: "Create src/data/{crews,rules,silt,relics,tiers}.js from GAME_DESIGN sections 3, 5, 6. Every number must trace to GAME_DESIGN; list any number you had to invent as UNVALIDATED in a comment."
- P2-3 Cost tables: "Write tools/econ-tables.js that generates cost tables floor(base * 1.15^n) by iterative multiplication (no Math.pow) for n = 0..60 and verifies monotonicity. Output a markdown table to stdout."
- P2-4 Paper simulation (QA role): "Hand-simulate the first 30 minutes with the numbers in the data tables as a script, tools/paper-sim.js: timber income, purchases, tier 1 and 2 clear times. Report time to first purchase, dead zones over 2 minutes, and time to clear RIVER."
- P2-5 Review (Designer/QA role): "List every GAME_DESIGN claim marked VERIFIED and re-run the tool that verifies it; list every UNVALIDATED claim and the test that would validate it."
Gate: validators pass; econ table script reproduces the cost columns; paper-sim time to first purchase <= 20 s; every number in GAME_DESIGN has a data home; designer sign-off. Lock p2-lock.

### P3. Technical foundation (M0)
Goal: an empty but real, bootable, testable app. Output: index.html, style.css, src/main.js, src/app/loop.js, tools/smoke.js, tools/check-deps.js, CI workflow.
READ: CONTEXT.md, docs/ARCHITECTURE.md sections 2, 4, 10, 14.
- P3-1 Repo hygiene: "git init conventions: .gitignore, npm scripts, .editorconfig, branch rules; GitHub Actions running test + typecheck + smoke. Do not change src/core."
- P3-2 Boot: "index.html, style.css, src/main.js: 320x180 canvas, integer scale, pixelated, ES modules, a single square drawn. No gameplay."
- P3-3 Loop: "src/app/loop.js: fixed 30 Hz accumulator, dt cap 0.25 s, interpolation alpha passed to render, FPS overlay on F3. Unit-test the accumulator with a fake clock."
- P3-4 Smoke: "tools/smoke.js with Playwright: load page, no console errors, canvas present, 120 frames advance, one input moves the square, save PNG."
- P3-5 Dependency lint: "tools/check-deps.js enforcing layer direction (ARCHITECTURE section 2) and banned identifiers in core (Math.random, Date.now, performance, Math.sin/cos/pow/exp/log, document, window)."
Gate: fresh clone: `npm i && npm test && npm run typecheck && npm run smoke` all green; screenshot; CI green. Lock p3-lock.

### P4. Core simulation A (headless)
Goal: the deterministic core plus the command and event layer, all testable without a screen. Existing: physics (rng, hash, dam, sea, step) BUILT; P4 verifies and extends. Output: src/core/{commands,events,economy}.js and tests.
READ: CONTEXT.md, docs/ARCHITECTURE.md sections 4-9, src/core/*.js, src/data/*.js.
- P4-1 Verify physics: "Audit src/core/{dam,sea,step}.js against ARCHITECTURE section 8 and the invariants; add missing tests: order independence of cascade passes, previewMaxRatio (pure query, no mutation), sluice effect, overtopping. Fix only what tests prove wrong."
- P4-2 Events: "src/core/events.js: preallocated Int32 ring buffer with typed event ids from ARCHITECTURE section 9; emit from stepSim for CELL_BROKEN, CASCADE, SURGE_WARNING, SURGE_PEAK, FLOOD, TIDE_END. Zero allocation per tick (assert with a heap test)."
- P4-3 Economy: "src/core/economy.js: resources, material costs, ruin discount, repair cost, cost tables from data; pure functions plus fuzz tests (never negative, no NaN)."
- P4-4 Commands: "src/core/commands.js: dispatch(state, cmd) for PLACE, REPAIR, TAP_TREE, TOGGLE_SLUICE; validation returns {ok, code}; golden-hash test over a scripted command log."
- P4-5 Headless play: "tools/play.js: a bot plays STREAM tier through dispatch only and clears it; print time, spend, breaks."
Gate: bot clears STREAM headless; all new tests green; heap flat over 10,000 ticks; hashes stable across two runs. Lock p4-lock.

### P5. Toy (first playable, M1): the GO/NO-GO gate
Goal: prove the core verb is fun with placeholder shapes. Output: src/render/{draw,overlay}.js, src/ui/{input,hud}.js, debug panel. No art, no audio beyond a beep, no story.
READ: CONTEXT.md, ARCHITECTURE sections 9-10, src/app/loop.js, src/core/commands.js, events.js.
- P5-1 Draw: "src/render/draw.js: dam cells as flat colored rects by material, sea fill to sea level, valley meter bar, resource counters. Reads state only."
- P5-2 Input: "src/ui/input.js: pointer drag over cells fires PLACE, click on cell fires REPAIR, key T taps tree; all through dispatch. Touch-safe."
- P5-3 Overlay: "src/render/overlay.js: stress tint by load/strength with colorblind-safe pattern, fatigue shown as cracks, forecast strip with uncertainty band, worst-case readout via previewMaxRatio."
- P5-4 Feedback: "On CELL_BROKEN: 3-frame shake and a placeholder beep; on FLOOD: a plain card. Events consumed from the ring buffer only."
- P5-5 Debug panel: "F4: add resources, skip x30, force surge, set tier, dump hash."
Gate (toy test): 5 people, 3 minutes each, no instructions. Record time to first place, first purchase, whether they used the overlay, and whether they kept playing after being told they could stop. PASS = at least 3 of 5 keep playing. FAIL = back to P2 to change the verb or tension; no polish allowed. Results logged in DECISIONS.md. Lock p5-lock.

### P6. Systems (M2)
Goal: the full Tier 1 loop with automation and meta. Output: src/core/{crews,rules,meta}.js, src/app/{save,migrations}.js, fixtures.
READ: CONTEXT.md, GAME_DESIGN sections 5-6, ARCHITECTURE sections 5, 12, src/core/*.js, src/data/*.js.
- P6-1 Crews: "Gatherer, Lodge capacity, HIRE command, production per tick with golden hash update."
- P6-2 Rule engine: "src/core/rules.js per GAME_DESIGN section 5: conditions, selectors, actions, deterministic tie-breaks, row limits. 20 unit tests plus a fuzz test where random rule sets never crash or allocate."
- P6-3 Mason and starter rule: "Mason executes PATCH from the starter row; headless test shows a staged breach patched without input."
- P6-4 Flood and washout: "Flood washout turns submerged cells into ruins, resets the clean-tide counter, tier clears after 5 clean tides."
- P6-5 Silt (minimal): "Silt payout with flood decay; a test proves repeated floods are never the fastest route (flood-farmer bot)."
- P6-6 Rule editor UI: "Minimal rule rows UI: add, reorder, enable, delete; validation messages."
- P6-7 Save v1: "Versioned save with tmp/bak rotation, crc, migration scaffold, fixture, and a corrupt-save fuzz test."
Gate: stranger plays Tier 1 from tutorial-less start to clear in one sitting with a crew and one rule row; 5 rounds no crash; save/reload round-trips with identical hash. Lock p6-lock.

### P7. Art direction and pipeline
Goal: one consistent look, produced through tools. Output: docs/ART_BIBLE.md, tools/{palette,atlas,assets-check}.js, assets/ with atlas.
READ: CONTEXT.md, ARCHITECTURE section 10, docs/lore/WORLD.md.
- P7-1 Art bible: "docs/ART_BIBLE.md: 16-color palette (hex list), outline rule, light direction, sizes (cell 6 px, beaver 12 px, tree 16x24), animation frame counts, forbidden elements. No art yet."
- P7-2 Palette tool: "tools/palette.js quantizes any PNG to the palette and checks sizes; tests with fixture images."
- P7-3 Atlas tool and manifest: "tools/atlas.js packs per-ID PNGs into one atlas and manifest; tools/assets-check.js reports missing, extra, off-palette, wrong-size files."
- P7-4 Sprite batch 1: generate with an image model using the art bible; run through palette tool; materials, dam cell states (cracked, ruin), trees, beaver idle/work. Designer approves each.
- P7-5 Atlas loader: "src/render/atlas.js loads the atlas before the loop starts, placeholder for missing IDs, dev overlay lists missing assets."
Gate: assets-check clean; 10-second screen recording with final sprites in the toy; designer approves look. Lock p7-lock.

### P8. Audio
Goal: procedural sound that carries tension. Output: src/audio/*, data/sfx.js, data/music.js, debug audio page.
READ: CONTEXT.md, ARCHITECTURE sections 9, 11, playbook audio notes, data tables.
- P8-1 Engine: "AudioContext bus graph, limiter, resume on first gesture, volume settings, pause on hidden tab, voice cap 16."
- P8-2 SFX recipes: "sfxr-style recipe player, OfflineAudioContext pre-render, recipes for place, repair, creak, surge horn, burst, silt chime; 3-5 variations each."
- P8-3 Pressure rumble: "Continuous layer whose gain and filter follow max stress ratio and sea level; zero clicks on changes (parameter ramps)."
- P8-4 Music layers: "Lookahead sequencer, key and tempo in data, pad plus pulse layers fading by state, bar-boundary transitions, seeded RNG."
- P8-5 Debug page: "Fire every recipe, preview every layer, show voices and peak level."
Gate: no clipping at peak activity; works after tab hide/show; rapid placing never crackles; every critical cue also visible. Lock p8-lock.

### P9. VFX and juice
Goal: every important event has a visible reaction from one toolkit. Output: src/vfx/*, data/vfx.js, debug panel.
READ: CONTEXT.md, ARCHITECTURE sections 9, 11.
- P9-1 Tween and particles: "Tween engine with easings; pooled particle emitters defined in data; zero per-frame allocation (test)."
- P9-2 Shake, hit-stop, flashes: "Trauma shake (offset = trauma^2 * noise, integer rounded), hit-stop on CASCADE, flash cap 3 per second."
- P9-3 Event table: "data/vfx.js maps each event to effects: dust on place, spray at surge peak, burst debris on CELL_BROKEN, silt settle on tide end."
- P9-4 Water and light: "Layered water surface, lamp-free lighting via additive glow, dither wipe between tiers."
- P9-5 Settings: "Effects intensity (off/low/full), reduce-motion, particle cap, shake toggle."
Gate: 60 fps at 4x CPU throttle during a full cascade; flash test never exceeds 3 per second; fire-every-effect debug panel works. Lock p9-lock.

### P10. Vertical slice (M3)
Goal: Tier 1 to Tier 2 at final quality with a tutorial. Output: tutorial script, HUD polish, first relic hook (stub), settings screen.
READ: CONTEXT.md, GAME_DESIGN section 8, docs/story/OPENING.md.
- P10-1 Tutorial: "Implement the section 8 pacing script as data-driven hints (trigger conditions, dismiss rules, never blocking)."
- P10-2 HUD polish: "Readable at 320x180, scales on mobile, all text from data tables."
- P10-3 Settings: "Volume, effects intensity, reduce-motion, stress pattern, key hints."
- P10-4 First relic stub: "At lifetime silt 15 show a codex card with R01 text; no story engine yet."
Gate: a stranger plays STREAM to RIVER with no help; recording; 0 console errors; golden hashes unchanged since P6. Lock p10-lock.

### P11. Narrative implementation
Goal: put the P1 story into the game. Output: src/core/story.js, src/ui/{story,codex}.js, data/story.js, cutscene engine.
READ: CONTEXT.md, STORY_BIBLE, docs/story/*, src/data/story schema.
- P11-1 Story engine: "Event/dialogue scripts as JSON with triggers and flags stored in MetaState; one interpreter; migration for the new state."
- P11-2 Opening: "Implement OPENING.md beats as a data-driven cutscene (wait, show, move, tween, text, sfx, end), skippable, replayable from debug."
- P11-3 Relics: "Writer batches R05-R12 as JSON; story-lint tool; relic discovery UI; codex."
- P11-4 Antagonist: "THE REEVE commission beats and optional objectives."
- P11-5 Endings: "Hold, Release, Terrace with unlock conditions, still images, music cues."
Gate: story-lint clean; every relic reachable; all 3 endings reachable headless; no beat spoils a later relic. Lock p11-lock.

### P12. Content expansion (M4)
Goal: breadth through data. Output: tiers 3-5, Digger/Quarryman/Watcher, Silt Garden, rule vocabulary unlocks.
READ: CONTEXT.md, GAME_DESIGN, data tables.
- P12-1 Tiers 3-5 data and sprites; P12-2 new crews; P12-3 Silt Garden screen and 12 upgrades; P12-4 vocabulary unlocks and Rule Slot upgrades; P12-5 data-validate extended.
Gate: every unlock reachable by a bot; validators clean; smoke covers each tier boot. Lock p12-lock.

### P13. Balance
Goal: measured pacing. Output: tuned data only, BALANCE_LOG.md, sim reports.
READ: CONTEXT.md, TEST_PLAN balance targets, tools/*.
- P13-1 Bots (greedy economy, rule-based, flood farmer, idle); P13-2 pacing tables per tier; P13-3 tune constants in data only; P13-4 re-verify survival table and cascade distribution.
Gate: every TEST_PLAN balance target met or explicitly waived with a DECISIONS entry. No logic changes allowed in this phase. Lock p13-lock.

### P14. Polish and reach (M6)
Goal: accessible, performant, shareable. Output: accessibility pass, mobile pass, cross-browser golden hash, share cards, Daily Tide.
- P14-1 Accessibility; P14-2 mobile touch; P14-3 perf vs budgets; P14-4 Chrome/Firefox hash match; P14-5 share cards; P14-6 Daily Tide (shared seed, spoiler-free result).
Gate: budgets met; hashes match across browsers; keyboard-only run works. Lock p14-lock.

### P15. Playtest and fix (M7)
5-10 silent playtests; fix list ranked by drop-off; each fix is a locked-phase bug fix (section 1.4). Gate: no top-5 drop-off remains. Lock p15-lock.

### P16. Launch (M8)
Hosting, page copy, 15 s clip, screenshots, press kit, soft launch. Tag v1.0.

## 3. Phase tracker
Kept in docs/PHASE_STATUS.md. Current: P0 DONE (pitch test open), P1 next.

## 4. Bug triage: where a bug belongs
| Symptom | Phase | Files | Rerun |
|---|---|---|---|
| NaN, wrong load, cascade too big/small, wrong tide | P4 | core/dam,sea,step | unit + golden + fuzz |
| Command rejected wrongly, cost wrong | P4 | core/commands,economy | unit + fuzz |
| Cannot place/drag, wrong cell clicked | P5 | ui/input, render | smoke + manual |
| Crew idle, rule never fires, wrong target | P6 | core/rules,crews | rule tests + headless bot |
| Flood/silt math wrong, floods farmable | P6 | core/meta | flood-farmer bot |
| Save lost, corrupt, wrong after update | P6 | app/save, migrations | fixtures + fuzz |
| Looks inconsistent, wrong size, missing sprite | P7 | assets, tools/palette | assets-check |
| Crackle, silence after tab switch, too loud | P8 | audio | debug page + manual |
| Effects too much, lag on cascade, flashing | P9 | vfx | perf + flash test |
| Tutorial confusing or blocking | P10 | data/tutorial | stranger test |
| Story contradiction, early spoiler, typo | P1 (docs) or P11 (impl) | docs/story, data/story | story-lint + audit |
| A number feels wrong | P13 | src/data only | sim reports |
| Missing unlock, wrong tier data | P12 | src/data | bots + validators |
| Frame drops, hash mismatch across browsers | P14 | render, core math | perf + cross-browser |
Rule: if a bug lives in an earlier phase than the one active, fix it there first (section 1.4), then continue.

## 5. Why this prevents the old failure
Each prompt has one deliverable and a proof; nothing builds on an unproven layer; the AI never sees files outside its phase; and a bug has an address.
