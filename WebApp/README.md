# Mizan — Standalone PWA Repository

This repository is an independent application repository. It does not depend on another GitHub repository for runtime files, PWA routing, service-worker scope, or deployment.

## Current deployment model

- Default branch: `main`
- Static entry point: `index.html`
- PWA manifests: `manifest.json` and `site.webmanifest`
- Service worker: `service-worker.js`
- Offline fallback: `offline.html`
- GitHub Pages compatibility: `.nojekyll`

## Portability rule

PWA navigation and scope use relative URLs (`./`) rather than hard-coded repository paths. This keeps the build portable across GitHub Pages, a future custom domain, PWABuilder, and Android packaging.

## PWA assets

- `icons/` — standard, maskable, Apple, and browser icons
- `images/` — screenshots and application imagery
- `css/` — application styles
- `js/` — application runtime
- `pages/` — internal application screens
- `quran/` — local Quran data
- `assets/` and `audio/` — local media assets

## CI

The astronomical test workflow is scoped to this repository's `main` branch and does not push changes to legacy branches or external repositories.

## Security and ownership

© 2026 Mohamed Sayed Gabr Behairy — محمد سيد جبر بحيرى. All Rights Reserved.
