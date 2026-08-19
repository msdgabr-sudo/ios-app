# QiblaAstro iOS — Camera Integration Report

Date: 2026-08-19
Branch: `ios/foundation-native-shell`
PR: #2
Baseline WebApp: `q-app-an/main@cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`

## Scope of this phase

This phase enables the existing production astronomical verification camera pipeline inside the native iOS `WKWebView` without creating a second camera solver, changing camera geometry, changing QT, changing WMM2025, or changing astronomical-verification mathematics.

The production WebApp camera path remains:

`navigator.mediaDevices.getUserMedia(video only)` → `<video>` → canvas frame → celestial detector → gravity reference → astronomical solver → Qibla alignment reticle → verification record.

The legacy `camera-engine.js` remains retired and is not restored.

## Apple/WebKit integration decision

The bundled iOS app already owns a `WKWebView`. Apple exposes `WKUIDelegate` permission callbacks specifically for camera/microphone media capture and for orientation/motion access. The iOS shell now implements those callbacks with least privilege:

- Camera is granted only when the request comes from the bundled `WebApp` main frame loaded from a local file URL.
- Microphone requests are always denied.
- Combined camera+microphone requests are always denied.
- Remote pages and subframes are denied.
- Device orientation/motion access is granted only to the same bundled local main frame because the existing astronomical gravity reference consumes DeviceMotion.
- `NSCameraUsageDescription` remains required and present.
- No `NSMicrophoneUsageDescription` is added because verification does not need audio.

This preserves one camera-acquisition path rather than adding a parallel AVFoundation frame pipeline that could differ from the already-tested WebApp detector/solver semantics.

## Protected camera/scientific files

The CI gate now freezes the following files at the verified iOS baseline while this permission integration is performed:

- `WebApp/js/astronomical-observation-bridge.js` → `1db4f3e4e3b79ae552ee7eaef77272bbfe20c2e5`
- `WebApp/js/astronomical-solver.js` → `b17a4ac09c1a84e640e5007c2d69aaf8b542a65b`
- `WebApp/js/astronomical-verification-session.js` → `3f144a46c0488a8de2f1cb007d400b35fe44ba40`
- `WebApp/js/camera-pose.js` → `519e4773582ddc4bd6d0b4c3c2ffd79073bb1890`
- `WebApp/js/camera-projection.js` → `0ccdd9de84bb11ab41afe01b8b7eca91c1c62384`
- `WebApp/js/gravity-reference.js` → `b4aa8dffd7ba3f0e11a0dba54ad67032bff0b2b7`

Therefore this phase cannot silently alter the detector/solver/camera-axis mathematics.

## Files changed

- `QiblaAstroIOS/RootViewController.swift`
- `WebApp/tests/ios-camera-webkit-boundary.test.js`
- `.github/workflows/ios-foundation-gate.yml`
- `IOS_CAMERA_INTEGRATION_REPORT_2026-08-19.md`

## Automated acceptance

The new test `WebApp/tests/ios-camera-webkit-boundary.test.js` proves:

- the WebKit media-capture delegate exists;
- camera permission is gated to the bundled main frame;
- microphone and camera+microphone are denied;
- remote/subframe requests are denied;
- DeviceMotion permission is gated to the bundled main frame;
- the production observation bridge still requests `audio:false`;
- it still requests the environment-facing camera;
- it still uses `getUserMedia` and the existing video→canvas→detector→solver pipeline;
- the production astronomical verification session remains the owner of the workflow.

The Xcode gate also verifies that the final built app includes `NSCameraUsageDescription` and does not include `NSMicrophoneUsageDescription`.

GitHub Actions **iOS Foundation Gate** run `32205501584` completed **SUCCESS** with the camera-stage source and camera boundary test present. This run supersedes the earlier orientation-stage run as the current automated evidence for the branch. It includes protected scientific regressions, iOS GNSS/heading/motion/orientation boundaries, the new least-privilege WebKit camera boundary, Xcode 26.6 simulator compilation, and built-app contract inspection.

## Physical-iPhone acceptance still required

No simulator or Android test can prove iPhone camera behavior. Before App Store/TestFlight acceptance, a signed physical iPhone must verify at minimum:

1. Fresh install → open astronomical verification → system camera permission appears once.
2. Grant camera → rear/environment camera preview becomes live.
3. Deny camera → flow fails safely with no crash and no fake verification result.
4. Settings → re-enable camera → retry works without reinstall.
5. No microphone permission prompt appears at any point.
6. Sun observation in safe conditions produces stable detection and does not modify the computational Qibla card.
7. Moon observation produces stable detection and a fresh astronomical record.
8. Refresh/relaunch invalidates stale astronomical verification as required by the existing session/store contract.
9. Closing/cancelling verification releases camera capture.
10. Backgrounding the app does not leave transient sensor work active.

## Deliberate non-actions

- No native AVFoundation frame pipeline was introduced.
- No `AVCaptureVideoDataOutput` orientation transform was guessed.
- No iPhone camera-axis transform was guessed.
- No horizontal FOV constant was changed.
- No camera pose/projection/solver equation was changed.
- No QT/WMM2025/Trusted-GNSS/prayer equation was changed.

A future physical-device finding may justify a narrowly-scoped camera calibration or camera-capability adapter, but only after evidence from an actual iPhone. Until then, camera geometry remains frozen rather than being altered speculatively.
