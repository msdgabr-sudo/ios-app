# CP-013 — Verified Quran Final Transfer Start

Source: `quran-stable@bbc423bf0e490323aace42c0be2c7cf092f66d4a`

Mandatory gate after copy: `node scripts/verify-quran-cloud-origin.mjs`

Required output:
- SURAHS_COMPARED=114
- AYAT_COMPARED=6236
- TEXT_MISMATCHES=0
- METADATA_MISMATCHES=0
- LOCAL_QURAN_TEXT_SHA256=7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d
- QURAN EXACT TEXT CHECK: PASS
- QURAN PROVENANCE CHECK: PASS

No manual editing of `quran/*.json` is permitted.
