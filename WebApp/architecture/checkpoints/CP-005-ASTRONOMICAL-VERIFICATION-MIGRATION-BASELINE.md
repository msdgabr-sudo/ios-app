# CP-005 — Astronomical Verification Migration Baseline

Status: BASELINE LOCKED — no presentation migration applied yet.
Branch: `new`
Source UI reference: `feature/home-ui-reference-match`

## Mission
Externalize/restructure the astronomical verification screen presentation without changing the scientific engine, camera capture semantics, solver, quality gates, session/store contract, or computational Qibla.

## Protected execution path
`entry -> permission -> camera stream -> frames -> celestial detection -> gravity reference -> observation bridge -> solve -> quality gate -> freeze -> record -> stop -> post-verification live compass`

## Scientific separation invariants
- Astronomical verification remains independent from `QT`, `deviceHeading`, magnetic declination, and magnetic compass correction.
- Computational Qibla remains unchanged by astronomical verification.
- UI is presentation only and cannot write scientific state.
- Camera/solver/session/store files are not to be copied, rewritten, renamed, or merged during screen migration.
- A fresh observation must be required after refresh; no stale record may be treated as a fresh verification.

## Confirmed identical source/new protected blobs
- `js/astronomical-observatory-ui.js` — SHA `c98e071d4048bdd05924dc9b11da0c0ddc308e9a`
- `js/astro-verification.js` — SHA `fbf3c9b5b761b76b56c1ade471c4769da64b7f8b`
- `js/astronomical-verification-session.js` — SHA `3f144a46c0488a8de2f1cb007d400b35fe44ba40`
- `js/astronomical-verification-store.js` — SHA `29b7ac0dee7259a25a4a51bea00eb1bcb66d20e7`
- `js/astronomical-observation-bridge.js` — SHA `1db4f3e4e3b79ae552ee7eaef77272bbfe20c2e5`

## Presentation scope identified from PR #3
Primary screen presentation:
- `css/28-astronomical-observatory.css`
- `js/astronomical-observatory-ui.js`

Engine/runtime dependencies are protected and remain in place, including gateway, session, store, observation bridge, reticle, solver, camera projection/pose, celestial detector, gravity reference, verification quality, coordinate/world orientation, trace, and post-verification live compass.

## Observatory UI contract
The Observatory UI is a production presentation layer. It receives measurement objects through `update(data)` and emits callbacks for manual/auto capture, accept, retry, and back. It displays camera video, target, quality, stability, tracking, countdown, freeze frame, and result values. It must not become a second solver or source of truth.

## Acceptance gates before any index cleanup
1. Protected Scientific Core Integrity PASS.
2. Astronomical module boundary PASS.
3. Presentation scientific write barrier PASS.
4. Astronomical solver regression PASS.
5. Camera permission still appears on user action.
6. Back closes camera/sensors safely.
7. Sun/Moon observation can complete and be accepted.
8. Astronomical cards update while computational Qibla remains unchanged.
9. Refresh does not reuse stale verification as fresh.

## Next operation
Map the current UI entry points and DOM/CSS ownership, then externalize only presentation assets/hosts. Do not edit any protected scientific blob during the migration.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
