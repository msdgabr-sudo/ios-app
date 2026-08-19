# CP-016 — Authoritative Astronomical Engine Restored on `one`

## Scope

This checkpoint applies to branch `one` only. Branch `new` is intentionally untouched by this restoration.

## Authoritative source

- Engine branch: `feature/astronomical-solver-foundation`
- Authoritative engine commit / PR #3 head: `ac2bb57aa4a829d1730a64b657432320c6295da7`
- Handoff PR: #3 — `Apply production astronomical verification to new`
- UI handoff rule: ENGINE LOGIC WINS. UI adapts around the engine; engine calculations are not rewritten for presentation.

## Source documents reviewed

- `ASTRONOMICAL_QIBLA_MEASUREMENT_CONTRACT.md`
- `ASTRONOMICAL_PIPELINE_AUDIT.md`
- `JAVASCRIPT_RUNTIME_AUDIT.md`
- `docs/UI-DESIGN-HANDOFF-TO-ASTRONOMICAL-ENGINE.md` on the approved UI reference branch

## Production astronomical stack frozen from the authoritative source

The following production files are confirmed absent from the compare diff between `feature/astronomical-solver-foundation` and `one`, therefore they are byte-for-byte identical to the authoritative source at this checkpoint:

- `js/astro-verification.js`
- `js/astronomical-trace.js`
- `js/position-provider.js`
- `js/coordinate-frames.js`
- `js/world-orientation.js`
- `js/camera-projection.js`
- `js/camera-pose.js`
- `js/gravity-reference.js`
- `js/astro-qibla-engine.js`
- `js/verification-quality.js`
- `js/celestial-detector.js`
- `js/astronomical-solver.js`
- `js/qibla-alignment-reticle.js`
- `js/astronomical-observation-bridge.js`
- `js/astronomical-observatory-ui.js`
- `js/astronomical-verification-store.js`
- `js/astronomical-verification-session.js`
- `js/compass-cards.js`
- `js/post-verification-live-compass.js`
- `js/qibla-card-runtime.js`

`css/28-astronomical-observatory.css` is also retained from the authoritative production handoff.

## Exact restorations performed on `one`

### Astronomical Gateway

`js/astro-verification.js`

Authoritative blob SHA:

`fbf3c9b5b761b76b56c1ade471c4769da64b7f8b`

The later body-selection modifications were removed by restoring the complete authoritative file, not by editing individual scientific lines.

### Qibla Card Runtime

`js/qibla-card-runtime.js`

Authoritative blob SHA:

`2aa1d90a42544fa9dd455f8194e4a6df3dd47a49`

Later live-angle/deviation logic that had been inserted into this UI adapter was removed by restoring the complete authoritative file.

## Important forensic correction

`js/post-verification-live-compass.js` is NOT a later unauthorized addition. It exists in the authoritative foundation branch and remains unchanged with blob SHA:

`404f3e13ef6243e3f66245aea0ce194aaec23d04`

It must not be deleted as part of engine restoration.

## Presentation isolation

Modern screen mounting was removed from the authoritative `qibla-card-runtime.js` and isolated in:

`js/presentation/bootstrap.js`

This file is presentation-only. It loads/mounts external screen modules and approved UI CSS/JS. It intentionally contains no Qibla calculation, no astronomical solver logic, no Store write/read logic, no `QT`/`deviceHeading` calculation, and no angular/deviation equation.

`js/home-reference-finalizer.js` loads this Presentation bootstrap. This preserves the static approved Home while keeping presentation loading outside the restored engine runtime.

## PWA

`service-worker.js` preserves the complete production astronomical stack in the App Shell and additionally caches `js/presentation/bootstrap.js` for the redesigned screens. Cache namespace on `one` is:

`qiblaastro-v5.59-one-engine-restore`

This Service Worker change is integration/PWA infrastructure, not a scientific engine change.

## Legacy files

The authoritative audits identify older camera/solver glue as retired from the production astronomical runtime. Their mere historical presence in the repository must not be confused with production ownership. No retired file is to be reintroduced into the production stack unless the authoritative handoff explicitly requires it.

## Current invariant

At CP-016, the astronomical production engine and its original UI data runtime are restored byte-for-byte to the authoritative foundation branch. Remaining differences between `one` and the foundation branch are presentation, page migration, PWA, prayer, Quran, Azkar, documentation, and integration infrastructure outside the frozen astronomical engine.

## Next gate

Do not merge `one` into `new` yet.

Next steps are validation only:
1. Run authoritative PR #3 regression tests against `one`.
2. Verify runtime loading order and absence of retired astronomical glue.
3. Verify redesigned Presentation consumes the restored engine without writing scientific state.
4. Only after automated PASS, perform physical Android acceptance: GNSS, camera permission, real Sun/Moon capture, accepted result, post-verification live behavior.
