# QiblaAstro — JavaScript Runtime Audit

**Branch:** `feature/astronomical-solver-foundation`  
**Audit date:** 2026-08-04  
**Owner:** محمد سيد جبر بحيرى — Mohamed SG Behairy

## 1. Purpose

This document records the JavaScript runtime actually executed by the experimental branch before any destructive cleanup. It separates static application loading, dynamic astronomical loading, service-worker caching, UI adapters, and retired compatibility shells.

No legacy file is deleted merely because of its name. Deletion is allowed only after its consumers are removed and regression tests pass.

## 2. Non-negotiable astronomical ownership contract

The only accepted production path for the astronomical Qibla measurement is:

```text
camera frame + celestial ephemeris + gravity
→ QiblaAstronomicalSolver
→ QiblaAlignmentReticle qibla-axis acceptance
→ astronomicalQiblaObservation.observedQiblaBearingDeg
→ QiblaAstronomicalVerificationStore
→ CompassCards / application DOM
```

The following quantities are distinct and must never be substituted for one another:

| Quantity | Canonical field | Owner |
|---|---|---|
| Astronomically observed Qibla | `observedQiblaBearingDeg` | aligned camera-axis observation |
| Geodesic reference Qibla | `referenceQiblaBearingDeg` | Qibla reference geometry |
| Verification difference | `verificationOffsetDeg` | reference minus observation |
| Solved camera heading | `trueCameraHeadingDeg` | camera-pose solver |

Forbidden producers of the astronomical measurement:

- `QT`
- `deviceHeading`
- magnetic compass or declination
- DOM/card text
- `result.qibla.qiblaBearingDeg`
- sensor-bias correction
- fallback to the GNSS card

## 3. Runtime loading routes

### 3.1 Static route from `index.html`

The application currently loads these astronomical/UI adapters statically near the end of `index.html`:

```text
js/confidence-engine.js
js/astro-verification.js
js/compass-cards.js
js/celestial-overlay.js
js/tracking-lock.js
```

`index.html` also contains inline glue code that:

- activates the live compass;
- periodically calls `_qiblaUpdateNewCards()`;
- transfers `CompassCards` values to DOM elements;
- still defines tracking and report-lock functions.

The retired `camera-engine.js` and `celestial-solver.js` are not statically loaded by the current HTML.

### 3.2 Dynamic route owned by `astro-verification.js`

`astro-verification.js` dynamically loads the production stack in order:

```text
position-provider.js
coordinate-frames.js
world-orientation.js
camera-projection.js
camera-pose.js
gravity-reference.js
astro-qibla-engine.js
verification-quality.js
celestial-detector.js
astronomical-solver.js
qibla-alignment-reticle.js
astronomical-observation-bridge.js
astronomical-observatory-ui.js
astronomical-verification-store.js
astronomical-verification-session.js
```

`astronomical-trace.js` must load before the observation session whenever trace diagnostics are enabled.

### 3.3 Service Worker route

`service-worker.js` uses network-first for HTML, JavaScript, and CSS and pre-caches the new astronomical pipeline. The retired camera and celestial solver must remain absent from `APP_SHELL`.

## 4. File inventory and decisions

