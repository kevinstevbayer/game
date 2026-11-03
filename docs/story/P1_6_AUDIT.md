# P1-6 CONTINUITY AUDIT (Auditor Role)

**Scope**: Cross-check `docs/lore/WORLD.md`, `docs/lore/TIMELINE.md`, `docs/story/CAST.md`, `docs/story/OPENING.md`, and `docs/story/RELICS_R01_R04.json` against `docs/STORY_BIBLE.md`, `docs/BRIEF.md`, `docs/GAME_DESIGN.md`, and `src/data/balance.js`.

## 1. Summary Findings
- **Internal P1 Contradictions after the corrections below (`WORLD`, `TIMELINE`, `CAST`, `OPENING`, `RELICS_R01_R04`)**: `0 known`
- **Clue-Schedule / Spoiler Violations**: `0`
- **JSON Schema / Line-Count Violations**: `0`
- **Upstream Spec Conflict Documented (`GAME_DESIGN.md` section 8 vs. section 3 & `PHASES.md` P1-4)**: `1` (see Section 3 below; `GAME_DESIGN.md` is locked during P1 and was not edited).

## 2. Verification Matrix Across P1 Deliverables
| Check | Requirement | Actual in Files | Status |
|---|---|---|---|
| `docs/lore/WORLD.md` length & rules | <= 600 words; geography, zero magic, social relations, 1-paragraph economy, 10 untold facts | 448 words; all 5 sections present; Role IDs and placeholders used | **PASS** |
| `docs/lore/TIMELINE.md` entries | <= 25 dated entries; who knew it; mapped to `R01-R12` or `NEVER` | 20 entries (`T-01`..`T-20`); all reveal values are `R01-R12` or `NEVER` | **PASS** |
| `docs/story/CAST.md` coverage | `FOREMAN`, 5 crews, `THE REEVE`, `THE SEA`, `PREDECESSORS`; want, secret, 3 speech rules, joke, change moment | All 9 groups present; Role IDs only. THE SEA motif now resolves only in Terrace, matching STORY_BIBLE. | **PASS after correction** |
| `docs/story/OPENING.md` schedule | B-001..B-030, <= 3 lines/beat, covers first 5 minutes (`0:00-5:00`), Tide 5 starts `4:00`, tier clears `5:00` | 30 beats (`B-001`..`B-030`), 1 line of text per beat, Tide 5 runs `4:00-5:00`, clears at `5:00` | **PASS** |
| `docs/story/OPENING.md` Silt clarity | Clarify whether final Silt at `5:00` is a tide payout or a separate clear reward | Explicitly stated in header and `B-030`: clean tide 5 pays standard `+1 Silt` tide payout (`1 * tier#`, total `5`); there is no separate tier-clear Silt bonus | **PASS** |
| `docs/story/RELICS_R01_R04.json` | Valid JSON; `R01-R04` at `15, 40, 80, 140` lifetime silt; <= 3 lines each; clue planted | Valid JSON array of 4 objects; 3 lines each; sequential `requires`/`sets` flags | **PASS** |
| Twist protection | `R01-R04` and `OPENING.md` must not spoil `R08` ("returning to its old bed") | Early clues only show prior beaver chew-marks (`R01`), basin resonance (`R02`), trimmed contour maps (`R03`), and an unfinished tally (`R04`) | **PASS** |

## 3. Continuity Corrections and Honest Documentation of Conflicts

- **THE SEA motif**: The supplied cast draft said the motif resolves in Release or Terrace. This contradicted STORY_BIBLE, which says it resolves only in Terrace. `CAST.md` is already corrected: Release leaves the motif unresolved. Gemini's later report of this issue was stale against the current file.
- **R01 age vs. timeline**: The original line said "eighty winters," but T-05/T-06 date the first pile to Y01-Y12 and FOREMAN begins in Y114. R01 now says "over a century ago," consistent with those dates.
- **T-20 reveal mapping**: The present-day opening event is not revealed by relic R01; its `Revealed By` value is now `NEVER`, as required by P1-2.
- **B-006 surge timing**: Moved the forecast/surge beat from 0:45 to 0:40, within the 18-42 second surge window for a 60-second tide.
- **PREDECESSORS #4**: `TIMELINE.md` states #4 reached OCEAN and voluntarily left, matching WORLD/STORY_BIBLE.

