// @ts-check
/**
 * ALL tunable numbers live here. Logic files must not contain magic numbers.
 * Units are in every name: _s seconds, _cells cell units, _hz per second.
 * Status: v0 targets. Stability and termination verified by tools/sim.js; economy NOT yet tuned.
 */

export const TICK_HZ = 30;
export const DT_S = 1 / TICK_HZ;
export const SCREEN_WIDTH_PX = 320;
export const SCREEN_HEIGHT_PX = 180;

/** Material ids index MATERIALS. 0 = no wall (never built or broken). */
export const MAT = Object.freeze({ EMPTY: 0, STICK: 1, MUD: 2, STONE: 3, KEYSTONE: 4 });

/** strength is in load units (1 load unit = 1 cell of water depth). cost is in `resource` units per cell. */
export const MATERIALS = Object.freeze([
  Object.freeze({ id: 'EMPTY', strength: 0, cost: 0, resource: 'none' }),
  Object.freeze({ id: 'STICK', strength: 10, cost: 1, resource: 'timber' }),
  Object.freeze({ id: 'MUD', strength: 16, cost: 2, resource: 'mud' }),
  Object.freeze({ id: 'STONE', strength: 30, cost: 4, resource: 'stone' }),
  Object.freeze({ id: 'KEYSTONE', strength: 60, cost: 12, resource: 'stone' }),
]);

export const PHYS = Object.freeze({
  TIDE_CURVE_COEFFICIENT: 4,
  /** Fraction of a broken region's orphaned load handed to its intact boundary cells. */
  LOAD_TRANSFER: 0.4,
  /** Stress ratio (load/strength) above which fatigue accumulates. */
  FATIGUE_THRESHOLD: 0.6,
  /** Fatigue gain per second = FATIGUE_K * (ratio - threshold)^2. */
  FATIGUE_K: 0.4,
  /** Effective strength = strength * (1 - FATIGUE_STRENGTH_LOSS * fatigue). */
  FATIGUE_STRENGTH_LOSS: 0.5,
  /** Valley inflow per second per submerged breach cell = LEAK_COEF * sqrt(depth_cells). */
  LEAK_COEF: 0.1,
  /** Overtopping inflow per second per column = TOP_LEAK_COEF * excess * sqrt(excess). */
  TOP_LEAK_COEF: 0.4,
  /** Valley drains this much per second on its own. */
  VALLEY_DRAIN_PER_S: 0.3,
  /** Sluice open: loads computed at sea level * (1 - SLUICE_RELIEF). */
  SLUICE_RELIEF: 0.2,
  /** Sluice open: extra valley inflow per second. */
  SLUICE_FLOW_PER_S: 1.0,
  /** Tide floor level (cells) at low tide. */
  TIDE_FLOOR_CELLS: 0.5,
  SURGE_WIDTH_S: 8,
  SURGE_MIN_MAGNITUDE_PCT: 0.4,
  /** Surge arrives only in the high-tide window: fractions of the period. */
  SURGE_WINDOW: Object.freeze([0.3, 0.7]),
  FORECAST_LEAD_S: 10,
  FORECAST_ZERO_UNCERTAINTY_LEAD_S: 2,
  /** Forecast magnitude uncertainty (fraction of magnitude) at lead time; shrinks linearly to 0 at 2 s. */
  FORECAST_UNCERTAINTY: 0.3,
});

export const VALLEY_CAP = 100;

/** Offline economy limits from GAME_DESIGN.md section 9 / ARCHITECTURE.md section 12. */
export const OFFLINE_SETTINGS = Object.freeze({
  ratePct: 25,
  cap_s: 8 * 60 * 60,
  advancesDam: false,
  advancesTide: false,
});

/** peak_cells = absolute tide peak level (cells, before surges); w/h in cells. */
export const TIERS = Object.freeze([
  Object.freeze({ id: 'STREAM', w: 16, h: 6, peak_cells: 3.5, surgeMax_cells: 0.5, surges: 1, period_s: 60, tidesToClear: 5 }),
  Object.freeze({ id: 'RIVER', w: 24, h: 9, peak_cells: 6.0, surgeMax_cells: 1.0, surges: 2, period_s: 75, tidesToClear: 6 }),
  Object.freeze({ id: 'BAY', w: 32, h: 13, peak_cells: 9.0, surgeMax_cells: 1.5, surges: 2, period_s: 90, tidesToClear: 8 }),
  Object.freeze({ id: 'SEA', w: 40, h: 17, peak_cells: 12.5, surgeMax_cells: 2.0, surges: 3, period_s: 105, tidesToClear: 10 }),
  Object.freeze({ id: 'OCEAN', w: 48, h: 22, peak_cells: 17.0, surgeMax_cells: 3.0, surges: 3, period_s: 120, tidesToClear: 12 }),
]);