| File | Current responsibility | Runtime status | Decision |
|---|---|---|---|
| `position-provider.js` | raw device GNSS fix only | production | KEEP |
| `coordinate-frames.js` | vector/frame primitives | production | KEEP |
| `world-orientation.js` | horizontal/ENU geometry | production | KEEP |
| `camera-projection.js` | pixel/ray projection | production | KEEP |
| `camera-pose.js` | solve true camera pose | production | KEEP |
| `gravity-reference.js` | gravity vector estimation | production | KEEP |
| `astro-qibla-engine.js` | geodesic reference and relative geometry | production reference only | KEEP, document that it does not own observed measurement |
| `verification-quality.js` | quality gates | production | KEEP |
| `celestial-detector.js` | sun/moon centroid tracking | production | KEEP |
| `astronomical-solver.js` | pose solution and observation result | production | KEEP |
| `qibla-alignment-reticle.js` | qibla-axis target and alignment acceptance | production | KEEP |
| `astronomical-observation-bridge.js` | camera/detection/gravity/solver orchestration | production | KEEP |
| `astronomical-observatory-ui.js` | camera observatory interface | production | KEEP |
| `astronomical-verification-session.js` | capture lifecycle and accepted-record handoff | production | KEEP |
| `astronomical-verification-store.js` | immutable accepted record | production | MODIFY: remove legacy aliases after cards migrate |
| `astronomical-trace.js` | diagnostic immutable trace | production diagnostic | KEEP |
| `astro-verification.js` | application gateway and dynamic loader | production | KEEP; reduce direct DOM writes later |
| `compass-cards.js` | read-only card view models | production adapter | URGENT MODIFY: read canonical v4 fields directly |
| `confidence-engine.js` | non-authoritative compatibility/confidence views | compatibility | KEEP temporarily; verify all consumers before removal |
| `celestial-overlay.js` | visual overlay/celebration support | UI | REVIEW separately; must not calculate astronomical values |
| `tracking-lock.js` | tracking/wake-lock/report lock | legacy UI feature | REMOVE after proving no remaining consumer |
| `camera-engine.js` | retired compatibility shell | not loaded | DELETE only after repository-wide reference test |
| `celestial-solver.js` | retired compatibility shell | not loaded | DELETE only after repository-wide reference test |
| `celestial-live-calibration.js` | older runtime/card adapter | possible duplicate path | REVIEW/REMOVE if no current loader remains |
| inline glue in `index.html` | card DOM updates and obsolete tracking/lock functions | active | EXTRACT and CLEAN |

## 5. Confirmed defects found during audit

### 5.1 `compass-cards.js` still uses the old compatibility contract

The current card adapter reads:

```text
rawAstronomicalQiblaDeg
fallback: qiblaBearingDeg
rawRelativeQiblaAngleDeg
fallback: relativeQiblaAngleDeg
```

It should read only:

```text
observedQiblaBearingDeg
verificationOffsetDeg
```

The display currently survives because `astronomical-verification-store.js` publishes temporary aliases pointing to the canonical observed value. This is safe only as a migration bridge and must not become permanent.

### 5.2 `index.html` still contains tracking and lock logic

Despite the earlier product decision to remove tracking and lock controls, the inline glue still defines:

```text
_qiblaToggleTracking
_qiblaToggleLock
```

and statically loads `tracking-lock.js`. These are scheduled for removal after a consumer/reference check.

### 5.3 Inline glue remains too authoritative

`index.html` still owns periodic card-to-DOM transfer and live-compass activation. It does not currently calculate the astronomical value, but the logic should move to a dedicated adapter file so HTML becomes presentation-only.

## 6. Safe cleanup sequence

1. Modify `compass-cards.js` to read canonical v4 fields only.
2. Add regression tests that reject all old astronomical field names in card production.
3. Remove compatibility aliases from `astronomical-verification-store.js`.
4. Remove tracking/lock functions and `tracking-lock.js` static loading after reference proof.
5. Extract `_qiblaUpdateNewCards` and related DOM adapter logic from `index.html`.
6. Verify `confidence-engine.js` has no remaining essential consumer; then retire or narrow it.
7. Prove retired `camera-engine.js` and `celestial-solver.js` have zero runtime references; then delete them.
8. Review and remove `celestial-live-calibration.js` if the production stack no longer loads it.
9. Rebuild the final `service-worker.js` application shell from the surviving dependency list.
10. Run full CI, phone test, offline test, and field observation before merging anywhere.

## 7. Current deletion policy

No JavaScript file is to be deleted during the audit commit. The next code commit may change only the canonical card/store contract and its tests. Destructive cleanup follows only after dependency proofs.


## Tracking/Lock final removal

- Removed the script reference and all tracking/lock glue from index.html.
- Deleted js/tracking-lock.js.
- Removed it from the Service Worker application shell.
- Added tests/tracking-lock-removal.test.js to prevent reintroduction.


## Qibla card runtime extraction

- Moved live-compass activation and card DOM refresh out of index.html.
- Added js/qibla-card-runtime.js as a UI-only adapter over CompassCards.
- The runtime contains no Qibla, astronomical, GNSS, compass correction or fallback equation.
- Added tests/qibla-card-runtime.test.js and cached the runtime in Service Worker v5.2.


## Confidence and celestial overlay removal

- Deleted js/confidence-engine.js; canonical cards and gateway use the astronomical store directly.
- Deleted js/celestial-overlay.js; the main compass canvas already owns sun/moon rendering.
- Removed both scripts from index.html and Service Worker v5.3.
- Added tests/retired-runtime-removal.test.js.
