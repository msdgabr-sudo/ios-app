# CP-004 — Digital Compass Externalized / Phone Acceptance Pending

Date: 2026-08-09
Branch: `new`
Owner: محمد سيد جبر بحيرى — Mohamed SG Behairy

## Result
The Digital Compass presentation has been externalized from `index.html` into `pages/compass.html`.

`index.html` now owns only:
1. the canonical startup engine nodes `#cvs` and `#dev-slider`, inside the hidden `#qibla-compass-engine-anchors` container, so existing engine files can capture the exact same DOM objects during startup;
2. an empty `#page-compass[data-external-page="compass"]` host.

`js/presentation/compass/host.js` loads `pages/compass.html`, detaches the exact canonical engine nodes, replaces the host presentation content, and moves those same node objects into the fragment slots. It never clones or recreates them.

## Protected boundaries
No change was made to Qibla calculation, GNSS calculation, device heading engine, compass drawing engine, deviation engine, astronomical solver, camera pipeline, verification session, or verification store as part of the index surgery.

The following automated gates passed before the surgery was accepted:
- Protected scientific core blob integrity: PASS
- Astronomical module boundary: PASS
- Presentation scientific write barrier: PASS
- Astronomical solver regression suite: PASS
- Compass external host identity contract: PASS
- Guarded index cleanup structural validation: PASS

## Surgery diff
The guarded index surgery changed only `index.html` in its execution commit: 6 additions / 153 deletions. The old inline Digital Compass presentation body was removed. Canonical `#cvs` and `#dev-slider` identities were preserved as startup anchors.

## Presentation files
- `pages/compass.html`
- `js/presentation/compass/host.js`
- `js/presentation/compass/digital-adapter.js`
- `js/presentation/compass/digital-layout.js`
- `js/presentation/compass/mode-view.js`
- `css/presentation/compass/digital-visual-match.css`
- `css/presentation/compass/digital-final-fixes.css`

## Acceptance status
Architecture: APPROVED
Protected scientific core: APPROVED
Phone/device acceptance: PENDING

Phone acceptance must confirm:
- Digital Compass screen opens normally.
- The compass canvas renders and rotates live.
- Device heading updates.
- Computational Qibla remains unchanged and correct.
- Deviation updates as before.
- GNSS button still calls the existing location path.
- Manual calibration still opens and functions.
- Deviation slider still responds, proving its original listener identity survived the move.
- No tracking/lock legacy controls reappear.

Do not begin Astronomical Verification screen migration until this phone acceptance is recorded or any regression is corrected.
