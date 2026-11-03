# Overflow: AI working repo

Development is sequential: one phase at a time (docs/PHASES.md, tracker in docs/PHASE_STATUS.md). Read order for any AI: CONTEXT.md -> only the READ files named in your phase prompt (PHASES.md).

| File | Purpose | Who reads it |
|---|---|---|
| CONTEXT.md | Paste into every chat. Invariants, status, file map. | everyone |
| docs/PHASES.md | MASTER SEQUENCE: 17 phases (P0-P16), prompts, gates, lock rules, bug triage | you (integrator) |
| docs/PHASE_STATUS.md | which phase is active or locked | you |
| docs/BRIEF.md | One-page game brief and scope cap | everyone |
| docs/ARCHITECTURE.md | Engineering spec: modules, tick pipeline, schemas, determinism, perf budgets | lead dev, auditor |
| docs/GAME_DESIGN.md | Actual mechanics with numbers | lead dev, QA, writer |
| docs/AI_ROLES.md | Prompts per role and the per-ticket loop | integrator (you) |
| docs/TICKETS.md | Milestones M0-M8 as small tickets with proof | lead dev |
| docs/TEST_PLAN.md | Test pyramid, invariants, balance targets | QA, auditor |
| docs/STORY_BIBLE.md | Cast, twist, clues, endings, tone | writer |
| docs/DECISIONS.md | One-line decision log | you |
| docs/CHANGELOG.md | What changed | lead dev |

Commands: `npm i` then `npm test`, `npm run typecheck`, `npm run sim`, `npm run probe`, `npm run cascade`.

## Branch Rules & Repo Conventions
- `main`: locked integration branch; merges happen only after phase gate checks pass and are tagged `p<n>-lock`.
- `phase/p<n>`: active phase development branch (one phase active at a time per `docs/PHASES.md`).
- `fix/p<n>-<slug>`: bugfix branch for a locked phase; rerun that phase's gate tests and all later phases' regression suites before merging and tagging `p<n>-fix<k>`.
- Formatting: `.editorconfig` sets UTF-8, LF, 2-space indentation, final newlines, and trims trailing whitespace for the listed source and documentation files.
- CI: `.github/workflows/ci.yml` runs tests, typechecking, and the Playwright smoke check on configured branches.
- These are repository conventions. Server-side branch protection must be configured separately in the Git host.
