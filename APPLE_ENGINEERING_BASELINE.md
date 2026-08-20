# QiblaAstro iOS — Apple Engineering Baseline

Date: 2026-08-19
Source baseline: `msdgabr-sudo/q-app-an@cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`

## Architecture decision

QiblaAstro for iOS uses a native Swift/SwiftUI application shell with WebKit for the existing presentation/runtime assets and narrowly-scoped native bridges for Apple platform capabilities. The iOS layer must not reimplement or silently alter protected Qibla, WMM2025, compass, astronomical verification/camera-solving, prayer-time, or trusted-GNSS mathematics.

## Apple requirements adopted

1. The app must provide app-like functionality and not be submitted as a trivial repackaged website. Native iOS integration is therefore part of the product architecture, not an App Store afterthought.
2. Location is requested only when a feature requires it, using `When In Use` authorization by default. No `Always` authorization is requested in the foundation.
3. `NSLocationWhenInUseUsageDescription` and `NSCameraUsageDescription` are required and must describe actual user-facing purposes.
4. Permissions are contextual. Denial must be handled without loops or coercion and with a path to Settings where appropriate.
5. App privacy disclosures and the public privacy policy must match the actual shipped behavior, including analytics and any future advertising SDK.
6. ATT must not be added unless the shipped app actually performs tracking as Apple defines it.
7. External web navigation is not treated as an unrestricted in-app browser. Trusted app content remains in the app; ordinary external links leave the app.

## Current native foundation

- SwiftUI application entry point.
- Hardened `WKWebView` host for the bundled `WebApp` baseline.
- Explicit JavaScript/native bridge with an allowlisted command surface.
- Core Location bridge using one-shot, foreground, best-accuracy location requests.
- Native payload contains only latitude, longitude, horizontal accuracy, and timestamp.
- No native bridge writes QT, WMM, prayer, compass, or astronomical result state.
- Camera usage description exists, but scientific camera integration is deliberately not reimplemented at this stage.

## Required gates before TestFlight

- Clean Xcode build with warnings reviewed.
- Unit tests green.
- Protected scientific regression suite run against the embedded WebApp baseline.
- Physical iPhone acceptance for first launch, permission denied/granted/revoked states, precise/reduced location, GPS unavailable, compass/motion behavior, camera authorization, real Sun/Moon verification, notifications, audio, offline/relaunch behavior.
- App Privacy and privacy-policy audit against GA4/third-party network behavior.
- Accessibility, Dynamic Type where native UI exists, RTL/Arabic, VoiceOver, dark appearance, safe-area, rotation policy, and iPhone size matrix review.
- No signing keys, App Store Connect keys, certificates, provisioning profiles, or private credentials in Git.
