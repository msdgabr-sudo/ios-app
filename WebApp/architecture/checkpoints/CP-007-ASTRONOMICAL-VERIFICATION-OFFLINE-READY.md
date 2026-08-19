# CP-007 — Astronomical Verification Offline Ready

Date: 2026-08-09
Branch: `new`

## Scope completed
- Kept the production astronomical verification engine untouched.
- Verified the production Observatory UI/CSS and Gateway/Session/Store/Observation Bridge match the approved source branch.
- Confirmed `index.html` contains no legacy camera overlay or verification modal.
- Confirmed `#astro-body-card` is only the launcher for the production Gateway.
- Added a permanent presentation boundary test.
- Added a permanent offline-shell contract test.
- Updated the Service Worker App Shell so every file in `astro-verification.js -> STACK_SCRIPTS` plus `css/28-astronomical-observatory.css` is precached.
- Cache version: `qiblaastro-v5.55-astronomical-verification-offline`.

## Validation
Temporary PR #11 was used only to execute validation and was closed without merge.

PASS:
- Astronomical verification offline-shell contract
- Protected scientific core blobs
- Astronomical module boundary
- Presentation scientific-state write barrier
- Astronomical solver regression tests

## Protected runtime path
`launcher -> GNSS fix -> production stack -> VerificationSession -> camera/frames -> detection -> gravity -> ObservationBridge -> solver -> quality gate -> freeze -> record -> stop -> live compass`

## Immutable rules
- Do not use `QT`, `deviceHeading`, magnetic declination, or compass correction as inputs to the astronomical solver.
- Do not let Presentation write verification scientific state.
- Do not replace the production Observatory with the retired `integration.js`/legacy CameraEngine modal path.
- The computational Qibla card must remain independent from accepted astronomical verification results.

## Next acceptance gate
Real Android phone test over HTTPS:
1. Open Compass.
2. Tap `#astro-body-card`.
3. Confirm GNSS/camera permission flow and Observatory opening.
4. Back must stop camera/sensors safely.
5. Complete a real Sun/Moon observation and accept it.
6. Astronomical Qibla/deviation update; computational Qibla remains unchanged.
7. Refresh must not reuse a stale verification as a fresh observation.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
