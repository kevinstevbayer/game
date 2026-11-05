// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripCommentsAndStrings,
  analyzeFiles,
  checkRepoDeps,
} from '../tools/check-deps.js';

test('check-deps: real repository src/ tree has zero violations', () => {
  const violations = checkRepoDeps();
  assert.deepEqual(violations, []);
});

test('check-deps: enforces data <- core <- app <- view import direction', () => {
  const validMap = {
    'src/data/balance.js': 'export const X = 1;',
    'src/core/step.js': "import { X } from '../data/balance.js'; export const Y = X;",
    'src/app/loop.js': "import { Y } from '../core/step.js'; export const Z = Y;",
    'src/render/draw.js': "import { Z } from '../app/loop.js'; export const W = Z;",
    'src/main.js': "import { W } from './render/draw.js'; console.log(W);",
  };
  assert.deepEqual(analyzeFiles(validMap), []);

  const invalidMap = {
    'src/data/bad.js': "import { Y } from '../core/step.js';",
    'src/core/bad.js': "import { Z } from '../app/loop.js';",
    'src/app/bad.js': "import { W } from '../render/draw.js';",
    'src/ui/bad.js': "import { W } from '../render/draw.js';",
  };
  const violations = analyzeFiles(invalidMap);
  assert.equal(violations.length, 4);
  assert.ok(violations.every((v) => v.rule === 'layer-direction'));
});

test('check-deps: ignores import-like text inside comments and strings', () => {
  const source = [
    "// import '../core/forbidden.js';",
    "/* export { X } from '../core/also-forbidden.js'; */",
    'const note = "import ../core/not-an-import.js";',
    'const template = `import ../core/not-an-import.js`;',
  ].join('\n');
  assert.deepEqual(analyzeFiles({ 'src/data/note.js': source }), []);
});

test('check-deps: checks literal dynamic imports and re-exports', () => {
  const validMap = {
    'src/app/dynamic.js': "void import('../core/step.js');",
    'src/core/reexport.js': "export { X } from '../data/balance.js';",
  };
  assert.deepEqual(analyzeFiles(validMap), []);

  const invalidMap = {
    'src/core/dynamic.js': "void import('../app/loop.js');",
    'src/data/reexport.js': "export * from '../core/step.js';",
  };
  const violations = analyzeFiles(invalidMap);
  assert.equal(violations.length, 2);
  assert.ok(violations.every((violation) => violation.rule === 'layer-direction'));
});

test('check-deps: rejects all 10 banned identifiers in src/core/**', () => {
  const bannedSnippets = [
    'const a = Math.random();',
    'const b = Date.now();',
    'const c = performance.now();',
    'const d = Math.sin(1);',
    'const e = Math.cos(1);',
    'const f = Math.pow(2, 3);',
    'const g = Math.exp(1);',
    'const h = Math.log(10);',
    'const el = document.getElementById("x");',
    'const w = window.innerWidth;',
  ];

  for (const snippet of bannedSnippets) {
    const res = analyzeFiles({ 'src/core/violator.js': snippet });
    assert.equal(res.length, 1, `Expected violation for snippet: ${snippet}`);
    assert.equal(res[0].rule, 'banned-core-identifier');
  }
});

test('check-deps: ignores banned identifiers in comments and plain strings/templates, flags ${...} expressions', () => {
  const safeCode = [
    '// Math.random() Date.now() window document performance',
    '/* Math.sin(1) Math.cos(1) Math.pow(2,2) Math.exp(1) Math.log(2) */',
    'const s1 = "Math.random() and window.innerWidth";',
    "const s2 = 'Date.now() and document.body';",
    'const s3 = `plain template mentioning Math.random() and performance.now()`;',
  ].join('\n');

  assert.deepEqual(analyzeFiles({ 'src/core/safe.js': safeCode }), []);

  const unsafeTemplate = 'const bad = `value is ${Math.random()} right now`;';
  const res = analyzeFiles({ 'src/core/unsafe.js': unsafeTemplate });
  assert.equal(res.length, 1);
  assert.equal(res[0].rule, 'banned-core-identifier');
  assert.match(res[0].detail, /Math\.random/);

  const nestedUnsafeTemplate = 'const bad2 = `outer ${(() => { return `${window.location}`; })()}`;';
  const res2 = analyzeFiles({ 'src/core/unsafe2.js': nestedUnsafeTemplate });
  assert.equal(res2.length, 1);
  assert.match(res2[0].detail, /window/);

  const stripped = stripCommentsAndStrings(unsafeTemplate);
  assert.match(stripped, /Math\.random/);
});
