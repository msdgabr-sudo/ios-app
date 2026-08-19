# CP-009 — STATIC HOME INTEGRATED

Branch: `new`
Integrated Home result commit before this checkpoint: `df59560`
UI source: `feature/home-ui-reference-match`

## State

The approved modern QiblaAstro Home screen is now static markup in `index.html` from first paint.

The old JavaScript-generated Home pattern is removed from `js/home-final.js`; that file is now the approved binding/data-sync/navigation layer only.

The Home route contains separate actions for:

- Digital Qibla / digital compass: `data-go="compass" data-compass-mode="digital"`
- Astronomical verification: `data-go="compass" data-compass-mode="astro"`
- Falaki educational page: `data-go="night"`
- GNSS, Prayer/Adhan, Quran, Azkar, Serenity, Settings.

## Preserved target architecture

The Home replacement ended before the canonical Compass engine anchors. These remain target-branch authority:

- `#qibla-compass-engine-anchors`
- `#cvs`
- `#dev-slider`
- external `#page-compass` host -> `pages/compass.html`
- external `#page-night` host -> `pages/falaki.html`

No protected astronomical verification, GNSS, compass canvas, device heading, solver, session, store, bridge, or camera file was replaced by the Home migration.

## Presentation assets transferred

Approved Home CSS layers, `js/home-final.js`, `js/home-reference-finalizer.js`, the 4K Home background, and Kaaba reference assets were ported from the approved UI source branch.

`css/06-navigation.css` received only the static-Home first-paint suppression rule for legacy bottom chrome.

Service Worker App Shell was merged rather than replaced, with cache version:

`qiblaastro-v5.56-static-home-integrated`

## Validation

PASS:

- Static Home exists directly in `index.html`.
- Home appears from first paint; no JS Home generation contract remains.
- Digital and Astronomical mode routes exist separately.
- Engine anchors and external Compass/Falaki hosts remain unique.
- Home offline assets are in the App Shell.
- Permanent test: `tests/presentation/static-home-transfer.test.js`.
- Protected Scientific Core Integrity: PASS.
- Astronomical solver regression: PASS.

## Next acceptance

Physical/mobile acceptance is still required for:

1. Home visual match and first paint.
2. Digital Compass action from Home.
3. Astronomical Verification action from Home.
4. Android camera permission and Observatory opening.
5. Real Sun/Moon observation and accepted result.
6. Computational Qibla remaining unchanged while astronomical result updates separately.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
