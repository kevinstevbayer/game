# GAME DESIGN: Overflow (mechanics with numbers)

Every number here is a v0 proposal unless marked VERIFIED (measured by the code in this repo). All numbers live in src/data/. Balance is NOT tuned: validate with tools/sim.js and playtests (TEST_PLAN.md).

## 1. The screen
Elevation view of the dam wall, 320x180 internal. Sea on the left behind the wall, valley on the right. The dam is a `w x h` grid of cells (row 0 bottom). HUD: tide clock, sea level, stress overlay toggle, forecast strip (next surges), valley meter, resources, crew bar.

## 2. Physics model (VERIFIED, implemented in core/dam.js, sea.js, step.js)
- Sea level (cells) = floor 0.5 + (peak - 0.5) * 4u(1-u) + surge pulses, u = t / period. Surges are triangular pulses, 8 s wide, 1..3 per tide (tier), magnitude 0.4..1.0 x tier max, arrival in the 30%-70% window of the tide.
- Load on a cell = depth of water above its centre (cells). Strength is in the same unit. A cell breaks when load > strength * (1 - 0.5 * fatigue).
- A broken or unbuilt region orphans its load; 40% (LOAD_TRANSFER) of the region's total goes to its intact boundary cells. This produces local breaches (median first cascade 7.7% of cells) and rare total collapses (p90 100%). VERIFIED.
- Fatigue: cell accumulates 0.4 * (ratio - 0.6)^2 per second while ratio > 0.6. At 0 -> 1 fatigue the cell has half its strength. Repair resets it. VERIFIED: repair roughly doubles tides survived by an under-built dam (BAY 11 -> 20+, OCEAN 4 -> 8).
- Leaks: every unbuilt/broken cell below sea level leaks 0.1 * sqrt(depth) per second into the valley; overtopping leaks 0.4 * excess * sqrt(excess) per column. Valley drains 0.3/s. Valley cap 100. Reaching the cap = Flood.
- Sluice: open = loads computed at 80% of sea level, valley inflow +1.0/s. A deliberate trade of safe leakage for lower burst risk.

### Fatigue-free material rule (derived: strength * 0.6)
| Material | Strength | Fatigue-free up to depth | Cost per cell |
|---|---|---|---|
| Stick | 10 | 6.0 | 1 Timber |
| Mud | 16 | 9.6 | 2 Mud |
| Stone | 30 | 18.0 | 4 Stone |
| Keystone | 60 | 36.0 | 12 Stone |

Worst-case depth at the bottom row per tier (peak + surge max - 0.5): STREAM 3.5, RIVER 6.5, BAY 10.0, SEA 14.0, OCEAN 19.5. Meaning: sticks are fine until RIVER's bottom row; BAY needs mud low down; SEA needs stone from depth 9.6 and below; OCEAN needs stone from 9.6 and Keystone for depths above 18 (rows 0-1).
VERIFIED survival (6 tides x 20 seeds, full dam): BAY sticks-only floods 20/20; BAY byDepth(mud>8) 0/20; SEA byDepth(stone only >14) 20/20; OCEAN byDepth 19/20; overbuilt (keystone>10, stone>6, else mud) 0/20 everywhere. Players learn the rule above through stress colors.

## 3. Tiers
| # | Tier | Grid | Peak | Surge max | Surges/tide | Period | Clean tides to clear | Min clean time |
|---|---|---|---|---|---|---|---|---|
| 1 | Stream | 16x6 | 3.5 | 0.5 | 1 | 60 s | 5 | 5.0 min |
| 2 | River | 24x9 | 6.0 | 1.0 | 2 | 75 s | 6 | 7.5 min |
| 3 | Bay | 32x13 | 9.0 | 1.5 | 2 | 90 s | 8 | 12.0 min |
| 4 | Sea | 40x17 | 12.5 | 2.0 | 3 | 105 s | 10 | 17.5 min |
| 5 | Ocean | 48x22 | 17.0 | 3.0 | 3 | 120 s | 12 | 24.0 min |
Minimum clean-run time 66 min. Design target 3 h including building, floods, and meta play (UNVALIDATED). A flood resets the consecutive clean-tide counter for that tier.
Unlocks: sluice at RIVER, mud at RIVER, stone at BAY, keystone at SEA.

## 4. Player actions
- TAP_TREE: +1 Timber * (1 + toolLevel) per tap (toolLevel from silt upgrades). No cooldown.
- PLACE (drag over cells): spends the material's resource per cell. Ruin cells cost 50% (ceil, min 1) at start.
- REPAIR (tap a fatigued cell): 25% of the cell's cost (ceil, min 1); resets fatigue.
- TOGGLE_SLUICE (from RIVER).
- HIRE / assign crews, edit rule rows, spend silt, start next tier.
Feedback: every place/repair has a sound and dust puff; cells tint by stress ratio; creak sound begins at ratio 0.6.

## 5. Crews and automation
| Crew | Job | Base rate | Hire cost (n owned) | Unlock |
|---|---|---|---|---|
| Gatherer | Timber | 0.5 /s | 20 * 1.15^n Timber | start |
| Mason | Executes build/repair actions: 1 action per 1.0 s | 1 action/s | 50 * 1.15^n Timber | tutorial (T1, minute 3) |
| Digger | Mud | 0.4 /s | 40 * 1.15^n Timber | River |
| Quarryman | Stone | 0.3 /s | 60 * 1.15^n Timber | Bay |
| Watcher | +2 s forecast lead, -15% forecast uncertainty (stacks to 3) | n/a | 80 * 1.15^n Timber | River |
Lodge capacity: 4 crews at start; each Lodge level +2 (cost 100 * 2^L Timber). Silt upgrades add rate and speed.

