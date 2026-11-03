// @ts-check
import { CREWS, CREW_SETTINGS } from '../src/data/crews.js';
import { RELICS } from '../src/data/relics.js';
import { SILT_SETTINGS } from '../src/data/silt.js';
import { TIERS } from '../src/data/tiers.js';
import { MAT, MATERIALS } from '../src/data/balance.js';
import { PACING_SETTINGS } from '../src/data/progression.js';
import { validateCrews, validateRelics, validateTiers } from '../src/data/validate.js';

const SECONDS_PER_MINUTE = 60;
const SIM_DURATION_S = 30 * SECONDS_PER_MINUTE;
const FIRST_GATHERER_HIRE_S = PACING_SETTINGS.milestones_s.firstGatherer;
const MASON_HIRE_S = PACING_SETTINGS.milestones_s.firstMason;
const FIRST_ROW_PLACE_S = PACING_SETTINGS.milestones_s.firstPlacement;
const MAX_DEAD_ZONE_S = 2 * SECONDS_PER_MINUTE;
const SPECIAL_CREW_IDS = ['CREW_DIGGER', 'CREW_WATCHER', 'CREW_QUARRYMAN'];

/** @typedef {{time_s: number, kind: string, detail: string}} SimEvent */

/** @param {number} seconds @returns {string} */
function timeLabel(seconds) {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const remainder = seconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

/** @param {Set<number>} taps @param {number} start_s @param {number} end_s */
function addTapWindow(taps, start_s, end_s) {
  for (let time_s = start_s; time_s < end_s; time_s++) taps.add(time_s);
}

/** @param {Map<string, number>} crewCounts @param {string} crewId @returns {number} */
function countCrew(crewCounts, crewId) {
  return crewCounts.get(crewId) ?? 0;
}

/** @param {Map<string, number>} crewCounts @returns {number} */
function crewTotal(crewCounts) {
  let total = 0;
  for (const count of crewCounts.values()) total += count;
  return total;
}

/** @param {number} baseCost @param {number} multiplier @param {number} ownedCount @returns {number} */
function scaledCost(baseCost, multiplier, ownedCount) {
  let unrounded = baseCost;
  for (let index = 0; index < ownedCount; index++) unrounded *= multiplier;
  return Math.floor(unrounded);
}

/** @param {number} lodgeLevel @returns {number} */
function lodgeUpgradeCost(lodgeLevel) {
  return scaledCost(CREW_SETTINGS.lodgeBaseCost, CREW_SETTINGS.lodgeCostMultiplier, lodgeLevel);
}

/** @param {number} tierIndex @returns {number} */
function lodgeCapacity(tierIndex) {
  return CREW_SETTINGS.lodgeCapacityStart + tierIndex * CREW_SETTINGS.lodgeCapacityPerLevel;
}

/** @param {string} crewId @returns {number} */
function crewBaseCost(crewId) {
  const crew = CREWS.find(item => item.id === crewId);
  if (!crew) throw new Error(`Unknown crew: ${crewId}`);
  return crew.baseCost;
}

/** @param {string} crewId @param {Map<string, number>} crewCounts @returns {number} */
function crewHireCost(crewId, crewCounts) {
  return scaledCost(crewBaseCost(crewId), CREW_SETTINGS.hireCostMultiplier, countCrew(crewCounts, crewId));
}

/** @param {number} time_s @param {string} kind @param {string} detail @param {SimEvent[]} events */
function recordEvent(time_s, kind, detail, events) {
  events.push({ time_s, kind, detail });
}

/** @param {string} crewId @param {number} time_s @param {Map<string, number>} crewCounts @param {{timber: number, mud: number, stone: number}} stocks @param {SimEvent[]} events @param {number} lodgeLevel */
function hireCrew(crewId, time_s, crewCounts, stocks, events, lodgeLevel) {
  const cost = crewHireCost(crewId, crewCounts);
  if (stocks.timber < cost) throw new Error(`Cannot afford ${crewId} at ${timeLabel(time_s)}: need ${cost}, have ${stocks.timber}`);
  if (crewTotal(crewCounts) >= lodgeCapacity(lodgeLevel)) throw new Error(`Lodge has no slot for ${crewId}`);
  stocks.timber -= cost;
  crewCounts.set(crewId, countCrew(crewCounts, crewId) + 1);
  recordEvent(time_s, 'PURCHASE', `Hire ${crewId} for ${cost} Timber`, events);
}

/** @param {number} time_s @param {Map<string, number>} crewCounts @param {{timber: number, mud: number, stone: number}} stocks @param {SimEvent[]} events @param {number} lodgeLevel @returns {number} */
function buyLodgeLevel(time_s, crewCounts, stocks, events, lodgeLevel) {
  const cost = lodgeUpgradeCost(lodgeLevel);
  if (stocks.timber < cost) return lodgeLevel;
  stocks.timber -= cost;
  const nextLevel = lodgeLevel + 1;
  recordEvent(time_s, 'PURCHASE', `Lodge level ${nextLevel} for ${cost} Timber (capacity ${lodgeCapacity(nextLevel)})`, events);
  return nextLevel;
}

/** @param {number} tierIndex @param {Map<string, number>} crewCounts @returns {string | null} */
function nextUnlockedSpecial(tierIndex, crewCounts) {
  for (const crewId of SPECIAL_CREW_IDS) {
    if (countCrew(crewCounts, crewId) > 0) continue;
    const crew = CREWS.find(item => item.id === crewId);
    if (!crew) throw new Error(`Missing crew data for ${crewId}`);
    const unlockIndex = TIERS.findIndex(tier => tier.id === crew.unlock);
    if (unlockIndex >= 0 && tierIndex >= unlockIndex) return crewId;
  }
  return null;
}

/** @param {number} time_s @param {number} tierIndex @param {Map<string, number>} crewCounts @param {{timber: number, mud: number, stone: number}} stocks @param {SimEvent[]} events @param {number} lodgeLevel @returns {number} */
function tryOnePurchase(time_s, tierIndex, crewCounts, stocks, events, lodgeLevel) {
  const pendingSpecial = nextUnlockedSpecial(tierIndex, crewCounts);
  const hasFreeSlot = crewTotal(crewCounts) < lodgeCapacity(lodgeLevel);
  if (pendingSpecial !== null && !hasFreeSlot) return buyLodgeLevel(time_s, crewCounts, stocks, events, lodgeLevel);
  if (pendingSpecial !== null) {
    if (stocks.timber >= crewHireCost(pendingSpecial, crewCounts)) {
      hireCrew(pendingSpecial, time_s, crewCounts, stocks, events, lodgeLevel);
      return lodgeLevel;
    }
    return lodgeLevel;
  }
  if (!hasFreeSlot) return buyLodgeLevel(time_s, crewCounts, stocks, events, lodgeLevel);
  if (stocks.timber >= crewHireCost('CREW_GATHERER', crewCounts)) {
    hireCrew('CREW_GATHERER', time_s, crewCounts, stocks, events, lodgeLevel);
  }
  return lodgeLevel;
}

/** @param {Map<string, number>} crewCounts @param {{timber: number, mud: number, stone: number}} stocks @param {{timber: number, mud: number, stone: number}} totals */
function addCrewIncome(crewCounts, stocks, totals) {
  for (const crew of CREWS) {
    const rate = crew.baseRate * countCrew(crewCounts, crew.id);
    if (crew.id === 'CREW_GATHERER') {
      stocks.timber += rate;
      totals.timber += rate;
    } else if (crew.id === 'CREW_DIGGER') {
      stocks.mud += rate;
      totals.mud += rate;
    } else if (crew.id === 'CREW_QUARRYMAN') {
      stocks.stone += rate;
      totals.stone += rate;
    }
  }
}

/** @param {SimEvent[]} events @returns {{maxGap_s: number, deadZones: {start_s: number, end_s: number, gap_s: number}[]}} */
function analyzeDeadZones(events) {
  const ordered = events
    .filter(event => event.kind === 'TAP' || event.kind === 'PURCHASE' || event.kind === 'TIER_CLEARED')
    .sort((a, b) => a.time_s - b.time_s);
  const deadZones = [];
  let maxGap_s = 0;
  for (let index = 1; index < ordered.length; index++) {
    const start_s = ordered[index - 1].time_s;
    const end_s = ordered[index].time_s;
    const gap_s = end_s - start_s;
    if (gap_s > maxGap_s) maxGap_s = gap_s;
    if (gap_s > MAX_DEAD_ZONE_S) deadZones.push({ start_s, end_s, gap_s });
  }
  return { maxGap_s, deadZones };
}

validateCrews(CREWS);
validateRelics(RELICS);
validateTiers(TIERS);

const taps = new Set();
// UNVALIDATED assumption: the economy model uses one manual tree tap per second in short setup bursts.
addTapWindow(taps, 0, 16);
addTapWindow(taps, 70, 90);
addTapWindow(taps, 175, 180);

/** @type {{timber: number, mud: number, stone: number}} */
const stocks = { timber: 0, mud: 0, stone: 0 };
/** @type {{timber: number, mud: number, stone: number}} */
const incomeTotals = { timber: 0, mud: 0, stone: 0 };
/** @type {Map<string, number>} */
const crewCounts = new Map();
/** @type {SimEvent[]} */
const events = [];
/** @type {SimEvent[]} */
const tierClears = [];
let manualTimber = 0;
let cleanSilt = 0;
let lodgeLevel = 0;
let tierIndex = 0;
let cleanTides = 0;
let nextTideAt_s = TIERS[0].period_s;
let firstPurchase_s = -1;
const stick = MATERIALS[MAT.STICK];
if (!stick) throw new Error('Missing STICK material data');

for (let time_s = 0; time_s <= SIM_DURATION_S; time_s++) {
  if (time_s > 0) addCrewIncome(crewCounts, stocks, incomeTotals);
  if (taps.has(time_s)) {
    stocks.timber += 1;
    manualTimber += 1;
    recordEvent(time_s, 'TAP', 'Tap a tree for 1 Timber', events);
  }
  if (time_s === FIRST_ROW_PLACE_S) {
    const cost = TIERS[0].w * stick.cost;
    if (stocks.timber < cost) throw new Error(`Cannot place STREAM bottom row at ${timeLabel(time_s)}`);
    stocks.timber -= cost;
    firstPurchase_s = time_s;
    recordEvent(time_s, 'PURCHASE', `Place ${TIERS[0].w} Stick cells for ${cost} Timber`, events);
  }
  if (time_s === FIRST_GATHERER_HIRE_S) hireCrew('CREW_GATHERER', time_s, crewCounts, stocks, events, lodgeLevel);
  if (time_s === MASON_HIRE_S) hireCrew('CREW_MASON', time_s, crewCounts, stocks, events, lodgeLevel);

  if (time_s === nextTideAt_s) {
    const tier = TIERS[tierIndex];
    if (!tier) break;
    cleanTides++;
    cleanSilt += SILT_SETTINGS.cleanTideBaseSilt * (tierIndex + 1);
    recordEvent(time_s, 'TIDE_END', `${tier.id} clean tide ${cleanTides}/${tier.tidesToClear}`, events);
    if (cleanTides >= tier.tidesToClear) {
      tierClears.push({ time_s, kind: 'TIER_CLEARED', detail: `Clear ${tier.id}` });
      recordEvent(time_s, 'TIER_CLEARED', `Clear ${tier.id}`, events);
      tierIndex++;
      cleanTides = 0;
      if (TIERS[tierIndex]) nextTideAt_s = time_s + TIERS[tierIndex].period_s;
    } else {
      nextTideAt_s += tier.period_s;
    }
  }

  if (time_s >= TIERS[0].period_s * TIERS[0].tidesToClear && tierIndex < TIERS.length) {
    lodgeLevel = tryOnePurchase(time_s, tierIndex, crewCounts, stocks, events, lodgeLevel);
  }
}

const deadZoneReport = analyzeDeadZones(events);
const firstCrewPurchase = events.find(event => event.kind === 'PURCHASE' && event.detail.startsWith('Hire '));
const tier1 = tierClears.find(event => event.detail === 'Clear STREAM');
const tier2 = tierClears.find(event => event.detail === 'Clear RIVER');

console.log('# P2-4 Paper Simulation (30 minutes)');
console.log('UNVALIDATED scenario: zero floods; no placement/repair cost after the first STREAM bottom row; no material spend, offline income, or silt upgrades.');
console.log('UNVALIDATED player policy: manual taps in three setup bursts; after opening, buy unlocked specialist crews first, then Gatherers; expand Lodge when full and affordable.');
console.log(`First purchase: ${timeLabel(firstPurchase_s)} (STREAM bottom row); target <= ${timeLabel(PACING_SETTINGS.firstPurchaseMax_s)}: ${firstPurchase_s <= PACING_SETTINGS.firstPurchaseMax_s ? 'PASS' : 'MISS'}.`);
console.log(`First crew: ${firstCrewPurchase ? `${timeLabel(firstCrewPurchase.time_s)} (${firstCrewPurchase.detail})` : 'none'}.`);
console.log(`Clean-run clears: STREAM ${tier1 ? timeLabel(tier1.time_s) : 'not cleared'}; RIVER ${tier2 ? timeLabel(tier2.time_s) : 'not cleared'} total (${tier2 ? timeLabel(tier2.time_s - (tier1?.time_s ?? 0)) : 'n/a'} in RIVER).`);
console.log(`Manual Timber taps: ${manualTimber}; passive income: Timber ${incomeTotals.timber.toFixed(1)}, Mud ${incomeTotals.mud.toFixed(1)}, Stone ${incomeTotals.stone.toFixed(1)}.`);
console.log(`At 30:00: Timber ${stocks.timber.toFixed(1)}, Mud ${stocks.mud.toFixed(1)}, Stone ${stocks.stone.toFixed(1)}, clean-tide Silt ${cleanSilt}.`);
console.log(`Dead-zone check (manual taps, purchases, and tier clears): max gap ${timeLabel(deadZoneReport.maxGap_s)}; gaps > 02:00: ${deadZoneReport.deadZones.length}.`);
for (const gap of deadZoneReport.deadZones) {
  console.log(`- Gap ${timeLabel(gap.start_s)}–${timeLabel(gap.end_s)} (${timeLabel(gap.gap_s)}).`);
}
console.log('\n## Purchases');
for (const event of events.filter(item => item.kind === 'PURCHASE')) {
  console.log(`- ${timeLabel(event.time_s)} — ${event.detail}`);
}
console.log('\n## Tier clears');
for (const event of tierClears) console.log(`- ${timeLabel(event.time_s)} — ${event.detail}`);
