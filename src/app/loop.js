// @ts-check
import { DT_S } from '../data/balance.js';

/** Maximum elapsed frame time consumed by the fixed-step accumulator. */
export const MAX_FRAME_DT_S = 0.25;

/** Milliseconds per second for converting animation-frame timestamps. */
export const MS_PER_S = 1000;

/**
 * @typedef {object} LoopState
 * @property {number} acc_s Unconsumed fixed-step time, in seconds.
 * @property {number} alpha Interpolation factor in [0, 1).
 * @property {number} fps Instantaneous FPS from the raw, uncapped frame delta.
 * @property {boolean} showFps Whether to show the debug overlay.
 * @property {number} lastTimeMs Previous animation-frame timestamp.
 */

/** @typedef {{nextState: LoopState, ticksToRun: number}} LoopStep */

/** @returns {LoopState} */
export function createLoopState() {
  return {
    acc_s: 0,
    alpha: 0,
    fps: 0,
    showFps: false,
    lastTimeMs: 0,
  };
}

/**
 * Calculate fixed-step work without mutating the provided state.
 * @param {LoopState} state
 * @param {number} rawDt_s
 * @returns {LoopStep}
 */
export function computeLoopStep(state, rawDt_s) {
  const finiteDt_s = Number.isFinite(rawDt_s) ? rawDt_s : 0;
  const clampedDt_s = Math.min(MAX_FRAME_DT_S, Math.max(0, finiteDt_s));
  const total_s = state.acc_s + clampedDt_s;
  const ticksToRun = Math.floor(total_s / DT_S);
  const acc_s = total_s - ticksToRun * DT_S;
  const alpha = acc_s / DT_S;
  const fps = rawDt_s > 0 ? 1 / rawDt_s : 0;

  return {
    nextState: { ...state, acc_s, alpha, fps },
    ticksToRun,
  };
}

/** @param {LoopState} state @returns {LoopState} */
export function toggleFpsOverlay(state) {
  return { ...state, showFps: !state.showFps };
}

/**
 * Calculate loop state, then run one callback for each fixed simulation tick.
 * @param {LoopState} state
 * @param {number} rawDt_s
 * @param {() => void} onTick
 * @returns {LoopState}
 */
export function advanceLoop(state, rawDt_s, onTick) {
  const { nextState, ticksToRun } = computeLoopStep(state, rawDt_s);
  for (let index = 0; index < ticksToRun; index++) onTick();
  return nextState;
}

/**
 * Run a fixed-step loop with injectable time and frame scheduling for deterministic tests.
 * @param {object} options
 * @param {() => void} options.onTick
 * @param {(alpha: number, state: LoopState) => void} options.onRender
 * @param {() => number} [options.now]
 * @param {(callback: FrameRequestCallback) => number} [options.requestFrame]
 * @param {(handle: number) => void} [options.cancelFrame]
 * @returns {{getState: () => LoopState, stop: () => void, toggleFps: () => void}}
 */
export function startLoop({
  onTick,
  onRender,
  now = () => performance.now(),
  requestFrame = callback => window.requestAnimationFrame(callback),
  cancelFrame = handle => window.cancelAnimationFrame(handle),
}) {
  let state = { ...createLoopState(), lastTimeMs: now() };
  let running = true;
  /** @type {number | null} */
  let pendingFrameId = null;

  /** @param {number} timeMs */
  function onFrame(timeMs) {
    pendingFrameId = null;
    if (!running) return;

    const rawDt_s = Math.max(0, (timeMs - state.lastTimeMs) / MS_PER_S);
    const timedState = { ...state, lastTimeMs: timeMs };
    state = advanceLoop(timedState, rawDt_s, onTick);
    onRender(state.alpha, { ...state });

    if (running) pendingFrameId = requestFrame(onFrame);
  }

  pendingFrameId = requestFrame(onFrame);

  return {
    getState: () => ({ ...state }),
    stop: () => {
      running = false;
      if (pendingFrameId !== null) {
        cancelFrame(pendingFrameId);
        pendingFrameId = null;
      }
    },
    toggleFps: () => {
      state = toggleFpsOverlay(state);
    },
  };
}
