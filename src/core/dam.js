// @ts-check
import { MATERIALS, PHYS } from '../data/balance.js';

/**
 * Dam = elevation view of the wall: w columns x h rows, row 0 is the bottom.
 * Every cell spans the full wall thickness, so a missing cell is a hole through the dam.
 * @typedef {Object} Dam
 * @property {number} w
 * @property {number} h
 * @property {Uint8Array} mat   material id per cell; 0 = no wall (unbuilt or broken)
 * @property {Uint8Array} ruin  1 if the cell once held a wall and broke (cheap to rebuild)
 * @property {Float32Array} fat fatigue 0..1
 * @property {Float32Array} load computed load, intact cells only
 * @property {Float32Array} base scratch: load a cell would carry if intact
 * @property {Int32Array} queue scratch BFS queue
 * @property {Uint8Array} seen scratch visited flags
 */

/** Strength lookup so hot loops avoid object access. */
const STRENGTH = Float64Array.from(MATERIALS, (m) => m.strength);

/** @param {number} w @param {number} h @returns {Dam} */
export function createDam(w, h) {
  const n = w * h;
  return {
    w, h,
    mat: new Uint8Array(n),
    ruin: new Uint8Array(n),
    fat: new Float32Array(n),
    load: new Float32Array(n),
    base: new Float32Array(n),
    queue: new Int32Array(n),
    seen: new Uint8Array(n),
  };
}

/** Effective strength of cell i including fatigue. @param {Dam} d @param {number} i */
export function effStrength(d, i) {
  return STRENGTH[d.mat[i]] * (1 - PHYS.FATIGUE_STRENGTH_LOSS * d.fat[i]);
}

/**
 * Fill d.load for all intact cells at the given sea level.
 * Hydrostatic base load = water depth above the cell centre (cell units).
 * Load of every connected broken/unbuilt region is orphaned and LOAD_TRANSFER of it is split
 * equally across the region's intact 4-neighbour contacts. Order-independent and deterministic.
 * @param {Dam} d @param {number} level_cells
 */
export function computeLoads(d, level_cells) {
  const { w, h, mat, base, load, queue, seen } = d;
  const n = w * h;
  for (let r = 0; r < h; r++) {
    const depth = level_cells - (r + 0.5);
    const b = depth > 0 ? depth : 0;
    for (let c = 0; c < w; c++) {
      const i = r * w + c;
      base[i] = b;
      load[i] = mat[i] !== 0 ? b : 0;
    }
  }
  seen.fill(0);
  for (let s = 0; s < n; s++) {
    if (mat[s] !== 0 || seen[s] === 1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = s;
    seen[s] = 1;
    let orphan = 0;
    let contacts = 0;
    while (head < tail) {
      const i = queue[head++];
      orphan += base[i];
      const r = (i / w) | 0;
      const c = i - r * w;
      for (let k = 0; k < 4; k++) {
        let ni;
        if (k === 0) { if (c === 0) continue; ni = i - 1; }
        else if (k === 1) { if (c === w - 1) continue; ni = i + 1; }
        else if (k === 2) { if (r === 0) continue; ni = i - w; }
        else { if (r === h - 1) continue; ni = i + w; }
        if (mat[ni] === 0) {
          if (seen[ni] === 0) { seen[ni] = 1; queue[tail++] = ni; }
        } else contacts++;
      }
    }
    if (contacts === 0 || orphan === 0) continue;
    const share = (PHYS.LOAD_TRANSFER * orphan) / contacts;
    for (let q = 0; q < tail; q++) {
      const i = queue[q];
      const r = (i / w) | 0;
      const c = i - r * w;
      if (c > 0 && mat[i - 1] !== 0) load[i - 1] += share;
      if (c < w - 1 && mat[i + 1] !== 0) load[i + 1] += share;
      if (r > 0 && mat[i - w] !== 0) load[i - w] += share;
      if (r < h - 1 && mat[i + w] !== 0) load[i + w] += share;
    }
  }
}

/**
 * Break every cell whose load exceeds its effective strength, recompute, repeat until stable.
 * Each pass breaks >= 1 cell or stops, so it terminates in <= w*h passes. Leaves d.load/d.base consistent.
 * @param {Dam} d @param {number} level_cells @returns {number} cells broken
 */
export function resolveCascade(d, level_cells) {
  const n = d.w * d.h;
  let total = 0;
  for (let pass = 0; pass <= n; pass++) {
    computeLoads(d, level_cells);
    let broke = 0;
    for (let i = 0; i < n; i++) {
      if (d.mat[i] !== 0 && d.load[i] > effStrength(d, i)) {
        d.mat[i] = 0;
        d.ruin[i] = 1;
        d.fat[i] = 0;
        broke++;
      }
    }
    if (broke === 0) break;
    total += broke;
  }
  return total;
}

/** Accumulate fatigue from the current d.load. @param {Dam} d @param {number} dt_s */
export function updateFatigue(d, dt_s) {
  const n = d.w * d.h;
  for (let i = 0; i < n; i++) {
    if (d.mat[i] === 0) continue;
    const ratio = d.load[i] / STRENGTH[d.mat[i]];
    if (ratio > PHYS.FATIGUE_THRESHOLD) {
      const x = ratio - PHYS.FATIGUE_THRESHOLD;
      const f = d.fat[i] + PHYS.FATIGUE_K * x * x * dt_s;
      d.fat[i] = f > 1 ? 1 : f;
    }
  }
}

/**
 * Valley inflow per second through submerged holes plus overtopping. Uses d.base from the last computeLoads.
 * @param {Dam} d @param {number} level_cells
 */
export function leakPerSecond(d, level_cells) {
  const n = d.w * d.h;
  let total = 0;
  for (let i = 0; i < n; i++) {
    if (d.mat[i] === 0 && d.base[i] > 0) total += PHYS.LEAK_COEF * Math.sqrt(d.base[i]);
  }
  const excess = level_cells - d.h;
  if (excess > 0) total += d.w * PHYS.TOP_LEAK_COEF * excess * Math.sqrt(excess);
  return total;
}

/** Highest load/strength ratio over intact cells (UI: worst-case stress). @param {Dam} d */
export function maxStressRatio(d) {
  const n = d.w * d.h;
  let m = 0;
  for (let i = 0; i < n; i++) {
    if (d.mat[i] === 0) continue;
    const r = d.load[i] / effStrength(d, i);
    if (r > m) m = r;
  }
  return m;
}
