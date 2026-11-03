// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAuthoringRelics,
  validateCrews,
  validateRelics,
  validateRules,
  validateSilt,
  validateTiers,
  stripAuthoringMetadata,
} from '../src/data/validate.js';
import {
  OFFLINE_SETTINGS,
  PHYS,
  SCREEN_HEIGHT_PX,
  SCREEN_WIDTH_PX,
} from '../src/data/balance.js';
import { WATCHER_SETTINGS } from '../src/data/crews.js';
import { PACING_SETTINGS, PROGRESSION_SETTINGS } from '../src/data/progression.js';

const validTiers = [{
  id: 'STREAM', w: 16, h: 6, peak_cells: 3.5, surgeMax_cells: 0.5,
  surges: 1, period_s: 60, tidesToClear: 5,
}];
const validCrews = [{ id: 'CREW_MASON', job: 'PATCH', baseRate: 1, baseCost: 50, unlock: 'tutorial' }];
const validRules = [
  { id: 'HAS_BREACH', type: 'condition', label: 'Breach exists' },
  { id: 'LOWEST_ROW_BREACH', type: 'selector', label: 'Lowest breach' },
  { id: 'PATCH', type: 'action', label: 'Patch breach' },
];
const validSilt = [
  { id: 'TOUGH_TIMBER', maxLevel: 5, baseCost: 4, effect: { materialStrengthPct: 0.05 } },
  {
    id: 'SPILLWAY_CRAFT', maxLevel: 3, baseCost: 14,
    effect: { sluiceReliefPoints: 5, sluiceInflowPct: -0.15 },
  },
  { id: 'FOREMANS_SIGHT', maxLevel: 1, baseCost: 25, effect: { fatigueOverlay: true, worstCasePreview: true } },
];
const validRelics = [{
  id: 'R01', trigger: { siltLifetime: 15 }, speaker: 'CREW_DIGGER',
  lines: ['An old beam.'], sets: ['RELIC_R01_FOUND'], requires: [],
}];

test('valid table fixtures pass all validators', () => {
  assert.doesNotThrow(() => validateTiers(validTiers));
  assert.doesNotThrow(() => validateCrews(validCrews));
  assert.doesNotThrow(() => validateRules(validRules));
  assert.doesNotThrow(() => validateSilt(validSilt));
  assert.doesNotThrow(() => validateRelics(validRelics));
});

test('tier schemas reject missing, unknown, and invalid numeric fields', () => {
  const { id: _id, ...missingId } = validTiers[0];
  assert.throws(() => validateTiers([missingId]), /Missing key 'id'/);
  assert.throws(() => validateTiers([{ ...validTiers[0], extra: true }]), /Unknown key 'extra'/);
  assert.throws(() => validateTiers([{ ...validTiers[0], w: undefined }]), /Expected finite number.*\.w/);
  assert.throws(() => validateTiers([{ ...validTiers[0], w: -1 }]), /Number below 1/);
  assert.throws(() => validateTiers([{ ...validTiers[0], h: 6.5 }]), /Expected integer/);
  assert.throws(() => validateTiers([{ ...validTiers[0], period_s: Infinity }]), /Expected finite number/);
  assert.throws(() => validateTiers([{ ...validTiers[0], tidesToClear: 0 }]), /Number below 1/);
});

test('crew and rule schemas validate field types, keys, and nonnegative economy values', () => {
  assert.throws(() => validateCrews([{ ...validCrews[0], baseCost: -1 }]), /Number below 0/);
  assert.throws(() => validateCrews([{ ...validCrews[0], baseRate: NaN }]), /Expected finite number/);
  assert.throws(() => validateCrews([{ ...validCrews[0], id: 5 }]), /Expected non-empty string/);
  assert.throws(() => validateCrews([{ ...validCrews[0], missing: true }]), /Unknown key 'missing'/);
  assert.throws(() => validateRules([{ ...validRules[0], type: 'unknown' }]), /Unknown rule type/);
  assert.throws(() => validateRules([{ ...validRules[0], label: 3 }]), /Expected non-empty string/);
  const { label: _label, ...missingLabel } = validRules[0];
  assert.throws(() => validateRules([missingLabel]), /Missing key 'label'/);
});

test('silt effects support multiple modifiers and constrain signed fields', () => {
  assert.doesNotThrow(() => validateSilt(validSilt));
  assert.throws(() => validateSilt([{ ...validSilt[0], baseCost: -1 }]), /Number below 0/);
  assert.throws(() => validateSilt([{ ...validSilt[0], maxLevel: 1.5 }]), /Expected integer/);
  assert.throws(() => validateSilt([{ ...validSilt[0], effect: { unknownModifier: 1 } }]), /Unknown modifier/);
  assert.throws(() => validateSilt([{
    ...validSilt[0], effect: { crewActionSpeedPct: -0.1 },
  }]), /Number below 0/);
  assert.throws(() => validateSilt([{
    ...validSilt[0], effect: { forecastUncertaintyPct: NaN },
  }]), /Expected finite number/);
});

