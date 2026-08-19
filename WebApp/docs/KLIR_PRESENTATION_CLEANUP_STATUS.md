# KLIR Presentation Cleanup Status

Date: 2026-08-10
Branch: `klir`

## Protected / excluded areas

This cleanup does not modify Qibla calculation engines, astronomical verification engines, camera capture/solver logic, the digital compass presentation, or the approved Home presentation.

`Serenity / راحة وسكينة` is currently excluded from this cleanup because another concurrent workstream is modifying that screen and its audio/streaming assets. This cleanup must not overwrite or revert those concurrent changes.

## Completed guarded presentation migrations

### Prayer
- `page-prayer` is treated as an external presentation shell.
- `js/presentation/page-loader.js` clears legacy/fallback content before loading the validated modern fragment.
- Loading state is explicit.
- Failure state is neutral and does not restore old presentation markup.
- Scientific/verification tokens are rejected by the presentation loader contract.

### Azkar
- `js/presentation/azkar/host.js` clears the host before mounting `pages/azkar.html`.
- Legacy `az-particles` residue is removed by the host.
- States: `loading`, `ready`, `failed`.
- Failure never restores old Azkar presentation.

### Falaki
- `js/presentation/falaki/host.js` clears the old route presentation before mounting `pages/falaki.html`.
- States: `loading`, `ready`, `failed`.
- Moon altitude/azimuth mirror remains presentation-only and is preserved.
- Timers and observers are cleaned up on failure.

### Quran
- `js/presentation/quran/host.js` now clears any legacy/fallback presentation before creating the standalone Quran iframe.
- States: `loading`, `ready`, `failed`.
- Failure displays a neutral message and does not restore an old Quran screen.
- The Quran corpus and reader implementation are not modified by this cleanup.

## Cache/version handling

`js/presentation/bootstrap.js` uses explicit versioned URLs for the guarded hosts/loader so browsers do not silently continue using the older host scripts after a cleanup change.

The Service Worker was reviewed but intentionally not modified in this stage because it is global and also serves protected Home/Compass/Astronomical Verification assets. A later Service Worker change must be isolated, tested offline, and reviewed for query-string cache behavior before release.

## Tests/checks performed in this stage

1. Git compare against `gabr` used to identify all files changed on `klir` and detect concurrent work outside this cleanup.
2. Current Bootstrap was re-fetched immediately before writing to avoid overwriting concurrent changes.
3. Quran host file was re-fetched from `klir` and updated using its current blob SHA.
4. `pages/quran.html` was verified to exist on `klir` and return valid standalone HTML.
5. Bootstrap cache key was changed only for the Quran host in this stage.
6. Serenity work from this cleanup remains removed; concurrent Serenity files are not modified.

## Remaining cleanup

- Audit old global CSS references in `index.html` selector-by-selector before removing any stylesheet link.
- Do not remove `css/13-prayer-times.css` or `css/22-azkar.css` merely because the modern screens are external; first prove every selector is unused outside legacy presentation.
- Perform controlled Service Worker/offline tests after presentation cleanup stabilizes.
- Continue to keep Home, digital compass, astronomical verification/camera/solver files outside this cleanup scope unless explicitly authorized.
