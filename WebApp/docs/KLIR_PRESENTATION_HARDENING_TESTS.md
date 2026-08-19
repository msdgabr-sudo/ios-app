# KLIR Presentation Hardening — Verification Record

Date: 2026-08-10
Branch: `klir`

## Scope

This verification covers presentation cleanup/hardening only for:
- Prayer
- Azkar
- Falaki
- Quran

Out of scope and intentionally not modified by this cleanup pass:
- Home presentation
- Digital Compass presentation
- Astronomical Verification UI/engines
- Camera / detector / solver / verification algorithms
- Serenity, because it is under concurrent work in another session

## Verified presentation contracts

### Prayer
- Source: `pages/prayer.html`
- Root contract: `#page-prayer`
- Required runtime nodes are validated by `js/presentation/page-loader.js` against `js/presentation/page-registry.js` before mounting.
- Legacy content is replaced by a neutral loading state before network validation.
- Failure state does not restore legacy markup.
- Failure state now exposes an explicit retry action.

### Azkar
- Source: `pages/azkar.html`
- Standalone document contract verified against live IDs: `#azkarApp`, `#azHome`, `#azReader`.
- Parent legacy residue `#az-particles` is removed before mounting.
- Host state machine: loading -> ready / failed.
- A 15-second watchdog prevents an indefinitely stuck loading state.
- Invalid iframe content is rejected instead of being accepted as a successful load.
- Failed state exposes an explicit retry action.

### Falaki
- Source: `pages/falaki.html`
- Standalone document contract verified against `main.shell`, `#moonAlt`, `#moonAz`, and `#sunAlt`.
- Existing Moon altitude/azimuth mirror behavior is retained.
- Mirror timers/observers are cleaned before remount and on failure.
- Host state machine: loading -> ready / failed.
- A 15-second watchdog prevents an indefinitely stuck loading state.
- Invalid iframe content is rejected.
- Failed state exposes an explicit retry action.

### Quran
- Source: `pages/quran.html`
- Standalone document contract verified against live IDs: `#qrApp`, `#qrHome`, `#qrReader`.
- Quran corpus and reader scripts/data were not modified.
- Host state machine: loading -> ready / failed.
- A 15-second watchdog prevents an indefinitely stuck loading state.
- Invalid iframe content is rejected.
- Failed state exposes an explicit retry action.

## Protected-file integrity checks

Blob SHA comparison between `gabr` baseline and `klir` after this pass:

- `index.html`
  - gabr: `1911ff880d061880f55955d9f9efb286a7e5d9fc`
  - klir: `1911ff880d061880f55955d9f9efb286a7e5d9fc`
  - Result: identical

- `js/astro-verification.js`
  - gabr: `692c1f628aa524c3f0d58530bed3c4618841da24`
  - klir: `692c1f628aa524c3f0d58530bed3c4618841da24`
  - Result: identical

- `js/presentation/compass/host.js`
  - gabr: `9c64d38f51d875b21e7452f3f89122ffdecec2a8`
  - klir: `9c64d38f51d875b21e7452f3f89122ffdecec2a8`
  - Result: identical

## Concurrent-work note

`klir` also contains changes made outside this cleanup session, including Serenity-related files and `js/home-final.js`. Those files were treated as concurrently owned and were not reverted or rewritten by this cleanup pass.

## Remaining cleanup boundary

Legacy CSS removal from `index.html` has deliberately not been forced during this pass. The previous experiment showed that removing shared CSS without selector-by-selector dependency proof can create visual regressions. The current pass prioritizes eliminating legacy fallback exposure and making modern screen loading deterministic and recoverable without altering the protected Home / Compass / Verification stack.
