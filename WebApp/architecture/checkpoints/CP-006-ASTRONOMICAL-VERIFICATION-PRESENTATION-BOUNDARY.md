# CP-006 — Astronomical Verification Presentation Boundary Locked

Branch: `new`
Source reference: `feature/home-ui-reference-match`

## Verified facts
- `js/astronomical-observatory-ui.js` is byte-identical between source and `new` (SHA `c98e071d4048bdd05924dc9b11da0c0ddc308e9a`).
- `css/28-astronomical-observatory.css` is byte-identical between source and `new` (SHA `496f3fe2445f31b10b7bd489f16f4b237606ee53`).
- `js/astro-verification.js`, `js/astronomical-verification-session.js`, `js/astronomical-verification-store.js`, and `js/astronomical-observation-bridge.js` are also identical between source and `new`.
- Verification presentation is not inline in `index.html`.
- `pages/compass.html` exposes `#astro-body-card` as a launcher card only; no inline camera/solver/session logic is allowed there.
- `js/astro-verification.js` remains the single production launcher and owns the click binding to `#astro-body-card`.
- Legacy `js/integration.js` is not loaded by `index.html` and is not part of the production verification path.

## Protected production path
`launcher -> availability -> GNSS fix -> production stack -> camera permission/stream -> detection -> gravity -> observation bridge -> solver -> quality gate -> freeze -> record -> stop -> post-verification live compass`

## Immutable scientific rules
- No dependency on QT, magnetic heading, magnetic declination, or compass correction inside the astronomical observation/solver path.
- Default horizontal camera FOV remains 65°.
- Alignment tolerance remains 1° unless an explicit existing caller overrides it.
- UI never records scientific state and never calls the solver directly.
- Computational Qibla must remain unchanged when an astronomical record is accepted.

## Guard added
`tests/presentation/astronomical-verification-screen-boundary.test.js`

The guard prevents:
- legacy verification DOM returning to `index.html`,
- inline verification logic returning to the launcher card,
- presentation accessing solver/session/store-write APIs,
- removal of the canonical production launcher/CSS/stack contract.

## Status
Presentation boundary locked. No production engine/UI file changed in this stage.
Next: offline-stack readiness audit, then Android phone acceptance test.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
