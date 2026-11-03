# DECISIONS (date | decision | reason | who)
2026-11-02 | Game = Overflow (dam vs ocean incremental) | scored 32/35 on the evidence-based trait checklist; thin margin, toy test is the real gate | designer
2026-11-02 | Plain JS + Canvas 2D, JSDoc + tsc checkJs, no runtime deps | AI fluency, zero build step, type precision without a toolchain | designer + lead dev
2026-11-02 | Fixed 30 Hz deterministic sim; no sin/pow/exp in core | engine-independent golden hashes | lead dev
2026-11-02 | LOAD_TRANSFER = 0.4 | 0.6 collapsed the whole dam in the median first cascade; 0.4 gives local breaches with rare total collapse | verified by tools/cascade.js
2026-11-02 | FATIGUE_K = 0.4 | 0.1 produced no failures in 30 tides, so repair had no value | verified by tools/probe.js
2026-11-02 | Offline play advances economy only | absence must never destroy a dam | designer
2026-11-03 | Tier 1 tutorial pacing uses five 60-second tides and clears at 5:00; first-purchase target is within 20 seconds inclusive | matches the locked P1 opening, tier table, and paper simulation while preserving the 0:20 place beat | designer approved
