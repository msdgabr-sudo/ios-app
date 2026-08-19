# WMM2025 MDECL Runtime Gate Results — A2

Date: 2026-08-14  
Baseline: `aea33d59a21cc8764f2175ddbd36fc7751cde9c6`

## Result

The legacy regional `magDecl()` producer and Egypt-only `+0.30` correction were
removed. The production MDECL source now accepts only the output of the
WMM2025 runtime adapter after a trusted Device GPS/GNSS fix.

No AAB was built. This checkpoint intentionally stops after source and runtime
tests.

## Runtime location matrix

Evaluation date: `2026-08-14T12:00:00Z`; altitude: `0 m`.

| Location | Latitude | Longitude | D | H | Status |
|---|---:|---:|---:|---:|---|
| Cairo, Egypt | 30.0444 | 31.2357 | +4.766930° | 31143.19 nT | normal |
| Jakarta, Indonesia | -6.2088 | 106.8456 | +0.645924° | 38894.42 nT | normal |
| New York, USA | 40.7128 | -74.0060 | -12.469711° | 21023.52 nT | normal |
| London, Europe | 51.5074 | -0.1278 | +1.182200° | 19551.80 nT | normal |

The four results differ by location and include an expected sign change in New
York, proving that the former Egypt-only regional correction is no longer being
reused globally.

## Safety gate results

- untrusted fix: publication blocked;
- IP source: publication blocked;
- NaN/out-of-range coordinates: rejected;
- non-finite WMM output: rejected;
- real WMM vector at 86°N, 140°E with `H < 2000 nT`: `blackout`, publication blocked;
- real WMM vector at 83°N, 54°E with `H = 3999.29 nT`: `caution`, publication allowed with caution state preserved.

## Regression evidence

- official WMM2025 gate: 12 vectors × 7 fields = 84 assertions passed;
- runtime integration gate: passed;
- index inline JavaScript syntax: passed;
- astronomical solver integration: 16/16 passed;
- astronomical observation bridge: 6/6 passed;
- astronomical semantic mapping, module boundary, screen boundary, scientific
  write barrier, and protected hash gate: passed;
- QT equation text is unchanged from the baseline;
- all selected digital-compass, camera, and astronomical-verification source
  hashes match the pre-change snapshot exactly.

| Protected group | Before SHA-256 | After SHA-256 | Match |
|---|---|---|---:|
| Digital compass sources | `ec7da334c1993c38969e9d5a7929708e7c6c2b6d84ce93fe2f5766ac0bb3e6e5` | `ec7da334c1993c38969e9d5a7929708e7c6c2b6d84ce93fe2f5766ac0bb3e6e5` | yes |
| Camera sources | `aa0fe7d1a80f4a0f2a07c06466ed7ee2f241e536e04c0853e7a72cbb4a605ad2` | `aa0fe7d1a80f4a0f2a07c06466ed7ee2f241e536e04c0853e7a72cbb4a605ad2` | yes |
| Astronomical verification sources | `2f60878d557d716eec57b6d58ba9b7983a2788daa35abcdf66f30a36d85ca783` | `2f60878d557d716eec57b6d58ba9b7983a2788daa35abcdf66f30a36d85ca783` | yes |
| `calcQibla()` / QT equation | `0ce545f40d8f010d78ff647fe7bcf49028de16a60ec6c5e6154979ee05857e11` | `0ce545f40d8f010d78ff647fe7bcf49028de16a60ec6c5e6154979ee05857e11` | yes |

The accepted canonical files also remain byte-identical:
`js/geomag/wmm2025.js` = `374ed412...accd72`, and
`data/WMM2025.COF` = `94448f40...f8bfb` before and after.

## Pre-existing unrelated test failures

Several broad repository tests fail on the baseline because the current service
worker does not contain older expected app-shell entries, and because existing
card/digital-presentation contracts do not match their tests. The failing areas
were not edited to avoid crossing the protected boundary:

- `tests/astronomical-verification-session.test.js`;
- `tests/qibla-card-runtime.test.js`;
- `tests/presentation/digital-compass-contract.test.js`;
- `tests/astronomical-app-wiring.test.js`;
- `tests/pwa-standalone-readiness.test.js`.

## Remaining risks / deliberate limits

- A real-phone GPS/permission/orientation run has not been performed in this
  source-only checkpoint.
- When the device altitude is unavailable, the adapter uses sea-level `0 m`;
  supplied finite device altitude is passed through.
- WMM2025 rejects dates outside its official `[2025, 2030)` validity interval.
- The legacy Giza coordinates still exist as internal initialization values for
  other bundled calculations. This stage guarantees that MDECL never evaluates
  or publishes from them; removing the broader compatibility dependency remains
  a separate explicitly approved task.
- No camera or astronomical-verification behavior was changed or re-tested on a
  physical device.
