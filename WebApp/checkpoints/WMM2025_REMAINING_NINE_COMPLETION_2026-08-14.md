# WMM2025 — Remaining-Nine Completion (`A2`)

Date: 2026-08-14  
Baseline: `7bc6481733b76c31e6be4ac0e86f897e538e7733`

## Scientific boundary

WMM2025 does **not** calculate Qibla direction. It supplies magnetic
declination (`MDECL`) for the relationship between magnetic north and true
north at a trusted location and date. The existing `calcQibla()` equation and
its true-Qibla output (`QT`) remain unchanged.

## Completed controls

1. Added Makkah (`21.42250833, 39.82616667`) to the trusted-runtime matrix.
2. Confirmed its 2026-08-14 sea-level WMM2025 declination as `+3.503246°`.
3. Made the official-reference gate calculate and print the largest observed
   field and angular errors rather than reporting only pass/fail.
4. Recorded the largest field error: `0.049992965 nT` in `H`, at the official
   `2025.0 / 100 km / 80°S / 240°E` vector.
5. Recorded the largest angular error from the 12 official vectors:
   `0.004988258°` in inclination, at
   `2025.0 / 0 km / 80°S / 240°E`.
6. Audited the experimental WMM files and kept them as historical test
   artifacts only; none is loaded by the application, service worker, or
   canonical phone test page.
7. Hash-locked the canonical engine and official coefficient file in a new
   audit gate.
8. Removed the startup computational dependency on the legacy Giza coordinates:
   `LAT/LON` now fail closed as non-finite until trusted Device GPS/GNSS, and
   `QT/QM` stay in a neutral unpublished state until that fix is accepted.
9. Added CI enforcement for the canonical/experimental/startup audit.

## Experimental-file disposition

| File | Classification | Runtime status |
|---|---|---|
| `js/22-wmm2025-engine.js` | historical prototype | not loaded |
| `js/engines/wmm2025-isolated.js` | historical isolated prototype | not loaded |
| `js/wmm2025-standalone.js` | historical standalone prototype | not loaded |
| `js/geomag/wmm2025.js` | canonical WMM2025 engine | loaded before adapter |
| `js/geomag/wmm2025-runtime.js` | canonical trusted-GNSS adapter | sole `MDECL` publisher |

## Protected areas

No digital-compass source, astronomical-verification source, camera source,
raw-observation source, QT equation, or measurement pipeline was modified.
No merge, Production release, AAB, or Google Play action is authorized by this
checkpoint.
