// @ts-check
import { CREWS, CREW_SETTINGS } from '../src/data/crews.js';
import { validateCrews } from '../src/data/validate.js';

const FIRST_OWNED_COUNT = 0;
const LAST_OWNED_COUNT = 60;

/**
 * Build floored hire costs by iterative multiplication; no exponentiation is used.
 * @param {number} baseCost
 * @param {number} multiplier
 * @param {number} maxOwnedCount
 * @returns {number[]}
 */
function buildCosts(baseCost, multiplier, maxOwnedCount) {
  if (!Number.isFinite(baseCost) || baseCost < 0) throw new Error('baseCost must be finite and nonnegative');
  if (!Number.isFinite(multiplier) || multiplier < 1) throw new Error('multiplier must be finite and at least 1');
  if (!Number.isInteger(maxOwnedCount) || maxOwnedCount < 0) throw new Error('maxOwnedCount must be a nonnegative integer');

  const costs = [];
  let unroundedCost = baseCost;
  let previousCost = -1;
  for (let ownedCount = FIRST_OWNED_COUNT; ownedCount <= maxOwnedCount; ownedCount++) {
    const cost = Math.floor(unroundedCost);
    if (!Number.isSafeInteger(cost)) throw new Error(`Cost is not a safe integer at n=${ownedCount}`);
    if (cost < previousCost) throw new Error(`Cost table is not monotonic at n=${ownedCount}`);
    costs.push(cost);
    previousCost = cost;
    unroundedCost *= multiplier;
  }
  return costs;
}

validateCrews(CREWS);
const multiplier = CREW_SETTINGS.hireCostMultiplier;
const crewCostTables = CREWS.map(crew => ({
  id: crew.id,
  costs: buildCosts(crew.baseCost, multiplier, LAST_OWNED_COUNT),
}));

const headers = ['n owned', ...crewCostTables.map(table => table.id)];
const markdown = [
  `Crew hire cost: floor(baseCost * ${multiplier}^n), computed by iterative multiplication.`,
  `| ${headers.join(' | ')} |`,
  `| ${headers.map((_, index) => index === 0 ? '---:' : '---:').join(' | ')} |`,
];

for (let index = FIRST_OWNED_COUNT; index <= LAST_OWNED_COUNT; index++) {
  const row = [String(index), ...crewCostTables.map(table => String(table.costs[index]))];
  markdown.push(`| ${row.join(' | ')} |`);
}

console.log(markdown.join('\n'));
