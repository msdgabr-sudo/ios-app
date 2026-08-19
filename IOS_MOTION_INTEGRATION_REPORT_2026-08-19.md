# QiblaAstro iOS — Native Motion Integration Report

Date: 2026-08-19
Branch: `ios/foundation-native-shell`
PR: #2
Baseline WebApp: `q-app-an/main@cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`

## Scope

This phase adds a native iOS device-motion transport and a unified **sensor-source boundary** only. It does not alter QT/Qibla mathematics, WMM2025 mathematics, the existing WebApp digital-compass equations, astronomical solver/camera math, prayer equations, or Trusted GNSS semantics.

## Apple reference-frame decision

Core Motion uses `CMAttitudeReferenceFrame.xMagneticNorthZVertical`.

Reason: QiblaAstro already owns the magnetic-to-true correction through WMM2025. Using Apple's `xTrueNorthZVertical` would introduce a second true-north correction authority and could produce mismatched or double-corrected headings. The native layer therefore remains magnetic-north referenced.

## Implemented native path

`CMMotionManager` → `MotionService.swift` → `NativeBridge.swift` → `window.QiblaIOSNative` → `qibla-ios-motion`

A second boundary fuses only **fresh** native magnetic heading + motion samples and emits:

`qibla-ios-orientation`

The fused event contains:

- magnetic heading from Core Location;
- heading accuracy;
- Core Motion attitude (roll, pitch, yaw and quaternion);
- gravity vector;
- rotation rate;
- user acceleration;
- magnetic-north reference-frame identity;
- independent heading and motion timestamps.

The fusion window is 1000 ms. Wrong source markers, wrong reference frame, invalid heading range, invalid accuracy, missing motion vectors, or stale samples are not emitted as a unified orientation sample.

## Lifecycle / power controls

- Core Motion runs at 30 Hz, adequate for smooth orientation without requesting unnecessary high-frequency raw sensors.
- `stopDeviceMotionUpdates()` is called when orientation is stopped.
- Heading and motion are both stopped when the app enters the background or terminates.
- Sensors are also stopped if the WKWebView content process terminates before the bundled WebApp is reloaded.

## Files changed

- `QiblaAstroIOS/MotionService.swift`
- `QiblaAstroIOS/NativeBridge.swift`
- `QiblaAstroIOS/RootViewController.swift`
- `QiblaAstroIOS.xcodeproj/project.pbxproj`
- `WebApp/tests/ios-native-motion-boundary.test.js`
- `.github/workflows/ios-foundation-gate.yml`

## Protection state

`WebApp/js/18-sky-bg.js`, which currently contains the legacy WebApp device-compass implementation, remains hash-frozen at:

`f9ca600d46aaa2bbe0d276b3fb77028d5649d7b4`

Therefore this phase cannot silently alter the existing Android/Web compass behavior.

## Current acceptance state

- Android/Web regression after iOS GNSS changes: **PASS** (real Android phone, user-reported).
- Native Core Location physical iPhone: **PENDING** because no iPhone is currently available.
- Native magnetic heading physical iPhone: **PENDING**.
- Native Core Motion physical iPhone: **PENDING**.
- Xcode CI: definition updated; a visible green run is still required before release acceptance.

## Deliberate non-action

The new `qibla-ios-orientation` event is **not yet injected into the existing digital-compass variables or astronomical camera pipeline**. This is deliberate. The next engineering step must create one audited adapter from this fused native event into the existing compass input contract, then prove that Android/Web behavior remains byte-for-byte or regression-equivalent before camera work begins.

Camera integration has not started.