### Previously applied continuity corrections

- **THE SEA motif**: The supplied cast draft said the motif resolves in Release or Terrace. This contradicted STORY_BIBLE, which says it resolves only in Terrace. `CAST.md` is corrected: Release leaves the motif unresolved.
- **PREDECESSORS #4**: `TIMELINE.md` states that #4 reached OCEAN and voluntarily left, matching WORLD/STORY_BIBLE.

### Conflicts with `GAME_DESIGN.md` (For P2 Resolution)
1. **5-Minute Tier 1 Math vs. `GAME_DESIGN.md` Section 8 ("Pacing script for the first 6 minutes")**:
   - **The Conflict**: `src/data/balance.js` and `GAME_DESIGN.md` section 3 define `STREAM` as `period_s: 60` and `tidesToClear: 5`, which means 5 clean tides take exactly **5 minutes (`0:00` to `5:00`)**, with Tide 1 ending at `1:00`, Tide 2 at `2:00`, Tide 3 at `3:00`, Tide 4 at `4:00`, and Tide 5 running `4:00-5:00`. However, `GAME_DESIGN.md` section 8 is titled *"Pacing script for the first 6 minutes (Tier 1)"* and lists conflicting timestamps (`2:30 tier clear 1/5 shown`, `4:30 tide 3 includes an obvious weak cell`, `5:30 tier 1 cleared`).
   - **How `OPENING.md` Handled It**: Per P1 instructions, `OPENING.md` strictly obeys the 5-minute (`0:00-5:00`) schedule where Tide 5 starts at `4:00` and `STREAM` clears at `5:00`. Consequently, `GAME_DESIGN.md` section 8's later timestamps (`2:30` for `1/5`, `4:30` for Tide 3, `5:30` for clear) are **not** preserved at those clock times in `OPENING.md`; instead, `1/5` occurs at `1:00` (`B-008`), Tide 3 runs `2:00-3:00` (`B-014..B-018`), Tide 4 runs `3:00-4:00` (where the newly hired Mason auto-patches a breach at `3:30`, `B-021`), and Tier 1 clears at `5:00` (`B-030`).
   - **Action for Phase P2**: When updating `docs/GAME_DESIGN.md` to v1 in Phase P2, align section 8's timestamps to the 5:00 (`5 x 60 s`) schedule.
2. **Staged Breach Physics on `STREAM` (`B-016` and `B-021`)**:
   - **The Conflict**: `Stick` strength is `10`, while STREAM's worst-case bottom-row load is `3.5` cells. A fresh Stick ratio is at most `0.35`; even at fatigue `1.0`, effective strength is `5`, so fatigue alone cannot make a STREAM Stick cell break. The former note that `fat = 0.85` could produce a burst was incorrect.
   - **Correction**: `OPENING.md` now identifies B-016 and B-021 as scripted tutorial breach events. B-014's pre-fatigued cell demonstrates repair only; it must not be presented as naturally breaking under STREAM pressure.
   - **Action for Phase P10**: Implement the two explicit tutorial breach events (or equivalent tutorial-only cell removal) so the load-transfer and Mason `PATCH` lessons remain playable without changing physical balance rules.

## 4. Independent P0/P1 Review (2026-11-03)

- **P0 brief**: The scope, premise, endings, and failure-as-progress loop agree with current design documents. The P0 pitch test remains pending: its requirement is three strangers, so the AI-simulated P1 retells are not counted as P0 evidence.
- **P1 documents**: Rechecked role IDs, relic thresholds and dependencies, timeline reveal mapping, opening beat count/timing, and canon against `STORY_BIBLE.md`, `GAME_DESIGN.md`, and `src/data/balance.js`. Inline Node assertions passed: WORLD is 563 words, TIMELINE has 20 valid reveal entries, OPENING has 30 ordered beats ending at 5:00, and relic JSON has R01-R04 at 15/40/80/140 silt with at most three lines each. The staged STREAM breach issue above was the one concrete correction found in this pass.
- **Remaining P2 follow-up**: Reconcile the 5:00 STREAM clear with the stale 5:30 time in `GAME_DESIGN.md` section 8 when P2 owns that document.
