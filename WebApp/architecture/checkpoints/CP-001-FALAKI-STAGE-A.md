# CP-001 — Falaki Stage A

Date: 2026-08-08
Branch: `new`
Source branch: `feature/home-ui-reference-match`
Source file: `pages/falaki.html`
Source/target blob SHA: `049f2786f40bb1b8e5cdc1f64fdc1db1c895ec20`
Base checkpoint: `472341323b89c8818670c63008940e8e9c56611a`

## Completed
- Imported the approved standalone `pages/falaki.html` byte-for-byte from the source branch.
- Verified required icons already exist on `new`.
- Added `js/presentation/falaki/host.js` to mount the standalone page inside the existing `page-night` route.
- Added Falaki loading to `js/qibla-card-runtime.js`.
- Added Falaki page/host/icons to the PWA app shell and bumped cache to `qiblaastro-v5.50-falaki-stage-a`.
- Added `tests/presentation/falaki-standalone-contract.test.js`.

## Isolation contract
The imported Falaki page is educational/informational only. It may use geolocation and its own standalone educational calculations for Sun/Moon/Polaris/Qibla guidance. It must not use camera, device orientation, astronomical verification session/store, capture, or write verification results.

## Protected scientific files changed
**NONE**

## Diff from CP-000
Only:
- `pages/falaki.html`
- `js/presentation/falaki/host.js`
- `js/qibla-card-runtime.js`
- `service-worker.js`
- `tests/presentation/falaki-standalone-contract.test.js`

## Pending acceptance
1. Phone visual/runtime test of the standalone Falaki page and the in-app `night` route.
2. After acceptance only: remove the legacy `page-night` body and presentation-only legacy Falaki remnants from `index.html`, leaving the route/host invocation only.
3. Re-run protected-core diff and create CP-002.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
