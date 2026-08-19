# QiblaAstro iOS — Apple Release Engineering Baseline

Updated: 2026-08-19

This file is an engineering checklist, not permission to alter protected QiblaAstro scientific engines. Read `IOS_PORT_CONTRACT.md` first.

## 1. Current App Store build requirement

Apple requires iOS/iPadOS submissions uploaded on or after 2026-04-28 to be built with Xcode 26 or later using the iOS 26 SDK or later.

Primary source: https://developer.apple.com/news/upcoming-requirements/

The repository CI therefore selects Xcode 26.6 on a macOS 26 runner. The deployment target may remain lower than iOS 26; the submission SDK requirement and the minimum supported user OS are separate settings.

## 2. App Review: minimum functionality

Apple App Review Guideline 4.2 requires an app to provide features, content and UI beyond a repackaged website. QiblaAstro iOS must therefore retain native platform integration and must not ship as a passive website wrapper.

Primary source: https://developer.apple.com/app-store/review/guidelines/

Native value planned for the iOS product includes trusted Core Location integration, device heading/motion integration, camera permission/control for astronomical verification, contextual notifications, local/offline application assets and later WidgetKit integration. These adapters must not duplicate scientific calculations.

## 3. Location policy

Use `When In Use` authorization unless a separately reviewed product requirement proves background location is necessary. Apple identifies When In Use as the preferred authorization level for privacy and battery impact.

Required key: `NSLocationWhenInUseUsageDescription`.

Primary source: https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services

QiblaAstro rule: Apple Core Location supplies trusted device coordinates only. It does not calculate QT, WMM2025, prayer times or astronomical results. No IP location or default city may become a fallback for protected calculations.

## 4. Camera policy

Camera access must be requested only in the astronomical-verification context. `NSCameraUsageDescription` is present before any camera API is activated. Microphone permission is not requested unless a future feature genuinely needs microphone capture.

Primary source: https://developer.apple.com/documentation/avfoundation/avcapturedevice/requestaccess(for:completionhandler:)

## 5. Motion/orientation policy

Motion services must be capability-checked before use. `NSMotionUsageDescription` is included for the device-orientation/motion feature set. Native motion/heading data may feed the existing protected compass input contract but must not introduce a second compass/Qibla equation.

Primary source: https://developer.apple.com/documentation/coremotion/

## 6. Notifications policy

Notification permission must be requested in context, not as an unrelated launch-time prompt. The app must check current notification settings before scheduling local notifications.

Primary source: https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications

## 7. WKWebView boundary

Bundled application content is loaded with `WKWebView.loadFileURL(_:allowingReadAccessTo:)`, restricting file read access to the bundled WebApp directory. JavaScript-to-native messages use named `WKScriptMessageHandler` channels and are accepted only from the main frame with validated message shape.

Primary sources:
- https://developer.apple.com/documentation/webkit/wkwebview/loadfileurl(_:allowingreadaccessto:)
- https://developer.apple.com/documentation/webkit/wkscriptmessagehandler

External main-frame URLs are handed to the system instead of turning the application shell into an unrestricted browser.

## 8. Privacy manifest and App Store privacy

The app contains a first-party `PrivacyInfo.xcprivacy`. Required-reason APIs must be declared if later code or SDKs uses them. Third-party SDK privacy manifests must also be reviewed before release.

Apple requires a public privacy-policy URL for iOS apps and accurate App Store Connect privacy answers, including third-party partners. Data used only on device and never transmitted off device is not considered collected for App Privacy disclosure.

Primary sources:
- https://developer.apple.com/news/upcoming-requirements/
- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy

## 9. Advertising/tracking boundary

The current imported release is ad-free. Do not add an advertising SDK, tracking permission, IDFA access or App Tracking Transparency prompt as incidental iOS-port work. Advertising is a separate product/privacy task requiring SDK review, privacy-label updates and ATT analysis if tracking as defined by Apple occurs.

## 10. Release gates

Before TestFlight:

1. Xcode 26 CI build must pass with no signing secrets in Git.
2. Protected Qibla/WMM/prayer/astronomy regression tests must remain green.
3. The built app must contain the local WebApp and privacy manifest.
4. Location, heading/motion and camera integrations must each receive physical-iPhone acceptance testing.
5. Permission denial, reduced accuracy, services-off and later-settings-change paths must be tested.
6. App launch must remain functional without analytics/network dependencies where the feature is designed to work offline.
7. No App Store submission until the final icon, privacy policy, screenshots, age rating, App Privacy answers, signing and TestFlight acceptance are complete.
