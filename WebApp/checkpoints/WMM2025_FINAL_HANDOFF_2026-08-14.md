# WMM2025 — Final Completion and Handoff (`A2`)

Date: 2026-08-14  
Branch: `A2`  
Final implementation commit: `df9aab62a19dfba1220ff480ca7a01033b470566`

## Final status

The WMM2025 implementation on `A2` is complete and accepted at the source,
automated-test, and isolated real-phone GPS/GNSS levels.

This handoff does **not** authorize a production deployment, a merge to `pre`,
or a Google Play release. A full-application phone Preview must be accepted by
the owner before any final integration or publication.

## What was completed

- Added the official WMM2025 degree/order 12 magnetic model and coefficient
  dataset.
- Replaced the former regional magnetic-declination approximation and its
  Egypt-only correction as the runtime `MDECL` producer.
- Connected `MDECL` publication only to a trusted Device GPS/GNSS fix.
- Blocked IP geolocation, legacy Giza initialization coordinates, invalid
  coordinates, non-finite model output, and magnetic blackout locations from
  publishing `MDECL`.
- Preserved a caution state for weak horizontal magnetic fields.
- Passed finite device altitude to WMM2025; used sea level only when device
  altitude is unavailable.
- Added a canonical browser/phone acceptance page using the same final engine
  and trusted runtime adapter used by the application.
- Fixed stale-value revocation: if GPS is denied, lost, or unavailable after a
  previous accepted fix, the application now revokes the trusted fix, clears
  the previous WMM field, and returns `MDECL` and `QM` displays to `---`.
- Added GitHub Actions gates covering the official model, trusted runtime,
  protected hashes, and the canonical browser test page.

## Real-phone evidence

The isolated acceptance Preview was executed on a real Android phone and
returned:

| Item | Result |
|---|---:|
| Latitude | `30.125185°` |
| Longitude | `31.130108°` |
| GPS accuracy | `17 m` |
| WMM2025 declination (`D`) | `+4.772809°` |
| Horizontal field (`H`) | `31101.31 nT` |
| Field status | `normal` |
| Decimal year | `2026.616388` |

The phone page confirmed that the location was accepted as trusted GPS and that
WMM2025 was evaluated without an IP source.

## Validation completed

- Official WMM2025 reference gate: **12 vectors × 7 fields = 84 assertions
  passed**.
- Trusted GNSS runtime integration gate: **passed**.
- Canonical browser acceptance-page gate: **passed**.
- Astronomical solver integration: **16/16 passed**.
- Astronomical observation bridge: **6/6 passed**.
- Astronomical semantic mapping: **passed**.
- Astronomical module boundary: **passed**.
- Astronomical verification screen boundary: **passed**.
- Presentation scientific write barrier: **passed**.
- Final GitHub Actions run for stale-MDECL revocation: **passed**.

## Protected boundaries preserved

This stage did not redesign or change the protected behavior of:

- the `calcQibla()` / `QT` equation;
- the digital compass screen or protected compass source files;
- the astronomical verification engine or screen;
- the camera lifecycle, pose, or projection pipeline;
- raw astronomical observations or their authoritative store.

The WMM2025 runtime produces magnetic declination only. It does not overwrite
computational Qibla `QT`, astronomical verification output, or raw observations.

## Canonical implementation files

- `data/WMM2025.COF`
- `js/geomag/wmm2025.js`
- `js/geomag/wmm2025-runtime.js`
- trusted GNSS integration in `index.html` and `js/05-gnss.js`
- obsolete MDECL-producer removal in `index.html` and `js/10-astronomy.js`
- `tests/wmm2025-official-gate.js`
- `tests/wmm2025-runtime-integration.test.js`
- `tests/wmm2025-browser-page.test.js`
- `pages/wmm2025-test.html`
- `.github/workflows/wmm2025-runtime-gate.yml`

Other earlier WMM-named files are experimental history and must not be treated
as the canonical production path without a separate reference audit.

## Safe integration handoff to `pre`

Do not merge the whole `A2` branch into `pre`. The branches have independent
changes and may have diverged.

The required integration sequence is:

1. Create a new integration branch from the latest `pre`.
2. Audit and transfer only the accepted WMM2025 commits/files.
3. Resolve conflicts without changing protected scientific or camera regions.
4. Re-run all WMM2025 and protected-boundary gates on the integration branch.
5. Publish a full-application Preview for phone acceptance.
6. On the phone, verify trusted GPS, WMM2025 values, denial/loss behavior,
   corrected compass presentation, and non-regression of camera and
   astronomical verification.
7. Merge to `pre` only after explicit owner approval.
8. Do not update Production or Google Play until a separately versioned release
   passes its release gates and receives explicit approval.

## Final handoff statement

WMM2025 work is closed successfully on `A2`. The implementation, automated
evidence, real-phone GPS evidence, safety gates, and stale-value revocation are
present in the branch. Responsibility now passes to the controlled `pre`
integration and full-application phone-acceptance stage. No publication approval
is implied by this handoff.

