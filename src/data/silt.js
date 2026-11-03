// @ts-check

/**
 * Silt upgrades from docs/GAME_DESIGN.md section 6.
 * Percent modifiers are stored as fractions: 0.05 means +5%; -0.25 means -25%.
 */
export const SILT_UPGRADES = Object.freeze([
  Object.freeze({
    id: 'TOUGH_TIMBER', maxLevel: 5, baseCost: 4,
    effect: Object.freeze({ materialStrengthPct: 0.05 }),
  }),
  Object.freeze({
    id: 'QUICK_PAWS', maxLevel: 4, baseCost: 6,
    effect: Object.freeze({ crewActionSpeedPct: 0.15 }),
  }),
  Object.freeze({
    id: 'DEEP_POCKETS', maxLevel: 4, baseCost: 5,
    effect: Object.freeze({ gatherRatePct: 0.25 }),
  }),
  Object.freeze({
    id: 'LONGER_LODGE', maxLevel: 3, baseCost: 10,
    effect: Object.freeze({ crewCapacity: 2 }),
  }),
  Object.freeze({
    id: 'RULE_SLOT', maxLevel: 6, baseCost: 12,
    effect: Object.freeze({ ruleRows: 1 }),
  }),
  Object.freeze({
    id: 'KEEN_EYES', maxLevel: 3, baseCost: 8,
    effect: Object.freeze({ forecastLead_s: 3 }),
  }),
  Object.freeze({
    id: 'STEADY_FORECAST', maxLevel: 3, baseCost: 10,
    effect: Object.freeze({ forecastUncertaintyPct: -0.25 }),
  }),
  Object.freeze({
    id: 'RUIN_MEMORY', maxLevel: 4, baseCost: 8,
    effect: Object.freeze({ ruinDiscountPoints: 10 }),
  }),
  Object.freeze({
    id: 'SILT_SENSE', maxLevel: 3, baseCost: 15,
    effect: Object.freeze({ siltGainPct: 0.2 }),
  }),
  Object.freeze({
    id: 'SPILLWAY_CRAFT', maxLevel: 3, baseCost: 14,
    effect: Object.freeze({ sluiceReliefPoints: 5, sluiceInflowPct: -0.15 }),
  }),
  Object.freeze({
    id: 'CHEAP_FIXES', maxLevel: 2, baseCost: 10,
    effect: Object.freeze({ repairCostPct: -0.5 }),
  }),
  Object.freeze({
    id: 'FOREMANS_SIGHT', maxLevel: 1, baseCost: 25,
    effect: Object.freeze({ fatigueOverlay: true, worstCasePreview: true }),
  }),
]);

/** Silt payout and upgrade cost progression from docs/GAME_DESIGN.md section 6. */
export const SILT_SETTINGS = Object.freeze({
  cleanTideBaseSilt: 1,
  cleanTideTierMultiplier: 1,
  floodBaseSilt: 10,
  floodTierMultiplier: 1,
  floodDecayFactor: 0.5,
  floodDecayFloorPct: 0.1,
  upgradeCostMultiplier: 2,
});
