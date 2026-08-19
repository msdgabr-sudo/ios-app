'use strict';
const fs=require('fs');
const assert=require('assert');

const motion=fs.readFileSync('../QiblaAstroIOS/MotionService.swift','utf8');
const bridge=fs.readFileSync('../QiblaAstroIOS/NativeBridge.swift','utf8');
const root=fs.readFileSync('../QiblaAstroIOS/RootViewController.swift','utf8');
const project=fs.readFileSync('../QiblaAstroIOS.xcodeproj/project.pbxproj','utf8');

// Core Motion is a transport/reference-frame provider only. It must not
// introduce Apple's true-north correction because WMM2025 remains authoritative.
assert(motion.includes('import CoreMotion'));
assert(motion.includes('manager.isDeviceMotionAvailable'));
assert(motion.includes('availableAttitudeReferenceFrames()'));
assert(motion.includes('.xMagneticNorthZVertical'));
assert(motion.includes('startDeviceMotionUpdates(using: .xMagneticNorthZVertical'));
assert(motion.includes('manager.stopDeviceMotionUpdates()'));
assert(motion.includes('manager.deviceMotionUpdateInterval = 1.0 / 30.0'));
assert(!motion.includes('xTrueNorthZVertical'), 'native motion must not create a second magnetic->true correction path');

assert(bridge.includes('static let motionHandlerName = "qiblaMotion"'));
assert(bridge.includes('source": "core-motion-magnetic-north"'));
assert(bridge.includes('referenceFrame": "xMagneticNorthZVertical"'));
assert(bridge.includes('"quaternion"'));
assert(bridge.includes('"gravity"'));
assert(bridge.includes('"rotationRate"'));
assert(bridge.includes('stopTransientSensors()'));

assert(root.includes('controller.add(bridge, name: NativeBridge.motionHandlerName)'));
assert(root.includes('startMotion: function()'));
assert(root.includes('stopMotion: function()'));
assert(root.includes('startOrientation: function()'));
assert(root.includes("CustomEvent('qibla-ios-motion'"));
assert(root.includes("CustomEvent('qibla-ios-orientation'"));
assert(root.includes("latestHeading.source !== 'core-location-magnetic'"));
assert(root.includes("latestMotion.source !== 'core-motion-magnetic-north'"));
assert(root.includes("latestMotion.referenceFrame !== 'xMagneticNorthZVertical'"));
assert(root.includes('maximumFusionAgeMs = 1000'));
assert(root.includes('UIApplication.didEnterBackgroundNotification'));
assert(root.includes('bridge.stopTransientSensors()'));

assert(project.includes('MotionService.swift in Sources'));

console.log('iOS native motion boundary gate: PASS');
console.log('Verified: Core Motion is magnetic-north referenced, fused only with fresh magnetic heading, and does not bypass WMM2025.');
