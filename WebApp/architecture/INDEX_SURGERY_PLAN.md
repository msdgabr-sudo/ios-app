# QiblaAstro — Index Surgery Execution Plan

Branch: `new`
Golden scientific reference: `feature/astronomical-solver-foundation`
Visual reference: `feature/home-ui-reference-match`

## Objective
Reduce `index.html` from the current baseline (353,532 bytes / 5,473 lines) into a thin application shell while preserving runtime behavior, scientific outputs, DOM contracts, capture lifecycle, PWA behavior, and the approved presentation.

## Non-negotiable constitution
1. No equation, constant, threshold, FOV, coordinate convention, quality gate, timing gate, capture gate, storage contract, or scientific output may be changed during structural refactoring.
2. Scientific-core files are immutable during index surgery. Any scientific change requires a separate future phase and separate proof.
3. Move first, improve later. Extracted code must initially be byte-equivalent in behavior and execution order.
4. One surgical concern per commit. Never combine extraction with cleanup or bug fixing.
5. Never delete legacy code until all static references, dynamic loaders, service-worker entries, tests, and runtime paths prove it is unused.
6. Existing DOM IDs, inline handler names, global API names, event names, storage keys, and load order are contracts until explicitly migrated under test.
7. Every extraction must have a rollback point and must preserve a known-good commit.
8. Presentation may read scientific results but may not write scientific state or invoke scientific store mutation APIs except through the approved verification/session path.
9. `foundation` remains untouched and serves as the golden behavior reference.

## Reverse-engineered target architecture

```text
index.html                       thin shell only
  -> css/core/*                  tokens/base/navigation
  -> css/screens/*               page presentation
  -> css/presentation/*          approved visual layers
  -> js/core/bootstrap.js        deterministic startup
  -> js/core/navigation.js       routing/page activation
  -> js/runtime/app-runtime.js   non-scientific legacy runtime, initially extracted 1:1
  -> js/astronomical/*           protected scientific modules/loader
  -> js/presentation/*           UI adapters only
  -> pages/*                     isolated page markup where safe
```

## Surgical sequence

### Gate 0 — Baseline freeze
- Inventory all files and sizes.
- Record `index.html` byte size, line count, and SHA-256.
- Record protected-core blob SHAs.
- Keep backup branch and golden foundation branch.

Exit condition: baseline reports exist and protected-core guard is active.

### Gate 1 — Anatomical map of index.html
Generate an automated map of:
- external script order;
- inline script blocks with exact line ranges, byte sizes, and hashes;
- inline style blocks;
- external CSS order;
- all DOM IDs and duplicate IDs;
- page IDs;
- inline event handlers;
- protected-core references;
- blocks containing scientific/camera/verification tokens.

Exit condition: no extraction starts until every inline block has a risk classification.

### Gate 2 — Low-risk head extraction
Extract only independent head/style material first, preserving exact cascade position and font behavior.

Validation:
- identical linked stylesheet ordering;
- no missing font;
- no layout change;
- no scientific files touched.

### Gate 3 — PWA/bootstrap extraction
Move service-worker registration and non-scientific bootstrap code into dedicated files, preserving timing and event semantics exactly.

Validation:
- service worker registers;
- install/offline path remains intact;
- no duplicate registration;
- no startup flash regression.

### Gate 4 — Non-scientific inline runtime extraction
Extract inline runtime blocks classified as non-scientific to `js/runtime/` without rewriting them.

Validation after each block:
- syntax check;
- global symbols unchanged;
- event handlers still resolve;
- navigation/page activation unchanged;
- protected-core blob check passes.

### Gate 5 — Scientific boundary isolation
Do not rewrite scientific code. Replace scattered loading only with a deterministic loader after proving order equivalence.

Validation:
- solver regression tests;
- field-test readiness;
- post-verification live compass isolation;
- camera/session/store APIs present;
- no magnetometer/deviceHeading introduced into raw solver path.

### Gate 6 — Page markup extraction
Move page DOM into `pages/` only after determining whether startup/runtime code expects elements synchronously at parse time.

Rules:
- pages with synchronous DOM dependencies stay inline until adapter is added;
- extracted markup must retain IDs exactly;
- never create duplicate IDs;
- dynamic insertion must complete before dependent startup code runs.

### Gate 7 — Approved presentation import
Import visual layers from `feature/home-ui-reference-match` only after classification:
- CSS/images: presentation-safe by default, still reviewed for selectors/URLs;
- JS: audit for writes to scientific state, store mutation, thresholds, and derived values;
- mixed files: split before import.

### Gate 8 — Legacy removal
Delete only code proven unreachable by:
- static search;
- dynamic loader map;
- service-worker manifest;
- test dependencies;
- runtime smoke path.

### Gate 9 — Final acceptance
Required:
- computational Qibla unchanged;
- astronomical solver golden vectors unchanged;
- camera permission/open/capture/freeze/record/stop lifecycle intact;
- Sun/Moon observation path intact;
- ±1° alignment rule intact;
- FOV remains 65°;
- verification store contract unchanged;
- computational card unaffected by astronomical update;
- fresh verification behavior intact;
- PWA online/offline/install intact;
- approved screens render correctly.

## Commit discipline
Every commit must use one of:
- `audit:` observation only
- `guard:` protection/test only
- `refactor:` structural move only
- `presentation:` visual-only import
- `cleanup:` deletion only after proof

No commit may mix categories.

## Rollback rule
Any unexplained change in numerical outputs, camera state transitions, record contents, DOM contract, startup order, or PWA behavior causes immediate rollback to the last accepted commit. Do not patch forward until root cause is identified.
