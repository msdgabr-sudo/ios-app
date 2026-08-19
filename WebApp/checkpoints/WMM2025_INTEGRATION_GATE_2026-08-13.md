# QiblaAstro — WMM2025 Integration Gate

Date: 2026-08-13
Branch: A2
Status: ISOLATED ENGINE IMPLEMENTED — RUNTIME WIRING NOT APPROVED

## Purpose
Replace the current regional magnetic-declination approximation only after a verified, global WMM2025 implementation passes an isolated acceptance gate.

## Runtime safety rule
Until this gate is fully passed:
- Do not change digital-compass behavior.
- Do not change astronomical-verification behavior.
- Do not change camera flow.
- Do not change Qibla true-azimuth calculation.
- Do not bind a new geomagnetic value to `MDECL` or `QM`.

## Official model source
Use only the official NOAA/NCEI World Magnetic Model 2025 distribution and its official WMM2025 test values.

Official model page:
https://www.ncei.noaa.gov/products/world-magnetic-model

Official coefficients page:
https://www.ncei.noaa.gov/products/world-magnetic-model/wmm-coefficients

Dataset DOI:
https://doi.org/10.25921/aqfd-sd83

## Required implementation
The production implementation must:
1. Use WMM2025 coefficients valid for the 2025.0–2030.0 model interval.
2. Compute magnetic declination from latitude, longitude, altitude, and decimal year.
3. Contain no Egypt-only correction or other regional constant.
4. Work fully offline after application installation.
5. Produce an explicit invalid/out-of-range state rather than silently fabricating a value.
6. Keep true-Qibla `QT` independent from geomagnetic declination.

## Acceptance tests before runtime wiring
The isolated engine must be checked against official NOAA WMM2025 test values.

Required coverage:
- Northern hemisphere / eastern longitude.
- Northern hemisphere / western longitude.
- Southern hemisphere / eastern longitude.
- Southern hemisphere / western longitude.
- Near-equatorial location.
- High-latitude location.
- More than one decimal year inside the WMM2025 validity period.

Acceptance rule:
- Test output must match the official reference values to the precision defined by the official test set.
- Any failed reference point blocks runtime integration.

## Runtime wiring gate
Only after all isolated tests pass may the following change be considered:
- make geomagnetic declination dynamic after a trusted device GNSS fix;
- recompute magnetic-Qibla display when trusted coordinates materially change;
- remove the remaining startup dependency on legacy Giza initialization values.

## Blackout / weak horizontal-field handling
Before runtime release, define a visible non-misleading state for locations where magnetic heading is unreliable. Do not present a high-confidence magnetic correction when the model or magnetic field conditions make heading unreliable.

## Current A2 state at gate creation
- Trusted device GPS/GNSS is required for publishing a new location-based Qibla update.
- IP geolocation is not used as a Qibla/verification coordinate source.
- The former Giza coordinates remain only as legacy startup compatibility values because the current `MDECL` is initialized during startup.
- Deviation calculator already uses the real current distance to the Kaaba instead of a fixed 1296 km constant.

## Release decision
AAB release must not describe the current regional approximation as a verified global WMM2025 implementation. Runtime replacement is approved only after the isolated WMM2025 engine and official-reference test gate are complete.

## Canonical isolated implementation

- Engine: `js/geomag/wmm2025.js`
- Official coefficients: `data/WMM2025.COF`
- Official vectors: `tests/wmm2025-reference-vectors.json`
- Executable gate: `tests/wmm2025-official-gate.js`
- Browser-only verification page: `wmm2025-test.html`

The executable gate validates all seven published field components (`X`, `Y`,
`Z`, `H`, `F`, `I`, and `D`) for all 12 NOAA/NCEI WMM2025 reference vectors,
including 0 km and 100 km altitude at epochs 2025.0 and 2027.5. It also checks
that the embedded degree/order 12 coefficients exactly match the official
coefficient file and that the coefficient file has both required terminators.

This remains an isolated scientific gate. Passing it does not authorize changes
to `MDECL`, `QM`, the digital compass, camera, or astronomical verification.
