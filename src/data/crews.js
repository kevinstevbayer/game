// @ts-check

/**
 * Crew data from docs/GAME_DESIGN.md section 5.
 * Hire costs are base costs; the n-owned 1.15 scaling is generated separately.
 */
export const CREWS = Object.freeze([
  Object.freeze({
    id: 'CREW_GATHERER',
    job: 'Timber',
    baseRate: 0.5,
    baseCost: 20,
    unlock: 'start',
  }),
  Object.freeze({
    id: 'CREW_MASON',
    job: 'Build and repair actions',
    baseRate: 1,
    baseCost: 50,
    unlock: 'tutorial',
  }),
  Object.freeze({
    id: 'CREW_DIGGER',
    job: 'Mud',
    baseRate: 0.4,
    baseCost: 40,
    unlock: 'RIVER',
  }),
  Object.freeze({
    id: 'CREW_QUARRYMAN',
    job: 'Stone',
    baseRate: 0.3,
    baseCost: 60,
    unlock: 'BAY',
  }),
  Object.freeze({
    id: 'CREW_WATCHER',
    job: 'Forecast information',
    // UNVALIDATED: 0 encodes the design table's "n/a" production rate.
    baseRate: 0,
    baseCost: 80,
    unlock: 'RIVER',
  }),
]);

/** Lodge and hire progression values from docs/GAME_DESIGN.md section 5. */
export const CREW_SETTINGS = Object.freeze({
  lodgeCapacityStart: 4,
  lodgeCapacityPerLevel: 2,
  lodgeBaseCost: 100,
  lodgeCostMultiplier: 2,
  hireCostMultiplier: 1.15,
});

/** Watcher effects from GAME_DESIGN.md section 5. */
export const WATCHER_SETTINGS = Object.freeze({
  forecastLead_s: 2,
  forecastUncertaintyReductionPct: 15,
  maxStacks: 3,
});
