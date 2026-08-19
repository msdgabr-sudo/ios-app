# QiblaAstro — CP-003 Digital Compass Migration Inventory

Date: 2026-08-09
Branch: `new`
UI source: `feature/home-ui-reference-match`
Scientific authority: protected engine already established on `new` from `feature/astronomical-solver-foundation`
Owner: محمد سيد جبر بحيرى — Mohamed SG Behairy

## Objective
Transfer the approved Digital Compass presentation into `new` without changing or duplicating computational Qibla, GNSS, device heading, calibration, deviation, astronomical verification, camera, solver, or storage logic.

## Approved UI source files for Stage B
Presentation candidates:
- `css/compass-digital-visual-match.css`
- `css/compass-digital-final-fixes.css`
- `css/compass-confidence-final.css` (digital portions only)
- `js/compass-mode-view.js` (digital portions only; port through adapter)
- `js/compass-premium-render.js` (presentation renderer only; do not port direct engine reads blindly)

Explicitly deferred to Stage C — Astronomical Verification:
- `css/compass-astro-dashboard.css`
- `css/compass-astro-gold-borders.css`
- `js/compass-astro-dashboard.js`
- any verification record confidence logic
- camera/observation/session/store bindings

## Canonical read-only data contract
The Digital Compass presentation may consume only established outputs/actions:
- computational Qibla true azimuth: canonical `QT` output;
- device heading: established device-compass output;
- compass accuracy/availability where exposed by existing runtime;
- GNSS/location information from the established GNSS subsystem;
- current deviation values already computed by the existing compass/deviation path;
- existing actions such as GNSS acquisition and manual calibration through their established public handlers.

The presentation must not:
- reimplement `calcQibla` or any geodesic formula;
- write `QT`;
- manufacture heading when the sensor is unavailable;
- alter GNSS acquisition/accuracy;
- modify verification/session/store state;
- access camera or celestial solver;
- write astronomical Qibla result;
- promote a visual confidence estimate into scientific truth.

## Required visual/functional acceptance
1. Digital compass design matches the approved UI source.
2. Same location => same canonical computational Qibla before and after transfer.
3. Live device heading remains sourced from the existing device-compass engine.
4. GNSS control invokes the established GNSS action.
5. Manual calibration invokes the established calibration action.
6. Deviation display remains connected to existing values/calculation path.
7. Confidence is presentation-only and cannot alter heading or Qibla.
8. No astronomical verification/camera files change in Stage B.
9. Service Worker is updated only after functional wiring passes.
10. Real Android orientation/GNSS smoke test is required before Stage B final acceptance.

## Migration sequence
B1. Compare/copy approved digital CSS into namespaced presentation files.
B2. Create a read-only Digital Compass presenter/adapter around canonical values/actions.
B3. Port digital mode controller behavior without Stage C astronomical behavior.
B4. Port premium renderer only through the adapter; no direct duplicate calculations.
B5. Mount from existing `page-compass` host while preserving legacy DOM until visual/runtime acceptance.
B6. Run protected-core diff and contract tests.
B7. After phone acceptance, externalize/remove obsolete Digital Compass presentation DOM from `index.html` only if proven safe.

## Stop conditions
Stop immediately if the design requires any change to Qibla/GNSS/device heading/calibration/deviation scientific logic, or if computational Qibla differs for identical inputs.

Protected scientific files changed in CP-003: **NONE**.
Next action: compare approved Digital Compass CSS against current namespaced copies in `new`, then port visual layer only.
