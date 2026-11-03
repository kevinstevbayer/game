// @ts-check
import { DT_S, PHYS, TICK_HZ, TIERS, VALLEY_CAP } from '../data/balance.js';
import { createDam, leakPerSecond, resolveCascade, updateFatigue, maxStressRatio } from './dam.js';
import { createTide, seaLevel } from './sea.js';
import { FNV_OFFSET, fnv1a } from './hash.js';

/**
 * @typedef {Object} SimState
 * @property {number} tick
 * @property {number} seed
 * @property {number} tierIndex
 * @property {number} tideIndex
 * @property {number} tideTick
 * @property {import('./dam.js').Dam} dam
 * @property {import('./sea.js').Tide} tide
 * @property {number} valley       flood meter 0..VALLEY_CAP
 * @property {boolean} sluiceOpen
 * @property {boolean} flooded     valley reached VALLEY_CAP this tide
 * @property {number} brokenTotal  cells broken this tide
 * @property {number} maxRatio     worst stress ratio seen this tide
 * @property {number} level        current sea level (cells)
 */

/** @param {number} tierIndex @param {number} seed @returns {SimState} */
export function createSim(tierIndex, seed) {
  const tier = TIERS[tierIndex];
  return {
    tick: 0, seed, tierIndex, tideIndex: 0, tideTick: 0,
    dam: createDam(tier.w, tier.h),
    tide: createTide(tier, seed, 0),
    valley: 0, sluiceOpen: false, flooded: false, brokenTotal: 0, maxRatio: 0, level: 0,
  };
}

/** Advance exactly one fixed tick (1/TICK_HZ s). Allocation-free except at tide rollover. @param {SimState} s */
export function stepSim(s) {
  const tier = TIERS[s.tierIndex];
  const t_s = s.tideTick * DT_S;
  const level = seaLevel(tier, s.tide, t_s);
  const eff = s.sluiceOpen ? level * (1 - PHYS.SLUICE_RELIEF) : level;
  s.level = level;
  s.brokenTotal += resolveCascade(s.dam, eff);
  updateFatigue(s.dam, DT_S);
  const ratio = maxStressRatio(s.dam);
  if (ratio > s.maxRatio) s.maxRatio = ratio;
  const inflow = leakPerSecond(s.dam, eff) + (s.sluiceOpen ? PHYS.SLUICE_FLOW_PER_S : 0);
  let v = s.valley + (inflow - PHYS.VALLEY_DRAIN_PER_S) * DT_S;
  if (v < 0) v = 0;
  if (v >= VALLEY_CAP) { v = VALLEY_CAP; s.flooded = true; }
  s.valley = v;
  s.tick++;
  s.tideTick++;
  if (s.tideTick >= tier.period_s * TICK_HZ) {
    s.tideTick = 0;
    s.tideIndex++;
    s.tide = createTide(tier, s.seed, s.tideIndex);
    s.flooded = false;
    s.brokenTotal = 0;
    s.maxRatio = 0;
  }
}

/** Deterministic hash of everything that affects future ticks. @param {SimState} s */
export function hashState(s) {
  let h = FNV_OFFSET;
  h = fnv1a(h, s.dam.mat);
  h = fnv1a(h, s.dam.ruin);
  h = fnv1a(h, new Uint8Array(s.dam.fat.buffer, s.dam.fat.byteOffset, s.dam.fat.byteLength));
  const hdr = new Float64Array([s.tick, s.tideIndex, s.tideTick, s.valley, s.sluiceOpen ? 1 : 0]);
  return fnv1a(h, new Uint8Array(hdr.buffer));
}
