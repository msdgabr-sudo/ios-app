# QiblaAstro iOS — Core Location → Trusted GNSS Integration Report

Date: 2026-08-19
Branch: `ios/foundation-native-shell`
PR: #2
Baseline WebApp: `q-app-an/main@cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`

## Scope lock

This phase is location integration only. It does **not** authorize changes to digital-compass mathematics, WMM2025 mathematics, QT/Qibla mathematics, astronomical verification/camera solving, prayer equations, or the trusted-location security policy.

## Implemented data path

`CLLocationManager` → `LocationService.swift` → `NativeBridge.swift` → `window.QiblaIOSNative.requestLocation()` → `WebApp/js/05-gnss.js` → existing trusted GNSS state (`LAT`, `LON`, `gnssAccuracy`, `gnssSource='gps'`, `gnssHasTrustedFix=true`) → existing `updateQiblaFromPosition()`.

The Swift layer does not calculate Qibla, WMM2025, prayer times, or astronomical results.

## Acceptance controls added

A Core Location sample is accepted only when all of these are true:

- Location Services are enabled.
- Authorization is When In Use (or an already-existing stronger authorization).
- `accuracyAuthorization == .fullAccuracy`.
- horizontal accuracy is valid (`>= 0`).
- latitude/longitude are finite and within geographic bounds.
- the native sample timestamp is no more than 30 seconds old.
- the WebApp independently rechecks source=`core-location`, fullAccuracy, timestamp freshness, coordinate range, and accuracy before setting trusted GNSS state.

If native iOS Core Location is available but fails, the iOS build does **not** fall back to browser geolocation, IP geolocation, or a default city.

## User-visible failure handling

The bridge differentiates:

- Location Services disabled.
- permission denied.
- permission restricted.
- Precise Location disabled (`reduced-accuracy`).
- acquisition timeout.
- generic unavailable state.

No failed state sets `gnssSource='gps'` or `gnssHasTrustedFix=true`.

## Files changed in this location phase

- `QiblaAstroIOS/LocationService.swift`
  - fresh/full-accuracy acquisition gate;
  - 15-second acquisition timeout;
  - transient `locationUnknown` handling;
  - reduced-accuracy rejection;
  - stops location updates after completion.
- `QiblaAstroIOS/NativeBridge.swift`
  - strict Core Location source marker;
  - explicit reduced-accuracy and timeout errors.
- `WebApp/js/05-gnss.js`
  - iOS Native Core Location adapter;
  - independent validation before existing trusted GNSS state is set;
  - no native-iOS browser/IP fallback;
  - Android/PWA browser-geolocation path preserved.
- `WebApp/tests/ios-core-location-trusted-gnss.test.js`
  - success, reduced-accuracy, stale-location, invalid-coordinate, and no-browser-fallback contracts.
- `.github/workflows/ios-foundation-gate.yml`
  - runs the location contract test in addition to protected scientific regressions and Xcode build.

## Automated gate

The GitHub Actions gate is configured for `macos-26` and explicitly selects `/Applications/Xcode_26.6.app`. The runner image currently lists Xcode 26.6 as installed. The gate runs protected WMM/Qibla/prayer/astronomical regressions before building the unsigned iPhone Simulator app.

**Status at document creation:** workflow trigger has been forced by refreshing the PR branch against current `main` and reopening/synchronizing PR #2. A green Xcode result must be observed before merge; absence of a visible workflow run is a CI/infrastructure blocker, not a pass.

## Physical iPhone acceptance — required before compass/camera work

This cannot be replaced by Simulator testing because the acceptance target is real Core Location behavior and user permission state on an iPhone.

Required scenarios on a signed Debug/TestFlight build:

1. Fresh install, Location Services ON, Precise Location ON: allow While Using; verify the WebApp changes from unresolved to trusted GPS and shows a finite accuracy.
2. Fresh install: deny location; verify no QT/location-dependent result is newly published from a fallback and the UI explains denial.
3. Location Services OFF: verify services-disabled handling and no fallback.
4. Precise Location OFF: verify reduced-accuracy handling and `gnssHasTrustedFix` remains false.
5. Re-enable Precise Location in Settings and retry: verify a fresh trusted fix is acquired without reinstall.
6. Indoor/poor-sky timeout: verify the 15-second native timeout does not classify as permission denial and no stale location becomes trusted.
7. Relaunch after prior permission grant: verify a fresh sample is still required and stale cached data is rejected.
8. Confirm that the computational Qibla card is updated only after the existing `updateQiblaFromPosition()` accepts the trusted state.

For each run record only: iPhone model, iOS version, authorization state, Precise Location state, reported accuracy, pass/fail, and visible error text. Do not store or publish the tester's coordinates in the report.

## Current blocking condition

A real-device result may only be marked PASS after execution on an actual signed iPhone build. Until that evidence exists, the project must **not** claim physical-device location acceptance and must **not** proceed to compass/camera integration as if the location field test were complete.
