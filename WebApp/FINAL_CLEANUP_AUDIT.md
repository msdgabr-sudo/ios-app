# QiblaAstro — Final Conservative Cleanup Audit

**Branch:** `home`
**Safe reference:** `klir`
**Audit date:** 2026-08-10
**Decision:** Stop destructive cleanup at the current safe boundary.

## Final decision
The cleanup phase is considered complete at the current conservative boundary. No additional legacy HTML/CSS/JS should be removed merely to reduce file size. Remaining legacy sections are intentionally retained wherever runtime coupling exists or cannot be disproved with high confidence.

## Protected runtime areas
Do not modify as part of cleanup:
- Home presentation and navigation.
- Digital compass presentation or engine anchors.
- Astronomical verification UI/engine.
- Camera, solver, observation and verification engines.
- Computational Qibla/scientific engines.
- GNSS inline screen/runtime.
- Serenity inline/runtime path while concurrent work continues.

## External presentation screens verified present
- `pages/prayer.html`
- `pages/azkar.html`
- `pages/quran.html`
- `pages/falaki.html`
- `pages/compass.html`

The corresponding presentation bootstrap/hosts remain active. Their parent hosts/anchors in `index.html` are required architecture, not removable legacy markup.

## Legacy retained intentionally
### Calibration (`page-cal`)
Retained. The main loop actively writes to calibration DOM IDs and canvases, including `cal-az`, `cal-dir`, `cal-diff`, `cal-side`, `dgD`, `shadowCvs`, `shad-txt`, `cal-qi`, `noon-time-cal`, `noon-time-cal2`, `cal-qibla-from-north`, and `err-table`.

Important coupling: `gel('err-table').children.length` is accessed without a null guard. Removing the Calibration DOM while keeping the current loop could throw and interrupt later runtime updates.

### Map (`page-map`)
Retained. `drawMap()` remains part of the main loop. Removal is not justified by navigation visibility alone.

### Settings / Help
Retained. No fully proven safe removal boundary was established.

### GNSS / Serenity
Retained and protected. Both remain live integrated paths.

## Removed / detached legacy presentation confirmed
- `css/13-prayer-times.css` removed after the Prayer presentation moved to the external screen.
- `css/14-night-page.css` removed after full dependency review and successful device/user test.
- Legacy inline Azkar presentation was removed; the standalone Azkar presentation is authoritative.
- Prayer, Azkar, Quran and Falaki now retain required parent hosts rather than their former full legacy presentations in `index.html`.

## Important regression lesson
A previous attempted deletion of `css/22-azkar.css` exposed shared page-shell rules and caused a layout/navigation regression. That deletion was reverted. Permanent rule: never infer ownership from a filename; inspect every selector/function/ID and its repository-wide dependencies before removal.

## Service Worker / offline audit
The current `service-worker.js` does not reference the removed legacy stylesheets `css/13-prayer-times.css`, `css/14-night-page.css`, or `css/22-azkar.css`. It does include the modern Prayer/Azkar/Quran/Falaki/Compass presentation assets and hosts required for offline readiness.

## Pre-existing PWA script note — NOT caused by cleanup
The tail of `index.html` contains an additional `})();` after the Service Worker registration IIFE and the PWA install/network handlers. The same structure is present in the pre-cleanup `gabr` baseline, so this is not a cleanup regression. Treat it as a separate future PWA/script-hardening item, not as part of this cleanup closure.

## `index.html` cleanup delta
GitHub compare from the selected pre-cleanup `gabr` baseline to `home` currently reports for `index.html`:
- Additions: **5 lines**
- Deletions: **252 lines**
- Net source-line reduction: **247 lines**

Exact byte/KB size is intentionally not asserted in this document because the connected GitHub file/blob reader used for this audit exposes content and blob SHA but not the GitHub `size` metadata field. Do not substitute an estimate for an exact byte measurement.

## Safety gates preserved
Every future cleanup change must pass:
1. Full-file read, not filename inference.
2. DOM ID/class/function dependency tracing.
3. Null-safety and main-loop coupling review.
4. Protected-area gate.
5. One small change per commit.
6. Diff review verifying no unrelated file changed.
7. Fixed-SHA browser/device test before any next change.
8. Immediate rollback on any visual/navigation/runtime regression.

## Closure
The current architecture is safer when the remaining coupled legacy code is retained. Stability takes priority over further reduction in `index.html` size. Continue future feature development from `home`, keeping `klir` as the protected recovery/reference checkpoint.
