# CP-004 — Digital Compass Stage B Test Candidate

Date: 2026-08-09
Branch: `new`
UI source: `feature/home-ui-reference-match`
Stable base before Stage B: `d46824ab29d48215c2e9a98af21a40b921f7eaa4` (CP-002 Falaki cleanup)

## Goal reached

The Digital Compass redesign is now isolated as a presentation layer over the existing engine outputs/actions.

### Read-only presentation contract

`js/presentation/compass/digital-adapter.js` reads the canonical engine-written DOM outputs only:

- `box-heading`
- `box-qibla`
- `box-diff`
- `compass-accuracy`
- `gnss-badge`
- `gnss-btn-status`

It may invoke only existing public actions such as:

- `_qiblaActivateLiveCompass` / `activateCompass`
- `tryBrowserGPS`
- `showManualCal`
- `hideManualCal`
- `resetCompassCalibration`
- `GT('home')`

It does not calculate Qibla, own GNSS, access camera/solver, or write verification truth.

## Presentation isolation

`js/presentation/compass/digital-layout.js` owns only DOM annotations/classes required by the approved digital design. It does not read scientific state.

`js/presentation/compass/mode-view.js` now owns the Digital/Astronomical presentation class switch and consumes `QiblaDigitalCompassAdapter`; it no longer needs direct `QT`, `deviceHeading`, or `compassAvailable` access.

Load order is explicitly:

`digital-adapter.js -> digital-layout.js -> mode-view.js -> astro-dashboard.js`

The digital presentation therefore mounts before the astronomical dashboard layer.

## PWA

Service Worker bumped to:

`qiblaastro-v5.51-digital-compass-stage-b`

Digital Compass CSS/JS assets are in the App Shell for normal offline use after first online load.

## Diff safety result

Comparison from CP-002 to Stage B showed only presentation/runtime/cache/tests/documentation files. No core engine file was modified.

Explicitly untouched in this stage include the authoritative calculation/device files such as:

- `js/04-core.js`
- `js/05-gnss.js`
- `js/10-astronomy.js`
- `js/12-compass-canvas.js`
- `js/17-deviation.js`
- `js/20-device-compass.js`
- astronomical verification camera/solver/session/store files

## Test contract

`tests/presentation/digital-compass-contract.test.js` guards:

- no `calcQibla` in Digital presentation files;
- no camera/solver or verification store/session access;
- Adapter reads canonical display outputs;
- existing GNSS/calibration actions remain the invoked actions;
- Digital layout is presentation-only;
- runtime load order is Adapter -> Layout -> Mode -> Astro;
- Stage-B assets are present in the Service Worker.

`tests/presentation/falaki-standalone-contract.test.js` was made cache-version-agnostic so future legitimate Service Worker bumps do not falsely fail Falaki isolation.

## Manual Android acceptance required before finalizing Digital Compass

1. Open Digital Compass from Home.
2. Confirm approved visual layout appears with no legacy flash.
3. Tap live compass and grant/activate device orientation if requested.
4. Confirm live heading changes as the phone rotates.
5. Confirm computational Qibla value remains the existing engine value.
6. Confirm deviation changes from the existing engine path.
7. Tap GNSS and confirm the existing GNSS path/status works.
8. Open manual calibration and confirm existing controls still work.
9. Confirm confidence indicator is display-only and does not alter heading/Qibla.
10. Confirm Home button returns to Home.
11. Confirm Astronomical Verification result is not overwritten by Digital Compass.

Do not begin Astronomical Verification screen migration until these Digital Compass acceptance points are satisfactory or any discovered presentation defect is repaired without changing the engine.
