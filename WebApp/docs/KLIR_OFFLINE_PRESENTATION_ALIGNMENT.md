# KLIR Offline Presentation Alignment

Date: 2026-08-10
Branch: `klir`

## Goal
Reduce the chance that a standalone modern screen falls back to stale or mismatched cached content when the PWA is offline or when the network is unstable.

## Change
The standalone iframe sources for Azkar, Quran, and Falaki now use the same unversioned page URLs that are already present in the Service Worker app shell:

- `pages/azkar.html`
- `pages/quran.html`
- `pages/falaki.html`

Previously the iframe hosts appended query-string build identifiers. The Service Worker app shell pre-caches the unversioned URLs, while Cache Storage keys include the request URL. Using a different query string can therefore create a separate cache key and weaken first-offline-load reliability.

## Why this is safer
The host JavaScript files themselves are still cache-busted from `bootstrap.js`, so new host logic is requested explicitly. The iframe document URL, however, now matches the app-shell cache key exactly. This preserves network-first behavior while giving the existing pre-cache a deterministic offline fallback.

## Existing hardening retained
Azkar, Quran, and Falaki keep:

- loading / ready / failed presentation states
- 15-second watchdog
- modern-screen DOM contract verification after iframe load
- explicit retry action after failure
- no restoration of legacy presentation markup

Falaki also keeps Moon altitude/azimuth mirroring and cleans its observers/timers before remount or on failure.

## Protected scope verification
The following protected files were re-checked after this change and remain unchanged from the `gabr` baseline:

- `index.html` SHA: `1911ff880d061880f55955d9f9efb286a7e5d9fc`
- `js/astro-verification.js` SHA: `692c1f628aa524c3f0d58530bed3c4618841da24`
- `js/presentation/compass/host.js` SHA: `9c64d38f51d875b21e7452f3f89122ffdecec2a8`

No Home, Digital Compass, camera, solver, astronomical verification, or scientific calculation file was modified in this pass.

## Concurrent Serenity work
Serenity remains concurrently owned by another session. This pass did not rewrite Serenity files. `bootstrap.js` was read again immediately before its cache-key update so the current Serenity loader logic was preserved.

## Acceptance checks
1. Online first load: Home opens and navigation remains responsive.
2. Prayer loads the modern fragment only.
3. Azkar loads the standalone modern page and never exposes legacy residue.
4. Falaki loads the standalone modern page and Moon altitude/azimuth mirroring still updates the parent display.
5. Quran loads the standalone modern reader.
6. Reload each screen once while online so the current app cache is populated.
7. Switch offline and reopen Azkar, Falaki, and Quran. Their iframe URLs now match the pre-cached app-shell page URLs exactly.
8. Return online and verify retry behavior after any deliberately interrupted load.
