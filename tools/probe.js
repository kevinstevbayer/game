// @ts-check
/** Probes used to ground numbers in docs. Usage: node tools/probe.js */
import { MAT, TIERS, TICK_HZ } from '../src/data/balance.js';
import { createSim, stepSim } from '../src/core/step.js';

const byDepth = (/** @type {number} */ d) => (d > 14 ? MAT.STONE : d > 8 ? MAT.MUD : MAT.STICK);

/** Tides survived (flood-free) by a byDepth dam, with or without a repair rule (fatigue>0.4 -> reset, instant).
 * @param {number} tierIndex @param {boolean} repair @param {number} seed @param {number} maxTides */
function tidesSurvived(tierIndex, repair, seed, maxTides) {
  const s = createSim(tierIndex, seed);
  const tier = TIERS[tierIndex];
  const worst = tier.peak_cells + tier.surgeMax_cells;
  for (let r = 0; r < s.dam.h; r++) for (let c = 0; c < s.dam.w; c++) s.dam.mat[r * s.dam.w + c] = byDepth(Math.max(0, worst - (r + 0.5)));
  const per = tier.period_s * TICK_HZ;
  for (let t = 0; t < maxTides * per; t++) {
    stepSim(s);
    if (repair && t % TICK_HZ === 0) for (let i = 0; i < s.dam.fat.length; i++) if (s.dam.mat[i] && s.dam.fat[i] > 0.4) s.dam.fat[i] = 0;
    if (s.flooded) return s.tideIndex;
  }
  return maxTides;
}
const med = (/** @type {number[]} */ a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
/** @type {object[]} */
const rows = [];
for (const ti of [2, 3, 4]) {
  /** @type {number[]} */ const a = [];
  /** @type {number[]} */ const b = [];
  for (let seed = 1; seed <= 15; seed++) { a.push(tidesSurvived(ti, false, seed, 20)); b.push(tidesSurvived(ti, true, seed, 20)); }
  rows.push({ tier: TIERS[ti].id, policy: 'byDepth', medianTidesNoRepair: med(a), medianTidesWithRepair: med(b), cap: 20 });
}
console.table(rows);

for (const ti of [2, 4]) {
  const x = createSim(ti, 5); x.dam.mat.fill(MAT.STONE);
  const t0 = performance.now(); for (let i = 0; i < 3000; i++) stepSim(x);
  console.log(TIERS[ti].id, 'avg tick ms', ((performance.now() - t0) / 3000).toFixed(4));
}
