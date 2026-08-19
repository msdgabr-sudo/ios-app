# QiblaAstro — Presentation Page Integration Contracts

Branch: `new`

## Purpose

Prepare Quran, Azkar, and Serenity as replaceable presentation modules while keeping every astronomical verification, camera, capture, solver, equation, quality gate, store, and scientific runtime untouched.

## Non-negotiable boundary

Presentation files MUST NOT import, call, mutate, duplicate, or replace any astronomical/camera core module. New designs may change markup, classes, layout, CSS, icons, images, animations, and presentation-only behavior, but they must preserve the public IDs and handler contracts required by their existing page logic.

## Stable paths

- `pages/quran.html`
- `pages/azkar.html`
- `pages/serenity.html`
- `css/presentation/quran/screen.css`
- `css/presentation/azkar/screen.css`
- `css/presentation/serenity/screen.css`
- `js/presentation/page-registry.js`
- `js/presentation/page-loader.js`

## Activation policy

The guarded page loader is intentionally not auto-started. A page is activated only after:

1. The incoming design is placed in its page/CSS presentation slot.
2. Required IDs are verified.
3. Duplicate IDs are rejected.
4. Protected scientific/camera tokens are rejected.
5. Existing page behavior is regression-tested.
6. Only that one page is activated.

## Quran required IDs

`page-quran`, `qr-list-view`, `qr-reader-view`, `qr-surah-list`, `qr-search`, `qr-surah-title`, `qr-ayahs`, `qr-font-size`, `qr-bookmark-btn`.

## Azkar required IDs

`page-azkar`, `az-categories-screen`, `az-reading-screen`, `az-reading-title`, `zk-pf`, `zk-pt`, `zs-sabah`, `zs-masa`, `zs-nawm`, `zs-fajr`, `zs-salah`, `zs-duaa`.

## Serenity required IDs

`page-serenity`, `sk-canvas`, `sk-track-list`, `sk-now-title`, `sk-now-sub`, `sk-progress`, `sk-current`, `sk-duration`, `sk-play-btn`.

## Scientific exclusion

No page fragment or page-specific presentation stylesheet/script may contain astronomical solver, verification session/store, observation bridge, camera projection/pose, celestial detector, gravity reference, `getUserMedia`, camera capture, or scientific result symbols.

## Design import rule

When approved new screen designs arrive, import them into these presentation slots rather than copying a whole replacement `index.html`. This keeps design evolution physically separated from the protected scientific core.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
