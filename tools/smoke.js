// @ts-check
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const SCREENSHOT_PATH = resolve(PROJECT_ROOT, 'test-results', 'smoke.png');

const CONTENT_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
});

/** @param {import('node:http').ServerResponse} response @param {number} status @param {string} body */
function sendText(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
}

/** Serve only files contained by the repository root. @param {import('node:http').IncomingMessage} request @param {import('node:http').ServerResponse} response */
async function serveFile(request, response) {
  if (request.method !== 'GET') {
    sendText(response, 405, 'Method not allowed');
    return;
  }
  if (!request.url) {
    sendText(response, 400, 'Missing URL');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    sendText(response, 400, 'Invalid URL');
    return;
  }
  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(PROJECT_ROOT, relativePath);
  const pathFromRoot = relative(PROJECT_ROOT, filePath);
  if (pathFromRoot.startsWith('..') || pathFromRoot.startsWith(sep)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  let content;
  try {
    content = await readFile(filePath);
  } catch {
    sendText(response, 404, 'Not found');
    return;
  }

  const contentType = CONTENT_TYPES[/** @type {keyof typeof CONTENT_TYPES} */ (extname(filePath))]
    ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  response.end(content);
}

/** @returns {Promise<void>} */
async function runSmoke() {
  const server = createServer((request, response) => {
    void serveFile(request, response).catch(() => sendText(response, 500, 'Server error'));
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => resolveListen(undefined));
  });

  /** @type {import('playwright').Browser | null} */
  let browser = null;
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string', 'expected an IP server address');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    /** @type {string[]} */
    const pageErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'load' });
    const canvas = page.locator('#game');
    assert.equal(await canvas.count(), 1, 'expected one game canvas');
    assert.deepEqual(await canvas.evaluate(element => {
      if (!(element instanceof HTMLCanvasElement)) throw new Error('Canvas has the wrong element type');
      return { width: element.width, height: element.height };
    }), { width: 320, height: 180 });

    const renderedFrames = await page.evaluate(() => new Promise(resolveFrames => {
      let frames = 0;
      /** @returns {void} */
      function countFrame() {
        frames++;
        if (frames === 120) {
          resolveFrames(frames);
          return;
        }
        requestAnimationFrame(countFrame);
      }
      requestAnimationFrame(countFrame);
    }));
    assert.equal(renderedFrames, 120, 'expected 120 animation frames');

    const edgeBefore = await canvas.evaluate(element => {
      if (!(element instanceof HTMLCanvasElement)) throw new Error('Canvas has the wrong element type');
      const context = element.getContext('2d');
      if (!context) throw new Error('Canvas 2D context unavailable');
      return {
        edge: Array.from(context.getImageData(168, 90, 1, 1).data),
        square: Array.from(context.getImageData(160, 90, 1, 1).data),
      };
    });
    assert.notDeepEqual(edgeBefore.edge, edgeBefore.square, 'square should not yet cover the next pixel');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(expectedColor => {
      const element = document.getElementById('game');
      if (!(element instanceof HTMLCanvasElement)) return false;
      const context = element.getContext('2d');
      if (!context) return false;
      const actual = context.getImageData(168, 90, 1, 1).data;
      return actual.every((channel, index) => channel === expectedColor[index]);
    }, edgeBefore.square);

    assert.deepEqual(pageErrors, [], 'page should have no console or runtime errors');
    await mkdir(resolve(PROJECT_ROOT, 'test-results'), { recursive: true });
    await page.screenshot({ path: SCREENSHOT_PATH });
    console.log(`Smoke passed; screenshot saved to ${SCREENSHOT_PATH}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolveClose => server.close(() => resolveClose(undefined)));
  }
}

void runSmoke();
