// @ts-check
/** sfc32 PRNG. Integer-only, identical in every JS engine. Never use Math.random in core. */

/** @typedef {{a:number,b:number,c:number,d:number}} Rng */

/** Mix up to three 32-bit ints into one 32-bit seed (murmur3-style finalizer). @param {number} x @param {number} [y] @param {number} [z] */
export function deriveSeed(x, y = 0, z = 0) {
  let h = (x | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (y | 0), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h ^ (z | 0), 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** @param {number} seed @returns {Rng} */
export function createRng(seed) {
  /** @type {Rng} */
  const r = { a: 0x9e3779b9 ^ seed, b: 0x243f6a88 ^ Math.imul(seed, 0x85ebca6b), c: 0xb7e15162 ^ Math.imul(seed, 0xc2b2ae35), d: 1 };
  for (let i = 0; i < 15; i++) nextU32(r);
  return r;
}

/** @param {Rng} r @returns {number} uint32 */
export function nextU32(r) {
  const t = (((r.a + r.b) | 0) + r.d) | 0;
  r.d = (r.d + 1) | 0;
  r.a = r.b ^ (r.b >>> 9);
  r.b = (r.c + (r.c << 3)) | 0;
  r.c = (r.c << 21) | (r.c >>> 11);
  r.c = (r.c + t) | 0;
  return t >>> 0;
}

/** @param {Rng} r @returns {number} float in [0,1) */
export function nextFloat(r) {
  return nextU32(r) / 4294967296;
}

/** @param {Rng} r @param {number} lo @param {number} hi */
export function rangeFloat(r, lo, hi) {
  return lo + (hi - lo) * nextFloat(r);
}
