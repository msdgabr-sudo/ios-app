# QiblaAstro iOS — Native Motion & Orientation Adapter Report

Date: 2026-08-19
Branch: `ios/foundation-native-shell`
PR: #2
Baseline WebApp: `q-app-an/main@cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`

## Scope

This phase adds native iOS device-motion transport, a unified sensor-source boundary, and one audited iOS-only adapter into the **existing** WebApp compass input contract. It does not alter QT/Qibla mathematics, WMM2025 mathematics, the existing WebApp digital-compass equations, astronomical solver/camera math, prayer equations, or Trusted GNSS semantics.

## Apple reference-frame decision

Core Motion uses `CMAttitudeReferenceFrame.xMagneticNorthZVertical`.

Reason: QiblaAstro already owns the magnetic-to-true correction through WMM2025. Using Apple's `xTrueNorthZVertical` or `CLHeading.trueHeading` would introduce a second true-north correction authority and could produce mismatched or double-corrected headings. The native layer therefore remains magnetic-north referenced.

## Implemented native path

`CMMotionManager` → `MotionService.swift` → `NativeBridge.swift` → `window.QiblaIOSNative` → `qibla-ios-motion`

A second boundary fuses only **fresh** native magnetic heading + motion samples and emits:

`qibla-ios-orientation`

The fused event contains magnetic heading from Core Location, heading accuracy, Core Motion attitude/quaternion, gravity, rotation rate, user acceleration, magnetic-north reference-frame identity, and independent heading/motion timestamps.

The fusion window is 1000 ms. Wrong source markers, wrong reference frame, invalid heading range, invalid accuracy, missing motion vectors, or stale samples are not emitted as a unified orientation sample.

## Audited iOS orientation adapter

The adapter is implemented in `WebApp/js/ios-orientation-adapter.js` and is loaded only by the native iOS shell. Public Web/Android startup remains untouched.

The adapter accepts only `qibla-ios-orientation` samples marked:

- `source: ios-native-sensors`;
- `referenceFrame: xMagneticNorthZVertical`;
- finite magnetic heading in `[0, 360)`;
- non-negative heading accuracy;
- fresh heading and motion timestamps;
- present attitude quaternion and gravity data.

For the digital compass, the adapter does **not** derive a new true heading. It converts the native magnetic heading into the input shape already expected by the legacy magnetic branch:

`alpha = 360 - magneticHeading`, `absolute = false`

The existing compass path then performs its existing magnetic-to-true conversion using WMM2025. Therefore WMM2025 remains the sole magnetic-to-true authority and is applied exactly once.

Once the native iOS source is active, anonymous browser `DeviceOrientation` events are blocked from entering the legacy compass handler as a competing second heading source. The adapter also stops/restarts the native orientation stream across page visibility lifecycle transitions.

No Core Motion yaw/roll/pitch values are injected into camera math or astronomical verification in this phase. No unverified iPhone-axis transformation has been introduced.

## Lifecycle / power controls

- Core Motion runs at 30 Hz.
- `stopDeviceMotionUpdates()` is called when orientation is stopped.
- Heading and motion are stopped when the app enters the background or terminates.
- Sensors are stopped if the WKWebView content process terminates before the bundled WebApp is reloaded.
- The JS adapter stops on hidden/pagehide and restarts on foreground visibility.
- Actor-isolated sensor/WebKit cleanup uses explicit lifecycle paths rather than `deinit`.

## Files changed

- `QiblaAstroIOS/MotionService.swift`
- `QiblaAstroIOS/NativeBridge.swift`
- `QiblaAstroIOS/RootViewController.swift`
- `QiblaAstroIOS/LocationService.swift`
- `QiblaAstroIOS/HeadingService.swift`
- `QiblaAstroIOS.xcodeproj/project.pbxproj`
- `WebApp/js/ios-orientation-adapter.js`
- `WebApp/tests/ios-native-motion-boundary.test.js`
- `WebApp/tests/ios-orientation-adapter.test.js`
- `.github/workflows/ios-foundation-gate.yml`

## Protection state

`WebApp/js/18-sky-bg.js`, which contains the protected legacy WebApp device-compass declaration, remains hash-frozen at:

`f9ca600d46aaa2bbe0d276b3fb77028d5649d7b4`

No protected scientific-engine file was changed. Android/Web compass behavior is not switched to the native adapter because that adapter is loaded from the iOS native bootstrap only.

## Automated acceptance evidence

GitHub Actions **iOS Foundation Gate** run `32204997532` completed **SUCCESS** on macOS 26 / Xcode 26.6 after the orientation adapter was integrated.

The successful run proved:

- source-baseline provenance and protected compass hash;
- protected scientific-core integrity;
- WMM2025 official vectors, global coverage and runtime integration;
- global prayer calculation/runtime tests;
- astronomical solver integration and semantic separation;
- Qibla card runtime contract;
- Core Location → Trusted GNSS contract;
- magnetic-only native heading boundary;
- magnetic-north Core Motion boundary;
- **iOS orientation adapter → existing magnetic compass branch → WMM2025 exactly once**;
- Apple plist/privacy/native sensor boundary checks;
- Xcode 26.6 unsigned iPhone Simulator compilation;
- built-app bundle contract including `WebApp/js/ios-orientation-adapter.js`.

The previous native-foundation run `32204470610` also completed SUCCESS before adapter integration. Run `32204997532` supersedes it for the current orientation-adapter acceptance state.

## Current acceptance state

- Android/Web regression after iOS GNSS changes: **PASS** (real Android phone, user-reported).
- iOS native foundation automated gates: **PASS**.
- iOS orientation adapter automated gate: **PASS**.
- Xcode 26.6 iPhone Simulator build and bundle inspection: **PASS** — run `32204997532`.
- Native Core Location physical iPhone: **PENDING** because no physical iPhone acceptance has been executed.
- Native magnetic heading physical iPhone: **PENDING**.
- Native Core Motion/orientation physical iPhone: **PENDING**.

## Deliberate non-action / next boundary

The digital-compass input adapter now exists and is automatically verified, but physical iPhone axis/sensor acceptance is still required before claiming device-level acceptance.

The astronomical camera pipeline remains isolated from the native orientation adapter. Camera integration has **not** started. Any future camera work must introduce a separately audited camera-orientation contract rather than reuse compass assumptions or guess iPhone camera axes.
