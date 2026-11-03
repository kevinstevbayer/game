// @ts-check

/**
 * Mechanical unlock schedule from docs/GAME_DESIGN.md section 6.
 * UNVALIDATED: speaker, lines, sets, and requires are P11 narrative placeholders.
 * Replace/confirm those fields from locked P1 canon before story runtime ships.
 */
const PLACEHOLDER_SPEAKER = 'SYSTEM';

/** @param {string} id @param {number} siltLifetime @param {string | null} previousId */
function makeRelic(id, siltLifetime, previousId) {
  return Object.freeze({
    id,
    trigger: Object.freeze({ siltLifetime }),
    speaker: PLACEHOLDER_SPEAKER,
    lines: Object.freeze([]),
    sets: Object.freeze([`RELIC_${id}_FOUND`]),
    requires: Object.freeze(previousId === null ? [] : [`RELIC_${previousId}_FOUND`]),
  });
}

export const RELICS = Object.freeze([
  makeRelic('R01', 15, null),
  makeRelic('R02', 40, 'R01'),
  makeRelic('R03', 80, 'R02'),
  makeRelic('R04', 140, 'R03'),
  makeRelic('R05', 220, 'R04'),
  makeRelic('R06', 330, 'R05'),
  makeRelic('R07', 470, 'R06'),
  makeRelic('R08', 640, 'R07'),
  makeRelic('R09', 850, 'R08'),
  makeRelic('R10', 1100, 'R09'),
  makeRelic('R11', 1400, 'R10'),
  makeRelic('R12', 1800, 'R11'),
]);
