// @ts-check
/** Distribution of the FIRST cascade size (fraction of cells) for under-built dams. Usage: node tools/cascade.js */
import { MAT, TIERS, TICK_HZ, PHYS } from '../src/data/balance.js';
import { createSim, stepSim } from '../src/core/step.js';
const byDepth = (/** @type {number} */ d) => (d > 14 ? MAT.STONE : d > 8 ? MAT.MUD : MAT.STICK);
/** @type {number[]} */
const fr = [];
for (const ti of [2, 3, 4]) for (let seed = 1; seed <= 20; seed++) {
  const s = createSim(ti, seed); const tier = TIERS[ti]; const worst = tier.peak_cells + tier.surgeMax_cells;
  for (let r = 0; r < s.dam.h; r++) for (let c = 0; c < s.dam.w; c++) s.dam.mat[r * s.dam.w + c] = byDepth(Math.max(0, worst - (r + 0.5)));
  for (let t = 0; t < 12 * tier.period_s * TICK_HZ; t++) { const b0 = s.brokenTotal; stepSim(s); if (s.brokenTotal > b0) { fr.push((s.brokenTotal - b0) / (s.dam.w * s.dam.h)); break; } }
}
fr.sort((a, b) => a - b);
const q = (/** @type {number} */ p) => fr[Math.min(fr.length - 1, Math.floor(p * fr.length))];
console.log(`LOAD_TRANSFER=${PHYS.LOAD_TRANSFER} n=${fr.length} first-cascade fraction: p10=${q(0.1).toFixed(3)} p50=${q(0.5).toFixed(3)} p90=${q(0.9).toFixed(3)} max=${fr[fr.length - 1].toFixed(3)}`);