### Rule rows (the depth layer)
A Mason (and later other crews) owns an ordered list of rule rows. Each action tick the crew evaluates rows top to bottom; the first row whose conditions are all true, whose selector finds a target, and whose cost is affordable executes. Ties between cells break by lowest index. Max rows per crew: 2, +1 per Rule Slot upgrade (cap 8). Max 2 conditions per row.
- Conditions (vocabulary unlocked over time): HAS_BREACH; STRESS_GT(x%); FATIGUE_GT(x%); SURGE_ETA_LT(s); VALLEY_GT(x%); STOCK_GT(resource, n); ROW_BELOW(r).
- Selectors: LOWEST_ROW_BREACH; HIGHEST_STRESS; MOST_FATIGUED; NEAREST_TO_CREW.
- Actions: PATCH (fill a breach with the strongest affordable material allowed by a per-row material cap), REPAIR, UPGRADE (to the next material), TOGGLE_SLUICE.
Starter row (free, minute 3): IF HAS_BREACH THEN PATCH at LOWEST_ROW_BREACH.
Why this is depth: bad rows waste scarce stone, good rows prevent cascades; players tune thresholds against the forecast. Verify with the sim bot that no single trivial row set trivializes every tier.

## 6. Meta layer: Silt
- Clean tide pays 1 * tier# silt (tier# 1..5). Flood pays 10 * tier# * 0.5^(floods this tier), floor 10% (anti-farm: repeated floods decay).
- Flood = washout: every cell below the sea level at the moment of the flood becomes ruin (mat 0, ruin 1); cells above remain. The valley meter resets, the tide restarts at tide index 0 for that tier, the clean-tide counter resets.
- Silt spending (Silt Garden, cost = base * 2^level):
| Upgrade | Effect per level | Max | Base cost |
|---|---|---|---|
| Tough Timber | +5% material strength | 5 | 4 |
| Quick Paws | +15% crew action speed | 4 | 6 |
| Deep Pockets | +25% gather rates | 4 | 5 |
| Longer Lodge | +2 crew capacity | 3 | 10 |
| Rule Slot | +1 rule row per crew | 6 | 12 |
| Keen Eyes | +3 s forecast lead | 3 | 8 |
| Steady Forecast | -25% uncertainty | 3 | 10 |
| Ruin Memory | ruin discount +10 points | 4 | 8 |
| Silt Sense | +20% silt gain | 3 | 15 |
| Spillway Craft | +5 points sluice relief, -15% sluice inflow | 3 | 14 |
| Cheap Fixes | -50% repair cost | 2 | 10 |
| Foreman's Sight | fatigue overlay and worst-case preview | 1 | 25 |
- Relics: found in the silt at lifetime-silt thresholds 15, 40, 80, 140, 220, 330, 470, 640, 850, 1100, 1400, 1800 (12 relics). Each relic is a story beat (STORY_BIBLE.md).

## 7. Forecast and odds
Forecast strip shows each upcoming surge: ETA (visible 10 s ahead + Watchers), estimated magnitude with an uncertainty band that shrinks linearly to zero at 2 s before arrival. Worst-case readout = max stress ratio computed at (current level + upper-bound surge). The player decides with visible information; there is no hidden randomness at the moment of failure. Randomness lives only in the seeded tide generation.

## 8. Pacing script for the first 5 minutes (Tier 1)
0:00 tap trees (hint: tap). 0:20 place first sticks (drag). 0:45 first tide visible; surge 0.5 harmless; stress overlay shown. 1:30 first Gatherer. 2:30 tier progress 2/5 shown. 3:00 first Mason and the starter rule row. 4:30 Tide 5 includes an obvious weak cell; a visible small breach, patched by the rule row. 5:00 Tier 1 cleared; silt preview teaser at first flood or at tier clear. Goal: first purchase within 20 s (inclusive), first "wait, what?" (the relic in the silt) by minute 25.

## 9. Anti-exploit and fairness
- Flood farming: decaying silt (section 6). Sim bot must show floods are never the fastest route to the ending.
- Offline: only the economy advances while away (rate 25% baseline, cap 8 h); the dam and tide never advance offline, so absence cannot destroy a dam.
- No hidden failure: any cell that can break shows its ratio; cascades are explainable from the overlay.
- Accessibility: stress overlay uses color plus pattern; reduce-motion and effects-intensity settings; no more than 3 flashes per second; full keyboard path for placing and menus.

## 10. Endings
- Hold: clear Ocean (12 clean tides). The valley is saved; the sea retreats and cannot return.
- Release: with at least 6 relics, open the permanent sluice on the last tide. The valley floods into the old bed; villagers relocate; the dam becomes a bridge.
- Terrace: with all 12 relics and 500 silt, build the Terrace channel: the sea takes its old bed, the valley moves uphill, nobody is lost. Hidden best ending.

## 11. Open questions (do not invent answers; test them)
Do manual taps stay fun after the first Mason? Is 66-minute minimum pacing right? Do rule rows read clearly on mobile? Is washout too punishing at OCEAN? Do players notice the stress overlay without prompting?
