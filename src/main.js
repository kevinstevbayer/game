// @ts-check
import { SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX } from './data/balance.js';
import { startLoop } from './app/loop.js';

const BOOT_BG_COLOR = '#161b22';
const BOOT_SQUARE_COLOR = '#d29922';
const BOOT_SQUARE_SIZE_PX = 16;
const BOOT_SQUARE_X_PX = ((SCREEN_WIDTH_PX - BOOT_SQUARE_SIZE_PX) / 2) | 0;
const BOOT_SQUARE_Y_PX = ((SCREEN_HEIGHT_PX - BOOT_SQUARE_SIZE_PX) / 2) | 0;

/**
 * Compute the largest integer scale factor (min 1) that fits the window and apply it to the canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function applyIntegerScale(canvas) {
  const scaleX = Math.floor(window.innerWidth / SCREEN_WIDTH_PX);
  const scaleY = Math.floor(window.innerHeight / SCREEN_HEIGHT_PX);
  const scale = Math.max(1, Math.min(scaleX, scaleY));
  canvas.style.width = `${SCREEN_WIDTH_PX * scale}px`;
  canvas.style.height = `${SCREEN_HEIGHT_PX * scale}px`;
}

/**
 * Draw the static boot frame: clear background and draw one integer-aligned square.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} squareX_PX
 */
export function drawBootSquare(ctx, squareX_PX) {
  ctx.fillStyle = BOOT_BG_COLOR;
  ctx.fillRect(0, 0, SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX);
  ctx.fillStyle = BOOT_SQUARE_COLOR;
  ctx.fillRect(squareX_PX, BOOT_SQUARE_Y_PX, BOOT_SQUARE_SIZE_PX, BOOT_SQUARE_SIZE_PX);
}

/**
 * Draw the FPS and interpolation debug text on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} alpha
 * @param {{fps: number, showFps: boolean}} state
 */
function drawFpsOverlay(ctx, alpha, state) {
  if (!state.showFps) return;
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`FPS: ${state.fps.toFixed(1)} a:${alpha.toFixed(2)}`, 4, 4);
}

/**
 * Boot the static canvas view.
 */
export function boot() {
  const el = document.getElementById('game');
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element #game not found');
  }
  el.width = SCREEN_WIDTH_PX;
  el.height = SCREEN_HEIGHT_PX;
  const ctx = el.getContext('2d');
  if (!ctx) {
    throw new Error('2D rendering context unavailable');
  }
  ctx.imageSmoothingEnabled = false;
  applyIntegerScale(el);
  window.addEventListener('resize', () => applyIntegerScale(el));
  let squareX_PX = BOOT_SQUARE_X_PX;
  drawBootSquare(ctx, squareX_PX);

  const loop = startLoop({
    onTick: () => {},
    onRender: (alpha, state) => {
      drawBootSquare(ctx, squareX_PX);
      drawFpsOverlay(ctx, alpha, state);
    },
  });

  window.addEventListener('keydown', event => {
    if (event.code === 'F3') {
      event.preventDefault();
      loop.toggleFps();
    }
    if (event.code === 'ArrowRight') {
      event.preventDefault();
      squareX_PX = Math.min(SCREEN_WIDTH_PX - BOOT_SQUARE_SIZE_PX, squareX_PX + 1);
    }
  });
}

boot();
