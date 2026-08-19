# KLIR External-Only Presentation Checkpoint

This checkpoint records the completed cleanup of legacy presentation remnants from `index.html` for the following standalone screens:

- Prayer -> `pages/prayer.html`
- Falaki -> `pages/falaki.html`
- Azkar -> `pages/azkar.html`

The parent `index.html` now retains only the route/container invocation for these screens. Legacy Prayer/Azkar stylesheet links were removed from `index.html`, the detached `az-particles` residue was removed, and the obsolete inline Azkar presentation engines/enhancement block were removed.

Static verification passed for shell uniqueness, fragment/host presence, removal of legacy presentation tokens, JavaScript syntax checks for affected presentation loaders, preservation of Home/Compass roots, and blob-level protection checks for `js/astro-verification.js` and `js/presentation/compass/host.js` against the `gabr` baseline.

Serenity remains outside this cleanup scope because it is under concurrent work in another session.
