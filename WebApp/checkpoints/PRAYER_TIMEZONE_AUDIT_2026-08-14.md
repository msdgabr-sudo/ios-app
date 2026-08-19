# Prayer / Location / Time-Zone Audit — A2 Release Prep

Original audit: 2026-08-14 02:12 UTC
Resolution verified: 2026-08-14
Branch: `a2-release-prep`

## Scope
This checkpoint records the original prayer/location/time-zone risk and its later isolated resolution. The migration does **not** modify prayer equations, `sunPos()`, `moonPos()`, digital compass, astronomical verification, camera, solver, QT, or WMM2025.

## Original finding
The legacy astronomical event engine defines `const UTC_OFF=3;`, and `solarEvts()` returns its civil-hour fields (`rH`, `nH`, `sH`) relative to that legacy UTC+3 contract. Taken alone, those hour fields are not globally correct for London, New York, Jakarta, daylight-saving transitions, travel, or half-hour zones.

The original audit therefore blocked a global APK/AAB until a separate time-zone conversion layer could be proven without changing the astronomical position equations.

## Isolated migration that landed after the original audit
The blocker checkpoint predates the actual migration:
- `7ae84c436547c5f3e2cbb533ace14d274234d3e2` — added `js/runtime/local-timezone-adapter.js` (DST-aware local event-time adapter).
- `a5b4115ffbe0853dd43ca04abab38cafb35f917d` — wired the adapter before the prayer runtime.
- Later prayer-runtime commits added IANA-aware manual city selection, 12-hour presentation, and trusted/manual location synchronization.

The legacy `UTC_OFF=3` constant intentionally remains inside the legacy event engine. It is now treated as an explicit internal contract, not as the user's civil time zone. `js/runtime/local-timezone-adapter.js` wraps only `solarEvts()` output hours and converts `rH`, `nH`, and `sH` from the legacy UTC+3 contract to the device's current civil UTC offset, including DST. Non-time astronomical fields are preserved.

## Production wiring
`index.html` defines the legacy astronomical engine first and later loads `js/presentation/location-label.js`.

The prayer-only dependency chain in `location-label.js` loads, in callback order:
1. `js/runtime/local-timezone-adapter.js`
2. `js/prayer/calculation-methods.js`
3. `js/prayer/prayer-settings.js`
4. `js/prayer/prayer-location.js`
5. `js/prayer/time-format.js`
6. `js/runtime/trusted-location-dependent-sync.js`

If the adapter is already loading, prayer startup waits for `qiblaastro:timezone-adapter-ready`. The Service Worker critical cache also includes the adapter and prayer runtime dependencies for offline operation.

## Auto/GNSS and manual-city behavior
- Auto/GNSS prayer calculation consumes the wrapped `solarEvts()` result, so the device's current offset/DST is used for civil event hours.
- Manual city calculation temporarily substitutes the selected prayer-only LAT/LON, calls the wrapped event engine, restores global coordinates synchronously, then converts from device civil time to the selected city's IANA time zone using `Intl.DateTimeFormat`.
- Manual city selection therefore supports independent IANA/DST rules without overwriting GNSS, QT, compass, or verification coordinates.
- Custom coordinates intentionally use the device's current time zone unless a catalog city with an explicit IANA zone is selected.

## Acceptance gates
The resolved contract is protected by:
- `tests/local-timezone-adapter.test.js` — Cairo, London summer/winter, New York summer/winter, Jakarta, DST behavior, half-hour offsets, field preservation, and protected-engine guardrails.
- `tests/trusted-location-runtime-sync.test.js` — production prayer dependency chain and isolation of manual prayer coordinates.
- `tests/timezone-production-wiring.test.js` — exact production index load order, adapter readiness callbacks, auto/manual consumers, offline cache, half-hour conversion, and protected-engine isolation.
- `A2 pre-native release gate` executes all three before release-candidate acceptance.

## Resolution
**The original global time-zone release blocker is CLOSED.**

The legacy UTC+3 event-engine contract remains deliberately explicit, while global civil-time conversion is isolated in a tested runtime adapter. Removing or rewriting `UTC_OFF=3` inside the astronomical engine is neither required nor authorized by this resolution.

Any future change to `UTC_OFF`, `solarEvts()`, the adapter, IANA-zone conversion, or prayer dependency order must pass the production time-zone gates before an APK/AAB may be accepted.