test('runtime relics enforce strict nested keys, trigger shape, and array types', () => {
  assert.doesNotThrow(() => validateRelics(validRelics));
  assert.throws(() => validateRelics([{ ...validRelics[0], clue: 'authoring only' }]), /Unknown key 'clue'/);
  assert.throws(() => validateRelics([{ ...validRelics[0], trigger: { invalid: 1 } }]), /Unknown trigger key/);
  assert.throws(() => validateRelics([{
    ...validRelics[0], trigger: { siltLifetime: 15, tier: 'RIVER' },
  }]), /exactly one trigger key/);
  assert.throws(() => validateRelics([{
    ...validRelics[0], trigger: { siltLifetime: 15.5 },
  }]), /Expected integer/);
  assert.throws(() => validateRelics([{
    ...validRelics[0], trigger: { siltLifetime: Infinity },
  }]), /Expected finite number/);
  assert.throws(() => validateRelics([{
    ...validRelics[0], trigger: { siltLifetime: 15, invalid: true },
  }]), /exactly one trigger key/);
  assert.throws(() => validateRelics([{ ...validRelics[0], lines: [1] }]), /Expected non-empty string/);
  assert.throws(() => validateRelics([{
    ...validRelics[0], lines: ['1', '2', '3', '4'],
  }]), /exceeds 3 strings/);
  assert.throws(() => validateRelics([{ ...validRelics[0], sets: [1] }]), /Expected non-empty string/);
  const { speaker: _speaker, ...missingSpeaker } = validRelics[0];
  assert.throws(() => validateRelics([missingSpeaker]), /Missing key 'speaker'/);
});

test('authoring clue is optional, type-checked, and stripped into fresh runtime data', () => {
  assert.doesNotThrow(() => validateAuthoringRelics(validRelics));
  const authored = [{ ...validRelics[0], clue: 'Prior builders used this gorge.' }];
  assert.doesNotThrow(() => validateAuthoringRelics(authored));
  assert.throws(() => validateAuthoringRelics([{ ...validRelics[0], clue: 3 }]), /Expected non-empty string/);
  assert.throws(() => validateRelics(authored), /Unknown key 'clue'/);

  const stripped = stripAuthoringMetadata(authored);
  assert.equal(Object.hasOwn(stripped[0], 'clue'), false);
  assert.notEqual(stripped[0], authored[0]);
  assert.notEqual(stripped[0].trigger, authored[0].trigger);
  assert.notEqual(stripped[0].lines, authored[0].lines);
  assert.doesNotThrow(() => validateRelics(stripped));
});

test('remaining documented mechanics and pacing values have data homes', () => {
  assert.equal(PROGRESSION_SETTINGS.ruinCostPct, 50);
  assert.equal(PROGRESSION_SETTINGS.ruinCostMin, 1);
  assert.equal(PROGRESSION_SETTINGS.repairCostPct, 25);
  assert.equal(OFFLINE_SETTINGS.ratePct, 25);
  assert.equal(OFFLINE_SETTINGS.cap_s, 8 * 60 * 60);
  assert.equal(OFFLINE_SETTINGS.advancesDam, false);
  assert.equal(OFFLINE_SETTINGS.advancesTide, false);
  assert.equal(PROGRESSION_SETTINGS.releaseMinRelics, 6);
  assert.equal(PROGRESSION_SETTINGS.terraceRelicCount, 12);
  assert.equal(PROGRESSION_SETTINGS.terraceSiltCost, 500);
  assert.equal(PROGRESSION_SETTINGS.designRunTarget_s, 3 * 60 * 60);
  assert.equal(PROGRESSION_SETTINGS.tapBaseTimber, 1);
  assert.equal(PROGRESSION_SETTINGS.maxFlashesPerSecond, 3);
  assert.equal(WATCHER_SETTINGS.forecastLead_s, 2);
  assert.equal(WATCHER_SETTINGS.forecastUncertaintyReductionPct, 15);
  assert.equal(WATCHER_SETTINGS.maxStacks, 3);
  assert.equal(PACING_SETTINGS.firstPurchaseMax_s, 20);
  assert.equal(PACING_SETTINGS.streamClear_s, 5 * 60);
  assert.equal(PHYS.SURGE_MIN_MAGNITUDE_PCT, 0.4);
  assert.equal(PHYS.FORECAST_ZERO_UNCERTAINTY_LEAD_S, 2);
  assert.equal(PHYS.TIDE_CURVE_COEFFICIENT, 4);
  assert.equal(SCREEN_WIDTH_PX, 320);
  assert.equal(SCREEN_HEIGHT_PX, 180);
});
