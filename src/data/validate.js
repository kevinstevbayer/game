// @ts-check

/** @typedef {Record<string, unknown>} DataRecord */

/**
 * Numeric upgrade modifiers are named from GAME_DESIGN.md section 6.
 * Negative values are meaningful only for the three explicit reductions.
 * @type {Record<string, {kind: 'number' | 'boolean', min?: number, integer?: boolean}>}
 */
const SILT_EFFECT_RULES = Object.freeze({
  materialStrengthPct: { kind: 'number', min: 0 },
  crewActionSpeedPct: { kind: 'number', min: 0 },
  gatherRatePct: { kind: 'number', min: 0 },
  crewCapacity: { kind: 'number', min: 0, integer: true },
  ruleRows: { kind: 'number', min: 0, integer: true },
  forecastLead_s: { kind: 'number', min: 0, integer: true },
  forecastUncertaintyPct: { kind: 'number' },
  ruinDiscountPoints: { kind: 'number', min: 0, integer: true },
  siltGainPct: { kind: 'number', min: 0 },
  sluiceReliefPoints: { kind: 'number', min: 0, integer: true },
  sluiceInflowPct: { kind: 'number' },
  repairCostPct: { kind: 'number' },
  fatigueOverlay: { kind: 'boolean' },
  worstCasePreview: { kind: 'boolean' },
});

/** @param {unknown} value @returns {value is DataRecord} */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @param {string} path @returns {DataRecord} */
function asRecord(value, path) {
  if (!isRecord(value)) throw new Error(`Expected object at ${path}`);
  return value;
}

/**
 * Require all required keys and reject unknown keys; optional keys may be absent.
 * @param {DataRecord} value
 * @param {string[]} required
 * @param {string} path
 * @param {string[]} [optional]
 */
function assertKeys(value, required, path, optional) {
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!allowed.has(key)) throw new Error(`Unknown key '${key}' at ${path}`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) throw new Error(`Missing key '${key}' at ${path}`);
  }
}

/** @param {unknown} value @param {string} path @returns {string} */
function assertString(value, path) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Expected non-empty string at ${path}`);
  }
  return value;
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{min?: number, integer?: boolean}} [options]
 * @returns {number}
 */
function assertNumber(value, path, options) {
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Expected finite number at ${path}`);
  }
  if (options.integer === true && !Number.isInteger(value)) {
    throw new Error(`Expected integer at ${path}`);
  }
  if (value < min) throw new Error(`Number below ${min} at ${path}`);
  return value;
}

/** @param {unknown} value @param {string} path @returns {unknown[]} */
function assertArray(value, path) {
  if (!Array.isArray(value)) throw new Error(`Expected array at ${path}`);
  return value;
}

/** @param {unknown} value @param {string} path @returns {string[]} */
function assertStringArray(value, path) {
  const items = assertArray(value, path);
  for (let index = 0; index < items.length; index++) {
    assertString(items[index], `${path}[${index}]`);
  }
  return /** @type {string[]} */ (items);
}

/** @param {unknown} value */
export function validateTiers(value) {
  const tiers = assertArray(value, 'tiers');
  const keys = ['id', 'w', 'h', 'peak_cells', 'surgeMax_cells', 'surges', 'period_s', 'tidesToClear'];
  for (let index = 0; index < tiers.length; index++) {
    const path = `tiers[${index}]`;
    const tier = asRecord(tiers[index], path);
    assertKeys(tier, keys, path, []);
    assertString(tier.id, `${path}.id`);
    assertNumber(tier.w, `${path}.w`, { min: 1, integer: true });
    assertNumber(tier.h, `${path}.h`, { min: 1, integer: true });
    assertNumber(tier.peak_cells, `${path}.peak_cells`, { min: 0 });
    assertNumber(tier.surgeMax_cells, `${path}.surgeMax_cells`, { min: 0 });
    assertNumber(tier.surges, `${path}.surges`, { min: 0, integer: true });
    assertNumber(tier.period_s, `${path}.period_s`, { min: 1, integer: true });
    assertNumber(tier.tidesToClear, `${path}.tidesToClear`, { min: 1, integer: true });
  }
}

/** @param {unknown} value */
export function validateCrews(value) {
  const crews = assertArray(value, 'crews');
  const keys = ['id', 'job', 'baseRate', 'baseCost', 'unlock'];
  for (let index = 0; index < crews.length; index++) {
    const path = `crews[${index}]`;
    const crew = asRecord(crews[index], path);
    assertKeys(crew, keys, path, []);
    assertString(crew.id, `${path}.id`);
    assertString(crew.job, `${path}.job`);
    assertNumber(crew.baseRate, `${path}.baseRate`, { min: 0 });
    assertNumber(crew.baseCost, `${path}.baseCost`, { min: 0 });
    assertString(crew.unlock, `${path}.unlock`);
  }
}

