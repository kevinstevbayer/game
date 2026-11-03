# P1 Gate Record

**Gate result:** Accepted by the designer; Phase P1 was locked with tag `p1-lock`.

This record reflects the original P1 gate. The later STREAM tutorial physics correction is recorded in tag `p1-fix1`.

## 1. Relic JSON Check

- **Command run:** Inline Node.js structural check using `JSON.parse` and assertions for R01-R04 order, silt thresholds (15, 40, 80, 140), required P1 fields including `clue`, and no more than three lines per relic.
- **Result:** PASS for JSON parsing and P1 content requirements.
- **Schema note:** The P1-5 prompt requires a clue per relic, while the STORY_BIBLE runtime shape omits `clue`. P11's validator must explicitly allow this authoring field or strip it before runtime loading.

## 2. Three-Reader Premise Retell Test

- **AI-simulated reader pass:** Recorded in P1_READER_TEST.md; 2 of 3 explicitly mention a beaver, and all 3 identify dam-building against rising water.
- **Human-reader substitute:** Accepted by the user on 2026-11-03. The three AI-simulated responses are accepted as a documented substitute; this is a waiver of the original independent-reader method.

## 3. Designer Approval

- **Canon approved?** Yes — user approved the current canon.
- **Names approved / Changes requested:** User approved retaining placeholders; final names remain placeholders.
