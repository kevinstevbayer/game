// @ts-check
import { PHYS, TICK_HZ } from '../data/balance.js';
import { createRng, deriveSeed, nextFloat, rangeFloat } from './rng.js';

/**
 * @typedef {{t0_s:number, mag_cells:number, bias:number}} Surge
 * @typedef {{surges:Surge[]}} Tide
 */

/** Generate one tide's surges deterministically. @param {{surges:number,surgeMax_cells:number,period_s:number}} tier @param {number} runSeed @param {number} tideIndex @returns {Tide} */
export function createTide(tier, runSeed, tideIndex) {
  const rng = createRng(deriveSeed(runSeed, tideIndex, 0x5e0d));
  const [lo, hi] = PHYS.SURGE_WINDOW;
  /** @type {Surge[]} */
  const surges = [];
  for (let k = 0; k < tier.surges; k++) {
    const t0_s = rangeFloat(rng, lo * tier.period_s, hi * tier.period_s);
    const mag_cells = rangeFloat(rng, PHYS.SURGE_MIN_MAGNITUDE_PCT * tier.surgeMax_cells, tier.surgeMax_cells);
    const bias = nextFloat(rng) * 2 - 1;
    surges.push({ t0_s, mag_cells, bias });
  }
  surges.sort((a, b) => a.t0_s - b.t0_s);
  return { surges };
}

/**
 * Sea level in cells at time t. Parabolic tide 4u(1-u) uses only + - * / (no Math.sin: engine-independent),
 * plus triangular surge pulses.
 * @param {{peak_cells:number, period_s:number}} tier @param {Tide} tide @param {number} t_s
 */
export function seaLevel(tier, tide, t_s) {
  const u = t_s / tier.period_s;
  let level = PHYS.TIDE_FLOOR_CELLS + (tier.peak_cells - PHYS.TIDE_FLOOR_CELLS) * PHYS.TIDE_CURVE_COEFFICIENT * u * (1 - u);
  const half = PHYS.SURGE_WIDTH_S / 2;
  for (const s of tide.surges) {
    const d = t_s - s.t0_s;
    const a = d < 0 ? -d : d;
    if (a < half) level += s.mag_cells * (1 - a / half);
  }
  return level;
}

/**
 * Surges the player can see at time t: arrival within lead time, magnitude with shrinking uncertainty.
 * @param {Tide} tide @param {number} t_s
 * @returns {{eta_s:number, est_cells:number, uncertainty:number}[]}
 */
export function forecast(tide, t_s) {
  const out = [];
  const lead = PHYS.FORECAST_LEAD_S;
  for (const s of tide.surges) {
    const eta = s.t0_s - t_s;
    if (eta < -PHYS.SURGE_WIDTH_S / 2 || eta > lead) continue;
    const zeroUncertaintyLead_s = PHYS.FORECAST_ZERO_UNCERTAINTY_LEAD_S;
    const k = Math.min(1, Math.max(0, (eta - zeroUncertaintyLead_s) / (lead - zeroUncertaintyLead_s)));
    const u = PHYS.FORECAST_UNCERTAINTY * k;
    out.push({ eta_s: eta, est_cells: s.mag_cells * (1 + s.bias * u), uncertainty: u });
  }
  return out;
}

export const TICKS_PER_S = TICK_HZ;
