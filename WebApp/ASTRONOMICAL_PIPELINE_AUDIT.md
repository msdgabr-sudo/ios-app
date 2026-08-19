# QiblaAstro — Astronomical Pipeline Audit

Branch: `feature/astronomical-solver-foundation`

Copyright © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.

## 1. Current production entry point

`index.html` currently loads the legacy-facing entry files:

- `js/confidence-engine.js`
- `js/astro-verification.js`
- `js/celestial-solver.js`
- `js/camera-engine.js`
- `js/compass-cards.js`
- `js/celestial-overlay.js`
- `js/tracking-lock.js`

The new astronomical stack is not absent. It is loaded dynamically and sequentially by `js/astro-verification.js`.

## 2. New stack loaded by the gateway

`js/astro-verification.js` loads, in order:

1. `js/position-provider.js`
2. `js/coordinate-frames.js`
3. `js/world-orientation.js`
4. `js/camera-projection.js`
5. `js/camera-pose.js`
6. `js/gravity-reference.js`
7. `js/astro-qibla-engine.js`
8. `js/verification-quality.js`
9. `js/celestial-detector.js`
10. `js/astronomical-solver.js`
11. `js/astronomical-observation-bridge.js`
12. `js/astronomical-observatory-ui.js`
13. `js/astronomical-verification-store.js`
14. `js/astronomical-verification-session.js`

It also loads `css/28-astronomical-observatory.css`.

## 3. Confirmed ownership and dependencies

### Keep unchanged

These are shared application foundations and are not candidates for disabling:

- core helpers
- GNSS computational Qibla system
- astronomy ephemeris functions
- navigation
- main compass rendering
- device orientation runtime
- prayer/Quran/Azkar/settings modules

### New astronomical owner

`js/astro-verification.js` is the single application gateway for the new camera-based observation pipeline. It:

- intercepts the astronomical card click in capture phase;
- blocks legacy click handlers with `stopImmediatePropagation()`;
- requests an independent raw GNSS fix through `QiblaPositionProvider`;
- creates `QiblaAstronomicalVerificationSession.VerificationSession`;
- receives the accepted immutable record;
- updates the application cards;
- restores live updates after acceptance.

### Compatibility files that must not be disabled yet

`js/compass-cards.js` is still required by the inline `index.html` function `_qiblaUpdateNewCards()` for all compass cards.

`js/confidence-engine.js` is still referenced by `CompassCards`. The new verification store wraps its verification-reading methods after a successful astronomical record.

Therefore neither file may be disabled before replacing the inline card renderer.

### Legacy files that appear superseded, but require runtime verification before disabling

- `js/celestial-solver.js`
- `js/camera-engine.js`
- `js/celestial-overlay.js`

The new production gateway does not call them directly. However the inline legacy Glue Code in `index.html` still contains references to the old verification flow. They must not be disabled until the gateway interception and all return/close/error paths are tested on the phone.

### Tracking file

`js/tracking-lock.js` is referenced by legacy inline Glue Code. It must remain until the corresponding Glue Code is removed or replaced. It is not part of the astronomical equation.

## 4. Confirmed overwrite chain

The old inline renderer executes this chain:

`_qiblaUpdateNewCards()` → `CompassCards.getAllCards()` → legacy-compatible card values.

The new store, `QiblaAstronomicalVerificationStore`, publishes compatibility wrappers around both:

- `ConfidenceFusionEngine`
- `CompassCards`

This wrapper is intended to prevent the periodic legacy renderer from overwriting an accepted new record.

The first integration test must verify this exact chain in the real application, because the one-second timer in `index.html` continues running after acceptance.

## 5. Safe migration order

1. Do not remove any script from `index.html` yet.
2. Verify that only the new gateway starts the camera.
3. Verify that the new session closes and returns correctly.
4. Verify that an accepted record remains visible for at least five periodic card refresh cycles.
5. Verify that the old `CameraEngine` and old `CelestialSolver` receive no calls.
6. Replace the inline legacy astronomical Glue Code with a thin gateway adapter.
7. Only then remove the old camera/solver/overlay script tags.
8. Keep `CompassCards` until all card rendering is migrated.
9. Keep `ConfidenceFusionEngine` until all non-astronomical confidence UI dependencies are identified.
10. Remove `tracking-lock.js` only together with its remaining Glue Code references.

## 6. First production instrumentation required

Before disabling anything, add a temporary trace with these events:

- `ASTRO_NEW_GATEWAY_STARTED`
- `ASTRO_NEW_STACK_READY`
- `ASTRO_NEW_SESSION_STARTED`
- `ASTRO_NEW_RECORD_ACCEPTED`
- `ASTRO_NEW_RECORD_RENDERED`
- `ASTRO_NEW_RECORD_STILL_PRESENT_AFTER_REFRESH`
- `LEGACY_CAMERA_CALLED` (must remain false)
- `LEGACY_SOLVER_CALLED` (must remain false)

## 7. Current decision

No legacy file is disabled during the audit stage.

The next code change will be a minimal instrumentation and compatibility test, not deletion. Disabling begins only after runtime evidence proves that the new stack owns camera launch, solving, storage, closing, and card rendering.
