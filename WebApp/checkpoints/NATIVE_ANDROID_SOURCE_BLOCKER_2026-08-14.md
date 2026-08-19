# Native Android Source Blocker — A2

Date: 2026-08-14
Branch: A2

## Requested stages
- H: Native Android notification translations via Android Resources.
- I: Widget Native translations plus secure data-source review.
- J/L: APK/AAB release candidate and final bundle gates.

## Repository audit
A recursive tree audit of branch A2 found no Android application source tree. In particular, A2 contains no:
- `AndroidManifest.xml`
- `build.gradle` / `build.gradle.kts`
- `settings.gradle` / `settings.gradle.kts`
- `app/src/main/...`
- Kotlin (`.kt`) application source
- Android resource `res/values/strings.xml`
- locale resource folders such as `values-en`, `values-fr`, `values-id`, `values-ur`
- AppWidget provider/source resources

The repository does contain Web/PWA/TWA-related metadata and workflows, but that is not a substitute for the native Android source that owns Notification Channels, `POST_NOTIFICATIONS`, Java/Kotlin `getString(...)`, Widget providers, package/signing configuration, and native Intents.

## Safety decision
Do NOT fabricate Android resources inside the Web/PWA tree and do NOT create a new Android wrapper from assumptions. Doing so could change the package ID, signing expectations, notification channels, deep links, or Widget data flow without the authoritative existing Android project.

## Status
- Stage H: BLOCKED pending authoritative Android project/source.
- Stage I: BLOCKED pending authoritative Android project/source. Widget may remain excluded from the release candidate if its secure native data source is not approved.
- Stage J/L: BLOCKED for a native release from this repository until the authoritative Android project is supplied or linked.

## Required input to unblock
Provide the current Android/TWA project used for the existing Play build, preserving its package ID and signing configuration. Once present, native strings and Widget/notification code can be audited and translated without altering Web JavaScript i18n.

This blocker does not require or permit changes to digital compass, astronomical verification, camera, solver, QT, WMM2025, or astronomical equations.
