// @ts-check
/**
 * Headless structural survival bot. Builds a full dam by a material policy, then runs tides.
 * Usage: node tools/sim.js [tides=6] [seeds=20]
 * Measures: flood rate per tier/policy. This validates physics tension, NOT economy pacing.
 */
import { MAT, TIERS, TICK_HZ } from '../src/data/balance.js';
import { createSim, stepSim } from '../src/core/step.js';
import { effStrength } from '../src/core/dam.js';

/** policy(depthCells) -> material id for a row whose worst-case depth is depthCells */
const POLICIES = {
  sticksOnly: () => MAT.STICK,
  byDepth: (/** @type {number} */ d) => (d > 14 ? MAT.STONE : d > 8 ? MAT.MUD : MAT.STICK),
  overbuilt: (/** @type {number} */ d) => (d > 10 ? MAT.KEYSTONE : d > 6 ? MAT.STONE : MAT.MUD),
};

/** @param {import('../src/core/step.js').SimState} s @param {(d:number)=>number} policy */
function build(s, policy) {
  const { w, h } = s.dam;
  const tier = TIERS[s.tierIndex];
  const worst = tier.peak_cells + tier.surgeMax_cells;
  for (let r = 0; r < h; r++) {
    const m = policy(Math.max(0, worst - (r + 0.5)));
    for (let c = 0; c < w; c++) s.dam.mat[r * w + c] = m;
  }
}

/** @param {number} tierIndex @param {string} name @param {number} tides @param {number} seeds */
function run(tierIndex, name, tides, seeds) {
  let floods = 0, breaks = 0, ticks = 0, worst = 0;
  const policy = POLICIES[/** @type {keyof typeof POLICIES} */ (name)];
  for (let seed = 1; seed <= seeds; seed++) {
    const s = createSim(tierIndex, seed);
    build(s, policy);
    const per = TIERS[tierIndex].period_s * TICK_HZ;
    let flooded = false;
    for (let t = 0; t < tides * per; t++) {
      stepSim(s);
      if (s.flooded) flooded = true;
      if (s.maxRatio > worst) worst = s.maxRatio;
    }
    if (flooded) floods++;
    breaks += s.brokenTotal;
    ticks += s.tick;
  }
  return { tier: TIERS[tierIndex].id, policy: name, floodedRuns: `${floods}/${seeds}`, worstRatio: worst.toFixed(2) };
}

const tides = Number(process.argv[2] ?? 6);
const seeds = Number(process.argv[3] ?? 20);
const rows = [];
for (let t = 0; t < TIERS.length; t++) for (const p of Object.keys(POLICIES)) rows.push(run(t, p, tides, seeds));
console.table(rows);
void effStrength;