/** @param {unknown} value */
export function validateRules(value) {
  const rules = assertArray(value, 'rules');
  const keys = ['id', 'type', 'label'];
  const types = new Set(['condition', 'selector', 'action']);
  for (let index = 0; index < rules.length; index++) {
    const path = `rules[${index}]`;
    const rule = asRecord(rules[index], path);
    assertKeys(rule, keys, path, []);
    assertString(rule.id, `${path}.id`);
    const type = assertString(rule.type, `${path}.type`);
    if (!types.has(type)) throw new Error(`Unknown rule type '${type}' at ${path}.type`);
    assertString(rule.label, `${path}.label`);
  }
}

/** @param {unknown} value @param {string} path */
function validateSiltEffect(value, path) {
  const effect = asRecord(value, path);
  const keys = Object.keys(effect);
  if (keys.length === 0) throw new Error(`Expected at least one modifier at ${path}`);
  for (const key of keys) {
    if (!Object.hasOwn(SILT_EFFECT_RULES, key)) throw new Error(`Unknown modifier '${key}' at ${path}`);
    const rule = SILT_EFFECT_RULES[key];
    const modifier = effect[key];
    const modifierPath = `${path}.${key}`;
    if (rule.kind === 'boolean') {
      if (typeof modifier !== 'boolean') throw new Error(`Expected boolean at ${modifierPath}`);
    } else {
      assertNumber(modifier, modifierPath, { min: rule.min, integer: rule.integer });
    }
  }
}

/** @param {unknown} value */
export function validateSilt(value) {
  const upgrades = assertArray(value, 'silt');
  const keys = ['id', 'maxLevel', 'baseCost', 'effect'];
  for (let index = 0; index < upgrades.length; index++) {
    const path = `silt[${index}]`;
    const upgrade = asRecord(upgrades[index], path);
    assertKeys(upgrade, keys, path, []);
    assertString(upgrade.id, `${path}.id`);
    assertNumber(upgrade.maxLevel, `${path}.maxLevel`, { min: 1, integer: true });
    assertNumber(upgrade.baseCost, `${path}.baseCost`, { min: 0 });
    validateSiltEffect(upgrade.effect, `${path}.effect`);
  }
}

/** @param {unknown} value @param {string} path */
function validateTrigger(value, path) {
  const trigger = asRecord(value, path);
  const keys = Object.keys(trigger);
  if (keys.length !== 1) throw new Error(`Expected exactly one trigger key at ${path}`);
  const key = keys[0];
  if (key === 'siltLifetime') {
    assertNumber(trigger[key], `${path}.siltLifetime`, { min: 0, integer: true });
    return;
  }
  if (key === 'tier' || key === 'flag') {
    assertString(trigger[key], `${path}.${key}`);
    return;
  }
  throw new Error(`Unknown trigger key '${key}' at ${path}`);
}

/** @param {unknown} value @param {boolean} allowClue */
function validateRelicTable(value, allowClue) {
  const relics = assertArray(value, 'relics');
  const required = ['id', 'trigger', 'speaker', 'lines', 'sets', 'requires'];
  const optional = allowClue ? ['clue'] : [];
  for (let index = 0; index < relics.length; index++) {
    const path = `relics[${index}]`;
    const relic = asRecord(relics[index], path);
    assertKeys(relic, required, path, optional);
    assertString(relic.id, `${path}.id`);
    validateTrigger(relic.trigger, `${path}.trigger`);
    assertString(relic.speaker, `${path}.speaker`);
    const lines = assertStringArray(relic.lines, `${path}.lines`);
    if (lines.length > 3) throw new Error(`${path}.lines exceeds 3 strings`);
    assertStringArray(relic.sets, `${path}.sets`);
    assertStringArray(relic.requires, `${path}.requires`);
    if (Object.hasOwn(relic, 'clue')) assertString(relic.clue, `${path}.clue`);
  }
}

/** @param {unknown} value */
export function validateRelics(value) {
  validateRelicTable(value, false);
}

/** @param {unknown} value */
export function validateAuthoringRelics(value) {
  validateRelicTable(value, true);
}

/**
 * Return fresh runtime relic objects without authoring-only metadata.
 * @param {unknown} value
 * @returns {DataRecord[]}
 */
export function stripAuthoringMetadata(value) {
  validateAuthoringRelics(value);
  const relics = assertArray(value, 'relics');
  return relics.map((item, index) => {
    const path = `relics[${index}]`;
    const relic = asRecord(item, path);
    const trigger = asRecord(relic.trigger, `${path}.trigger`);
    return {
      id: assertString(relic.id, `${path}.id`),
      trigger: { ...trigger },
      speaker: assertString(relic.speaker, `${path}.speaker`),
      lines: [...assertStringArray(relic.lines, `${path}.lines`)],
      sets: [...assertStringArray(relic.sets, `${path}.sets`)],
      requires: [...assertStringArray(relic.requires, `${path}.requires`)],
    };
  });
}
