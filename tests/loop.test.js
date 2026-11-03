// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import { DT_S } from '../src/data/balance.js';
import {
  advanceLoop,
  computeLoopStep,
  createLoopState,
  MAX_FRAME_DT_S,
  startLoop,
  toggleFpsOverlay,
} from '../src/app/loop.js';

test('loop state starts clean', () => {
  assert.deepEqual(createLoopState(), {
    acc_s: 0,
    alpha: 0,
    fps: 0,
    showFps: false,
    lastTimeMs: 0,
  });
});

test('computeLoopStep is immutable and calculates 30 Hz ticks', () => {
  const state = createLoopState();
  const before = { ...state };
  const result = computeLoopStep(state, 0.1);

  assert.deepEqual(state, before);
  assert.notEqual(result.nextState, state);
  assert.equal(result.ticksToRun, 3);
  assert.ok(Math.abs(result.nextState.acc_s) < 1e-12);
  assert.ok(result.nextState.alpha >= 0 && result.nextState.alpha < 1);
});

test('0.25 second cap allows 7 ticks from zero and 8 with carried time', () => {
  const fromZero = computeLoopStep(createLoopState(), 0.5);
  assert.equal(fromZero.ticksToRun, 7);
  assert.ok(Math.abs(fromZero.nextState.acc_s - (MAX_FRAME_DT_S - 7 * DT_S)) < 1e-12);

  const carried = { ...createLoopState(), acc_s: 0.02 };
  const fromCarry = computeLoopStep(carried, 0.5);
  assert.equal(fromCarry.ticksToRun, 8);
  assert.ok(Math.abs(fromCarry.nextState.acc_s - (0.27 - 8 * DT_S)) < 1e-12);
  assert.ok(fromCarry.nextState.alpha >= 0 && fromCarry.nextState.alpha < 1);
});

test('FPS uses raw delta while accumulator clamps, and invalid deltas are safe', () => {
  const longFrame = computeLoopStep(createLoopState(), 0.5);
  assert.equal(longFrame.nextState.fps, 2);
  assert.equal(longFrame.ticksToRun, 7);

  const zero = computeLoopStep(createLoopState(), 0);
  const negative = computeLoopStep(createLoopState(), -1);
  const notFinite = computeLoopStep(createLoopState(), Number.NaN);
  assert.equal(zero.ticksToRun, 0);
  assert.equal(negative.ticksToRun, 0);
  assert.equal(notFinite.ticksToRun, 0);
  assert.equal(zero.nextState.fps, 0);
  assert.equal(negative.nextState.fps, 0);
  assert.equal(notFinite.nextState.fps, 0);
});

test('advanceLoop invokes exactly one callback per fixed tick', () => {
  let ticks = 0;
  const input = createLoopState();
  const next = advanceLoop(input, 0.1, () => { ticks++; });

  assert.equal(ticks, 3);
  assert.equal(input.acc_s, 0);
  assert.ok(next.alpha >= 0 && next.alpha < 1);
});

test('F3 toggle returns new state without mutating its input', () => {
  const input = createLoopState();
  const shown = toggleFpsOverlay(input);
  assert.equal(input.showFps, false);
  assert.equal(shown.showFps, true);
  assert.equal(toggleFpsOverlay(shown).showFps, false);
});

test('startLoop consumes fake frames and stop cancels the pending callback', () => {
  let timeMs = 1000;
  let nextHandle = 1;
  let ticks = 0;
  let renders = 0;
  /** @type {Map<number, FrameRequestCallback>} */
  const pending = new Map();
  /** @type {number[]} */
  const cancelled = [];
  const loop = startLoop({
    now: () => timeMs,
    requestFrame: callback => {
      const handle = nextHandle++;
      pending.set(handle, callback);
      return handle;
    },
    cancelFrame: handle => {
      cancelled.push(handle);
      pending.delete(handle);
    },
    onTick: () => { ticks++; },
    onRender: () => { renders++; },
  });

  const first = pending.entries().next().value;
  assert.ok(first);
  pending.delete(first[0]);
  timeMs += DT_S * 1000 + 0.001;
  first[1](timeMs);
  assert.equal(ticks, 1);
  assert.equal(renders, 1);
  assert.equal(pending.size, 1);

  loop.toggleFps();
  assert.equal(loop.getState().showFps, true);
  const pendingHandle = pending.keys().next().value;
  assert.ok(pendingHandle !== undefined);
  loop.stop();
  assert.deepEqual(cancelled, [pendingHandle]);
  assert.equal(pending.size, 0);
});
