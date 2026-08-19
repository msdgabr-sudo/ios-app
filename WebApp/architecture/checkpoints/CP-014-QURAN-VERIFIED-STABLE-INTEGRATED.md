# CP-014 — Quran Verified Stable Integrated

Status: COMPLETE / ready for final device acceptance cycle.

Handoff document commit: `bbc423bf0e490323aace42c0be2c7cf092f66d4a`
Actual source used per `QURAN_HANDOFF.md`: current `quran-stable` HEAD captured during guarded transfer as `50b2e6040b103b38f7608469cfcd7e16ed32209d`.

Transferred without manual Quran text editing:
- `pages/quran.html`
- all CSS/JS declared by current `QURAN_HANDOFF.md`
- `quran/1.json` through `quran/114.json`
- Quran verification scripts, workflows and documentation
- application-only `js/presentation/quran/host.js`

Application integration:
- legacy inline `page-quran` presentation replaced by external-page host only
- standalone screen loaded from `pages/quran.html`
- Service Worker version: `qiblaastro-v5.58-quran-verified`
- full 114-file Quran corpus added to offline App Shell

Mandatory post-copy verification result:
- `SURAHS_COMPARED=114`
- `AYAT_COMPARED=6236`
- `TEXT_MISMATCHES=0`
- `METADATA_MISMATCHES=0`
- `LOCAL_QURAN_TEXT_SHA256=7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`
- `REFERENCE_QURAN_TEXT_SHA256=7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`
- `QURAN EXACT TEXT CHECK: PASS`
- `QURAN PROVENANCE CHECK: PASS`

Scientific-core guard: PASS.

Rule remains permanent: never edit `quran/*.json` manually. Any corpus change invalidates this checkpoint until the full verification gate is rerun.
