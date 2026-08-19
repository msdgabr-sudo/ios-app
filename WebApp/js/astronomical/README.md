# QiblaAstro Astronomical Verification Subsystem

This directory defines the maintenance boundary for the astronomical verification subsystem on branch `new`.

## Production flow

1. `../astro-verification.js` — single application gateway and launcher.
2. `../position-provider.js` — fresh GNSS fix for the observation session.
3. `../coordinate-frames.js` — vector and coordinate-frame primitives.
4. `../world-orientation.js` — horizontal astronomy to world-frame vectors.
5. `../camera-projection.js` — pixel/FOV to camera ray.
6. `../camera-pose.js` — camera pose from celestial ray + gravity.
7. `../gravity-reference.js` — gravity samples and quality.
8. `../astro-qibla-engine.js` — independent geographic Qibla bearing.
9. `../verification-quality.js` — quality gates.
10. `../celestial-detector.js` — Sun/Moon detection and temporal tracking.
11. `../astronomical-solver.js` — compass-free astronomical solve.
12. `../qibla-alignment-reticle.js` — Qibla-axis target and ±1° alignment gate.
13. `../astronomical-observation-bridge.js` — camera frames -> detector -> solver.
14. `../astronomical-observatory-ui.js` — camera/observation UI only.
15. `../astronomical-verification-store.js` — immutable accepted record.
16. `../astronomical-verification-session.js` — freeze -> solve -> record -> stop -> compass.

## Non-negotiable contracts

- The raw astronomical solver must not use magnetic compass, magnetometer, `deviceHeading`, QT, or magnetic declination.
- Horizontal camera FOV remains 65° unless a deliberate calibration project changes the camera model.
- Final Qibla-axis alignment tolerance remains ±1°.
- Sun and Moon detector profiles remain separate.
- Accepted observations are immutable and UI code must never overwrite raw results.
- Camera tracks must stop after acceptance, cancellation, or failure cleanup.
- GNSS/computational Qibla remains a separate system from astronomical verification.
- Copyright: © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.

## Refactor rule

Branch `new` may reorganize files and HTML, but must preserve behavior first. Structural changes are accepted only when the astronomical integration tests and phone acceptance path remain equivalent to `feature/astronomical-solver-foundation`.
