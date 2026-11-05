// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Object} DepViolation
 * @property {string} file
 * @property {string} rule
 * @property {string} detail
 */

const BANNED_CORE_RE = /\b(Math\.(?:random|sin|cos|pow|exp|log)|Date\.now|performance|document|window)\b/g;

const VIEW_SUBLAYERS = new Set(['render', 'ui', 'audio', 'vfx']);

/**
 * Strip comments and string literal static characters while preserving newlines
 * and code inside `${...}` template literal expressions.
 * @param {string} code
 * @returns {string}
 */
export function stripCommentsAndStrings(code) {
  /** @type {string[]} */
  const out = [];
  const len = code.length;
  let i = 0;

  /**
   * Stack tracking nested template expression brace depth.
   * Each entry is the count of `{` opened inside the current `${...}`.
   * @type {number[]}
   */
  const templateExprBraces = [];

  /**
   * Consume the static body of a template literal starting at index `i`
   * (immediately after the opening backtick or after the closing `}` of `${...}`).
   */
  const consumeTemplateStatic = () => {
    while (i < len) {
      const ch = code[i];
      if (ch === '\\') {
        out.push(' ', i + 1 < len && code[i + 1] === '\n' ? '\n' : ' ');
        i += 2;
        continue;
      }
      if (ch === '$' && i + 1 < len && code[i + 1] === '{') {
        out.push(' ', ' ');
        i += 2;
        templateExprBraces.push(0);
        return;
      }
      if (ch === '`') {
        out.push(' ');
        i += 1;
        return;
      }
      out.push(ch === '\n' ? '\n' : ' ');
      i += 1;
    }
  };

  while (i < len) {
    const ch = code[i];
    const next = i + 1 < len ? code[i + 1] : '';

    // Line comment
    if (ch === '/' && next === '/') {
      out.push(' ', ' ');
      i += 2;
      while (i < len && code[i] !== '\n') {
        out.push(' ');
        i += 1;
      }
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      out.push(' ', ' ');
      i += 2;
      while (i < len && !(code[i] === '*' && i + 1 < len && code[i + 1] === '/')) {
        out.push(code[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      if (i < len) {
        out.push(' ', ' ');
        i += 2;
      }
      continue;
    }

    // Single or double quoted string
    if (ch === "'" || ch === '"') {
      const quote = ch;
      out.push(' ');
      i += 1;
      while (i < len) {
        const c = code[i];
        if (c === '\\') {
          out.push(' ', i + 1 < len && code[i + 1] === '\n' ? '\n' : ' ');
          i += 2;
          continue;
        }
        out.push(c === '\n' ? '\n' : ' ');
        i += 1;
        if (c === quote) break;
      }
      continue;
    }

    // Template literal start
    if (ch === '`') {
      out.push(' ');
      i += 1;
      consumeTemplateStatic();
      continue;
    }

    // Track braces when inside `${...}`
    if (templateExprBraces.length > 0) {
      if (ch === '{') {
        templateExprBraces[templateExprBraces.length - 1] += 1;
        out.push(ch);
        i += 1;
        continue;
      }
      if (ch === '}') {
        const depth = templateExprBraces[templateExprBraces.length - 1];
        if (depth === 0) {
          templateExprBraces.pop();
          out.push(' ');
          i += 1;
          consumeTemplateStatic();
          continue;
        }
        templateExprBraces[templateExprBraces.length - 1] = depth - 1;
        out.push(ch);
        i += 1;
        continue;
      }
    }

    out.push(ch);
    i += 1;
  }

  return out.join('');
}

/**
 * Classify a POSIX-normalized relative path (e.g. `src/core/step.js`) into a layer descriptor.
 * @param {string} relPath
 * @returns {{ layer: 'data' | 'core' | 'app' | 'view' | 'root' | 'unknown'; sublayer: string | null }}
 */
export function classifyLayer(relPath) {
  const norm = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (norm === 'src/main.js') {
    return { layer: 'root', sublayer: null };
  }
  const parts = norm.split('/');
  if (parts[0] !== 'src' || parts.length < 3) {
    return { layer: 'unknown', sublayer: null };
  }
  const folder = parts[1];
  if (folder === 'data') return { layer: 'data', sublayer: null };
  if (folder === 'core') return { layer: 'core', sublayer: null };
  if (folder === 'app') return { layer: 'app', sublayer: null };
  if (VIEW_SUBLAYERS.has(folder)) return { layer: 'view', sublayer: folder };
  return { layer: 'unknown', sublayer: folder };
}

/**
 * Check whether an import from `fromRelPath` to `toRelPath` obeys `data <- core <- app <- view`.
 * @param {string} fromRelPath
 * @param {string} toRelPath
 * @returns {{ ok: boolean; reason?: string }}
 */
export function checkLayerEdge(fromRelPath, toRelPath) {
  const from = classifyLayer(fromRelPath);
  const to = classifyLayer(toRelPath);

  if (from.layer === 'unknown') {
    return { ok: false, reason: `Unclassified source module '${fromRelPath}'` };
  }
  if (to.layer === 'unknown') {
    return { ok: false, reason: `Unclassified target module '${toRelPath}'` };
  }
  if (to.layer === 'root') {
    return { ok: false, reason: `Module '${fromRelPath}' may not import composition root '${toRelPath}'` };
  }

  if (from.layer === 'root') {
    return { ok: true };
  }
  if (from.layer === 'data') {
    return to.layer === 'data'
      ? { ok: true }
      : { ok: false, reason: `data layer ('${fromRelPath}') may only import data, found '${toRelPath}' (${to.layer})` };
  }
  if (from.layer === 'core') {
    return to.layer === 'data' || to.layer === 'core'
      ? { ok: true }
      : { ok: false, reason: `core layer ('${fromRelPath}') may only import data or core, found '${toRelPath}' (${to.layer})` };
  }
  if (from.layer === 'app') {
    return to.layer === 'data' || to.layer === 'core' || to.layer === 'app'
      ? { ok: true }
      : { ok: false, reason: `app layer ('${fromRelPath}') may only import data, core, or app, found '${toRelPath}' (${to.layer})` };
  }
  if (from.layer === 'view') {
    if (to.layer === 'data' || to.layer === 'core' || to.layer === 'app') {
      return { ok: true };
    }
    if (to.layer === 'view' && to.sublayer === from.sublayer) {
      return { ok: true };
    }
    return {
      ok: false,
      reason: `view/${from.sublayer} ('${fromRelPath}') may not import sibling view/${to.sublayer} ('${toRelPath}')`,
    };
  }
  return { ok: true };
}

/**
 * Extract module specifiers from static `import`/`export ... from` and dynamic `import(...)` statements.
 * @param {string} rawCode
 * @returns {string[]}
 */
export function extractModuleSpecifiers(rawCode) {
  /** @type {string[]} */
  const specs = [];
  const codeOnly = stripCommentsAndStrings(rawCode);
  const staticRe = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let m;
  while ((m = staticRe.exec(rawCode)) !== null) {
    if (/^\s*(?:import|export)\b/.test(codeOnly.slice(m.index))) specs.push(m[1]);
  }
  while ((m = dynamicRe.exec(rawCode)) !== null) {
    if (/^\s*import\b/.test(codeOnly.slice(m.index))) specs.push(m[1]);
  }
  return specs;
}

/**
 * Analyze a map of `{ [posixRelPath]: sourceCode }` for layer and core-purity violations.
 * @param {Record<string, string>} fileMap
 * @returns {DepViolation[]}
 */
export function analyzeFiles(fileMap) {
  /** @type {DepViolation[]} */
  const violations = [];

  for (const [rawPath, source] of Object.entries(fileMap)) {
    const relPath = rawPath.replace(/\\/g, '/').replace(/^\.\//, '');
    const info = classifyLayer(relPath);

    if (info.layer === 'unknown') {
      violations.push({
        file: relPath,
        rule: 'layer-classification',
        detail: `Module '${relPath}' is outside the classified src layers`,
      });
      continue;
    }

    // 1. Check imports
    const specs = extractModuleSpecifiers(source);
    for (const spec of specs) {
      if (!spec.startsWith('.')) {
        if (info.layer === 'core') {
          violations.push({
            file: relPath,
            rule: 'layer-direction',
            detail: `core module '${relPath}' may not import external/bare specifier '${spec}'`,
          });
        }
        continue;
      }
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relPath), spec));
      const check = checkLayerEdge(relPath, resolved);
      if (!check.ok) {
        violations.push({
          file: relPath,
          rule: 'layer-direction',
          detail: check.reason || `Invalid import from '${relPath}' to '${resolved}'`,
        });
      }
    }

    // 2. Check banned identifiers in src/core/**
    if (info.layer === 'core') {
      const stripped = stripCommentsAndStrings(source);
      BANNED_CORE_RE.lastIndex = 0;
      let match;
      while ((match = BANNED_CORE_RE.exec(stripped)) !== null) {
        violations.push({
          file: relPath,
          rule: 'banned-core-identifier',
          detail: `Banned identifier '${match[1]}' in '${relPath}'`,
        });
      }
    }
  }

  return violations;
}

/**
 * Recursively collect all `.js` files under `dirAbs` and return a POSIX relative path -> content map.
 * @param {string} rootDirAbs
 * @param {string} [subDirRel]
 * @returns {Record<string, string>}
 */
export function loadSourceMap(rootDirAbs, subDirRel = 'src') {
  /** @type {Record<string, string>} */
  const map = {};
  const startAbs = path.join(rootDirAbs, subDirRel);
  if (!fs.existsSync(startAbs)) return map;

  /** @param {string} currentAbs */
  const walk = (currentAbs) => {
    const entries = fs.readdirSync(currentAbs, { withFileTypes: true });
    for (const entry of entries) {
      const fullAbs = path.join(currentAbs, entry.name);
      if (entry.isDirectory()) {
        walk(fullAbs);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const rel = path.relative(rootDirAbs, fullAbs).replace(/\\/g, '/');
        map[rel] = fs.readFileSync(fullAbs, 'utf8');
      }
    }
  };

  walk(startAbs);
  return map;
}

/**
 * Check all files under `src/` in `rootDirAbs`.
 * @param {string} [rootDirAbs]
 * @returns {DepViolation[]}
 */
export function checkRepoDeps(rootDirAbs = process.cwd()) {
  const fileMap = loadSourceMap(rootDirAbs, 'src');
  return analyzeFiles(fileMap);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const violations = checkRepoDeps();
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(`[check-deps] ${v.rule} in ${v.file}: ${v.detail}`);
    }
    process.exit(1);
  }
  console.log('[check-deps] OK: layer direction and core purity verified.');
}
