'use strict';

const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8');
}

function assert(name, condition) {
  if (!condition) throw new Error('FAIL: ' + name);
  console.log('PASS:', name);
}

const rootController = read('QiblaAstroIOS/RootViewController.swift');
const observationBridge = read('WebApp/js/astronomical-observation-bridge.js');
const session = read('WebApp/js/astronomical-verification-session.js');

assert('WebKit media-capture delegate is implemented',
  rootController.includes('requestMediaCapturePermissionFor origin'));
assert('camera grant is limited by bundled-main-frame gate',
  rootController.includes('guard isTrustedBundledMainFrame(frame)') &&
  rootController.includes('case .camera:') &&
  rootController.includes('decisionHandler(.grant)'));
assert('microphone-only requests are denied',
  rootController.includes('case .microphone, .cameraAndMicrophone:') &&
  rootController.includes('Qibla verification never requires microphone access'));
assert('untrusted or subframe capture requests are denied',
  rootController.includes('guard frame.isMainFrame') &&
  rootController.includes('url.isFileURL') &&
  rootController.includes('decisionHandler(.deny)'));
assert('WebKit motion permission is limited to bundled main frame',
  rootController.includes('requestDeviceOrientationAndMotionPermissionFor origin') &&
  rootController.includes('decisionHandler(isTrustedBundledMainFrame(frame) ? .grant : .deny)'));

assert('astronomical camera requests video without audio',
  /audio:\s*false/.test(observationBridge));
assert('astronomical camera requests environment-facing video',
  observationBridge.includes("facingMode: { ideal: config.facingMode }") &&
  observationBridge.includes("facingMode: 'environment'"));
assert('existing production bridge remains getUserMedia based',
  observationBridge.includes('navigator.mediaDevices.getUserMedia(cameraConstraints(this.options))'));
assert('existing detector/solver pipeline still reads frames from the video element',
  observationBridge.includes('this.context.drawImage(this.video, 0, 0, width, height)') &&
  observationBridge.includes('Detector.analyzeFrame(') &&
  observationBridge.includes('Solver.solveObservation({'));
assert('production session still owns astronomical verification',
  session.includes('QiblaAstro — Astronomical Verification Session Controller'));

console.log('iOS WebKit camera permission boundary: PASS');
