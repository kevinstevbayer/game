// @ts-check

/** Numeric rules and thresholds from GAME_DESIGN.md sections 4, 9, and 10. */
export const PROGRESSION_SETTINGS = Object.freeze({
  ruinCostPct: 50,
  ruinCostMin: 1,
  repairCostPct: 25,
  repairCostMin: 1,
  holdClearTier: 'OCEAN',
  releaseMinRelics: 6,
  terraceRelicCount: 12,
  terraceSiltCost: 500,
  designRunTarget_s: 3 * 60 * 60,
  tapBaseTimber: 1,
  maxFlashesPerSecond: 3,
});

/** Pacing targets from GAME_DESIGN.md sections 3 and 8. */
export const PACING_SETTINGS = Object.freeze({
  firstPurchaseMax_s: 20,
  firstRelicTarget_s: 25 * 60,
  streamClear_s: 5 * 60,
  milestones_s: Object.freeze({
    firstTap: 0,
    firstPlacement: 20,
    firstTideVisible: 45,
    firstGatherer: 90,
    tierProgress: 150,
    firstMason: 180,
    stagedBreach: 270,
    streamClear: 300,
  }),
});
