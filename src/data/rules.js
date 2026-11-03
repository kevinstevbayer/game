// @ts-check

/** Rule vocabulary from docs/GAME_DESIGN.md section 5. */
export const RULES = Object.freeze([
  Object.freeze({ id: 'HAS_BREACH', type: 'condition', label: 'Breach exists' }),
  Object.freeze({ id: 'STRESS_GT', type: 'condition', label: 'Stress above threshold' }),
  Object.freeze({ id: 'FATIGUE_GT', type: 'condition', label: 'Fatigue above threshold' }),
  Object.freeze({ id: 'SURGE_ETA_LT', type: 'condition', label: 'Surge arrival below threshold' }),
  Object.freeze({ id: 'VALLEY_GT', type: 'condition', label: 'Valley level above threshold' }),
  Object.freeze({ id: 'STOCK_GT', type: 'condition', label: 'Resource stock above threshold' }),
  Object.freeze({ id: 'ROW_BELOW', type: 'condition', label: 'Cell row below threshold' }),
  Object.freeze({ id: 'LOWEST_ROW_BREACH', type: 'selector', label: 'Lowest row breach' }),
  Object.freeze({ id: 'HIGHEST_STRESS', type: 'selector', label: 'Highest stress cell' }),
  Object.freeze({ id: 'MOST_FATIGUED', type: 'selector', label: 'Most fatigued cell' }),
  Object.freeze({ id: 'NEAREST_TO_CREW', type: 'selector', label: 'Nearest target to crew' }),
  Object.freeze({ id: 'PATCH', type: 'action', label: 'Patch a breach' }),
  Object.freeze({ id: 'REPAIR', type: 'action', label: 'Repair fatigue' }),
  Object.freeze({ id: 'UPGRADE', type: 'action', label: 'Upgrade material' }),
  Object.freeze({ id: 'TOGGLE_SLUICE', type: 'action', label: 'Toggle sluice' }),
]);

/** Rule row limits and starter timing from docs/GAME_DESIGN.md section 5. */
export const RULE_SETTINGS = Object.freeze({
  baseRowsPerCrew: 2,
  rowsPerRuleSlotLevel: 1,
  maxRowsPerCrew: 8,
  maxConditionsPerRow: 2,
  starterRuleUnlockMinute: 3,
});
