// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAT, TIERS, TICK_HZ, MATERIALS, PHYS } from '../src/data/balance.js';
import { createRng, nextFloat, nextU32, deriveSeed } from '../src/core/rng.js';
const GOLDEN_RNG_SEED1 = [386760338, 4085389471, 2374737338, 1273138553, 3617988336];
import { createDam, computeLoads, resolveCascade, effStrength } from '../src/core/dam.js';
import { createSim, stepSim, hashState } from '../src/core/step.js';
import { createTide, seaLevel, forecast } from '../src/core/sea.js';

/** @param {import('../src/core/dam.js').Dam} d @param {number} m */
const fill = (d, m) => d.mat.fill(m);

test('rng: same seed same stream, different seed differs, range [0,1)', () => {
  const a = createRng(42), b = createRng(42), c = createRng(43);
  const xs = Array.from({ length: 1000 }, () => nextFloat(a));
  const ys = Array.from({ length: 1000 }, () => nextFloat(b));
  assert.deepEqual(xs, ys);
  assert.notEqual(nextFloat(createRng(42)), nextFloat(c));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notEqual(deriveSeed(1, 2, 3), deriveSeed(1, 3, 2));
});

test('rng: golden uint32 values for seed 1 (guards cross-engine drift)', () => {
  const r = createRng(1);
  assert.deepEqual([0, 1, 2, 3, 4].map(() => nextU32(r)), GOLDEN_RNG_SEED1);
});

test('loads: hydrostatic base equals depth above cell centre', () => {
  const d = createDam(4, 8); fill(d, MAT.STONE);
  computeLoads(d, 5);
  assert.equal(d.load[0], 4.5);          // row 0 centre at 0.5
  assert.equal(d.load[4 * 4], 0.5);      // row 4 centre at 4.5
  assert.equal(d.load[5 * 4], 0);        // above water
});

test('loads: a hole sheds LOAD_TRANSFER of orphaned load onto neighbours, total never exceeds original', () => {
  const d = createDam(5, 6); fill(d, MAT.STONE);
  d.mat[2 * 5 + 2] = 0; // hole at row 2, col 2
  computeLoads(d, 5);
  const orphan = 5 - 2.5;
  const neighbours = [2 * 5 + 1, 2 * 5 + 3, 1 * 5 + 2, 3 * 5 + 2];
  const sum = neighbours.reduce((s, i) => s + (d.load[i] - d.base[i]), 0);
  assert.ok(Math.abs(sum - PHYS.LOAD_TRANSFER * orphan) < 1e-5);
});

test('cascade: terminates, only breaks overloaded cells, stable afterwards', () => {
  const d = createDam(12, 10); fill(d, MAT.STICK);
  const broke = resolveCascade(d, 14); // far above stick strength at depth
  assert.ok(broke > 0);
  const again = resolveCascade(d, 14);
  assert.equal(again, 0);
  for (let i = 0; i < d.w * d.h; i++) if (d.mat[i] !== 0) assert.ok(d.load[i] <= effStrength(d, i) + 1e-6);
});

test('cascade: strong dam at shallow level never breaks', () => {
  const d = createDam(12, 10); fill(d, MAT.STONE);
  assert.equal(resolveCascade(d, 8), 0);
});

test('sea: parabolic tide is 0.5 floor at ends, peak mid, no NaN', () => {
  const tier = TIERS[0]; const tide = { surges: [] };
  assert.equal(seaLevel(tier, tide, 0), 0.5);
  assert.equal(seaLevel(tier, tide, tier.period_s / 2), tier.peak_cells);
  assert.equal(seaLevel(tier, tide, tier.period_s), 0.5);
});

test('sea: forecast uncertainty shrinks to zero at 2 s and surges are inside window', () => {
  const tier = TIERS[2]; const tide = createTide(tier, 7, 0);
  for (const s of tide.surges) {
    assert.ok(s.t0_s >= 0.3 * tier.period_s && s.t0_s <= 0.7 * tier.period_s);
    const f = forecast(tide, s.t0_s - 2).find((x) => Math.abs(x.eta_s - 2) < 1e-9);
    assert.ok(f, 'surge visible at eta 2 s');
    if (!f) continue;
    assert.equal(f.uncertainty, 0);
    assert.ok(Math.abs(f.est_cells - s.mag_cells) < 1e-9);
  }
});

test('determinism: two runs same seed give identical hash at every checkpoint', () => {
  const run = () => {
    const s = createSim(2, 99); s.dam.mat.fill(MAT.MUD);
    const hs = [];
    for (let t = 0; t < 90 * TICK_HZ * 2; t++) { stepSim(s); if (t % 300 === 0) hs.push(hashState(s)); }
    return hs;
  };
  assert.deepEqual(run(), run());
});

test('invariants: fuzz random builds, no NaN, loads>=0, valley within [0,cap], fatigue within [0,1]', () => {
  const rng = createRng(2026);
  for (let trial = 0; trial < 40; trial++) {
    const ti = Math.floor(nextFloat(rng) * TIERS.length);
    const s = createSim(ti, trial + 1);
    for (let i = 0; i < s.dam.mat.length; i++) s.dam.mat[i] = Math.floor(nextFloat(rng) * MATERIALS.length);
    for (let t = 0; t < TIERS[ti].period_s * TICK_HZ; t++) {
      stepSim(s);
      assert.ok(Number.isFinite(s.valley) && s.valley >= 0 && s.valley <= 100);
    }
    for (let i = 0; i < s.dam.mat.length; i++) {
      assert.ok(s.dam.load[i] >= 0 && Number.isFinite(s.dam.load[i]));
      assert.ok(s.dam.fat[i] >= 0 && s.dam.fat[i] <= 1);
    }
  }
});

test('perf: ocean tier worst-case tick under 2 ms average (budget 1 ms target)', () => {
  const s = createSim(4, 5); s.dam.mat.fill(MAT.STICK);
  const t0 = performance.now();
  for (let i = 0; i < 600; i++) stepSim(s);
  const avg = (performance.now() - t0) / 600;
  assert.ok(avg < 2, `avg tick ${avg.toFixed(3)} ms`);
});
