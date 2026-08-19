# CP-002 — Falaki Inline Cleanup Accepted

Date: 2026-08-08
Branch: `new`
Previous checkpoint: `32edf0c5f607738965b205100af3552aab53527b` (CP-001)
Target screen: فلكي

## Result

The legacy inline Falaki/Night screen body was removed from `index.html` after the standalone replacement had already been imported and verified.

`index.html` now contains only the external host:

```html
<div class="page" id="page-night" data-external-page="falaki" aria-label="فلكي"></div>
```

The former `css/14-night-page.css` stylesheet link was also removed from `index.html` because it belonged to the retired inline screen presentation.

The approved standalone source remains:

`pages/falaki.html`

Its imported blob remains byte-identical to the approved source from:

`feature/home-ui-reference-match/pages/falaki.html`

Approved source/target blob SHA:

`049f2786f40bb1b8e5cdc1f64fdc1db1c895ec20`

## Guarded cleanup evidence

The one-shot cleanup runner passed:

- guarded legacy block removal;
- standalone Falaki contract;
- changed-file guard proving the cleanup modified only `index.html`.

A comparison from CP-001 to the cleaned `new` branch showed exactly one operational file changed:

- `index.html`: +1 / -68

Temporary workflow/script/trigger files used for surgery were removed after successful execution.
Temporary PR #9 was closed without merge after the runner committed the cleanup directly to `new`.

## Protected scientific core

Protected files changed: **NONE**.

No changes were made to:

- astronomical solver;
- camera engine;
- observation bridge;
- gravity/reference pipeline;
- verification quality gates;
- verification session/store;
- GNSS/computational Qibla equations.

Legacy helper functions that are shared or safely no-op when their retired DOM targets are absent were not removed during this presentation cleanup.

## Falaki architecture after CP-002

`index.html` → external Falaki host only

`js/qibla-card-runtime.js` → loads Falaki presentation host

`js/presentation/falaki/host.js` → mounts `pages/falaki.html`

`pages/falaki.html` → independent educational page

The Falaki page remains informational/educational. It does not start the camera, does not perform astronomical verification, and does not write a verification record.

## Acceptance status

- Standalone import: PASS
- Initial phone/browser visual test: PASS (user reported no apparent problems)
- Inline legacy body removal: PASS
- Protected-file guard: PASS
- Temporary surgery artifacts removed: PASS

## Next action

Perform one final phone/browser smoke test of Falaki through the complete application after inline cleanup. If accepted, mark Stage A complete and proceed to the next screen migration without further Falaki changes.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
