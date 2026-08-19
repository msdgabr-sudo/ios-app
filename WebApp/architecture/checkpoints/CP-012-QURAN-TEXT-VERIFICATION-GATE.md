# CP-012 — Quran Text Verification Gate

Date: 2026-08-09
Target branch: `new`
Candidate presentation source: `quran-stable`

## Status
- `pages/quran.html` on `quran-stable` is a standalone full-page Quran experience with its own CSS/JS presentation stack.
- The branch itself declares Quran text approval **not final** until all local `quran/*.json` verses are exact-matched against an approved official reference.
- Therefore the Quran screen is **not transferred as final/approved yet**.

## Required release gate
1. 114 surahs.
2. 6236 ayat total.
3. Sequential ayah numbering with no gaps/duplicates.
4. Exact text comparison against the selected official Uthmani reference.
5. No automatic basmala insertion for Surat At-Tawbah.
6. Search normalization must remain derived-only; displayed Quran text must remain unchanged.
7. Record reference name/version/source/date in `QURAN_SOURCES.md`.

## Current approved reference candidate
- Tanzil Project — Uthmani Quran Text, Version 1.1, as already documented by `quran-stable/QURAN_SOURCES.md`.
- Tanzil licensing requires verbatim use and attribution; no text modification is permitted.

## Migration rule
Do not copy or rewrite Quran text manually. Do not mark Quran presentation as final until `scripts/verify-quran-text.mjs` reports `QURAN TEXT VERIFICATION: PASS` against the official reference.

## Other migration status
- Falaki: externalized.
- Digital compass: externalized.
- Static Home: integrated.
- Prayer/Adhan: externalized.
- Azkar: approved `azkar-stable@37c9dc9ea4a851c1561e2ea6bfce4b88f470b4eb` transferred with 10 local MP3 alert files.

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
