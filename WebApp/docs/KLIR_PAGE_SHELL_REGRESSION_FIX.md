# KLIR Page Shell Regression Fix

Date: 2026-08-10
Branch: `klir`

## Symptom observed
After removing legacy Azkar presentation CSS from `index.html`, the Home screen became narrow with the sky background visible at both sides, additional pages could render below Home, and navigation appeared unresponsive/confusing.

## Root cause
`css/22-azkar.css` was not purely Azkar presentation CSS. It also contained the application's generic `.page` routing/layout contract:

- `.page { display:none !important; width:100%; max-width:420px; padding:0 12px; ... }`
- `.page.active { display:block !important; }`
- explicit active display modes for Azkar, Quran, and Serenity.

Removing the legacy stylesheet therefore also removed shared application infrastructure. This caused inactive pages to stop being forcibly hidden and removed the `width:100%` page-shell rule.

## Corrective action
The generic page-shell rules were moved to their proper owner: `css/07-pages.css`.

The legacy `css/22-azkar.css` remains detached from `index.html`; it is not restored. Prayer, Falaki, and Azkar therefore remain external-only presentation screens while the common router/page shell is preserved independently.

## Static verification performed
- `css/07-pages.css` now owns `.page` default hidden state.
- `.page.active` behavior matches the previous working contract.
- `page-azkar`, `page-quran`, and `page-serenity` keep their historical active display modes.
- `index.html` continues to omit `css/13-prayer-times.css` and `css/22-azkar.css`.
- Prayer, Falaki, and Azkar continue to exist in `index.html` only as route shells.
- No astronomical verification, solver, camera, or digital-compass file was modified by this fix.
- Concurrent Serenity work was not rewritten.

## Important lesson
Before deleting a screen-specific legacy stylesheet, inspect it for shared infrastructure selectors (`.page`, `body`, navigation, root layout, shared animations). Shared rules must first be migrated to the correct common stylesheet, then the legacy stylesheet can be detached safely.
