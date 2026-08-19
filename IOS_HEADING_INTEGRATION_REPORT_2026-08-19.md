# QiblaAstro iOS — Native Heading Boundary Report

Date: 2026-08-19
Branch: `ios/foundation-native-shell`
PR: #2

## Objective

Prepare the Apple heading sensor transport without changing the approved QiblaAstro compass mathematics. This is a native adapter phase, not a compass rewrite and not physical-device acceptance.

## Apple API choice

The native layer uses `CLLocationManager.startUpdatingHeading()` and exports `CLHeading.magneticHeading` plus `headingAccuracy` and the sample timestamp.

It intentionally does **not** export or use `CLHeading.trueHeading`. QiblaAstro already owns the magnetic-to-true conversion through the protected WMM2025 path; using Apple's true heading as a second correction authority would create two competing scientific paths.

Apple documentation also states that a negative `headingAccuracy` means the heading is invalid/unreliable. Such samples are therefore discarded before they cross the native bridge.

## Implemented data boundary

`CLLocationManager` → `HeadingService.swift` → `NativeBridge.swift` → `window.QiblaIOSNative` → custom event `qibla-ios-heading`.

Native payload:

- `source = core-location-magnetic`
- `magneticHeading`
- `accuracy`
- `timestamp`

No QT, WMM, Qibla, celestial, camera, or prayer calculation exists in Swift.

## Deliberate isolation

The new native stream is **not yet injected into the existing WebApp compass calculation**. This is deliberate.

The current WebApp compass path already consumes DeviceOrientation data and also uses beta/gamma information for leveling. Injecting a second active heading source before designing a unified sensor-source arbiter could create duplicate updates, race conditions, or different north conventions. The camera/astronomical pipeline also depends on carefully defined orientation semantics.

Therefore this phase exposes a tested transport boundary only. Activation into the live compass will occur only after the motion/orientation adapter is defined and guarded.

## Protected compass freeze

During this phase, `WebApp/js/18-sky-bg.js` — which currently contains the approved device-compass/WMM integration — is frozen at Git blob:

`f9ca600d46aaa2bbe0d276b3fb77028d5649d7b4`

The iOS CI gate checks this blob hash. A native-heading change therefore fails the gate if that protected WebApp compass implementation changes incidentally.

## Files added or changed

- `QiblaAstroIOS/HeadingService.swift`
  - checks heading hardware availability;
  - streams magnetic heading only;
  - rejects negative/unreliable heading accuracy;
  - one-degree heading filter;
  - supports start/stop;
  - permits Apple's heading calibration UI.
- `QiblaAstroIOS/NativeBridge.swift`
  - separate `qiblaHeading` main-frame handler;
  - magnetic-only structured payload;
  - no scientific transformations.
- `QiblaAstroIOS/RootViewController.swift`
  - exposes `startHeading()` / `stopHeading()` to the WebApp boundary;
  - dispatches isolated success/error custom events.
- `QiblaAstroIOS.xcodeproj/project.pbxproj`
  - compiles `HeadingService.swift` in the iOS target.
- `WebApp/tests/ios-native-heading-boundary.test.js`
  - proves magnetic-only boundary and absence of native `trueHeading` use.
- `.github/workflows/ios-foundation-gate.yml`
  - executes the heading boundary gate and protects the existing compass blob.

## Permission ordering

The heading adapter does not create a second surprise location permission prompt. If location authorization is still `notDetermined`, heading start fails and the normal trusted-location onboarding remains responsible for asking the user for When-In-Use authorization.

## Physical iPhone acceptance — pending

Heading hardware is not available in iOS Simulator. A real iPhone is required before the native heading boundary can be accepted for production.

Required future tests:

1. Location already authorized, start heading: receive finite magnetic heading and nonnegative accuracy.
2. Rotate slowly through north/east/south/west: verify monotonic/continuous changes and wrap-around near 359°→0°.
3. Bring device near a magnetic interference source: verify headingAccuracy worsens or invalid samples are withheld.
4. Trigger/observe Apple calibration behavior when requested by the system.
5. Background/foreground cycle: no duplicate heading streams.
6. Stop command: native updates cease.
7. Relaunch: heading does not silently bypass trusted-location permission flow.
8. Once unified motion routing is implemented, compare native magnetic heading + existing WMM2025 result against the existing browser path without changing QT.

## Current status

Native magnetic-heading transport: **IMPLEMENTED / STATIC-GATED**.

Existing WebApp compass/WMM mathematics: **UNCHANGED / HASH-FROZEN**.

Physical iPhone heading acceptance: **PENDING**.

Live native-heading injection into the compass: **DEFERRED intentionally until unified motion/orientation routing is designed and tested**.

Camera integration: **NOT STARTED**.
