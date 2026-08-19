'use strict';
const fs=require('fs');
const assert=require('assert');

const heading=fs.readFileSync('../QiblaAstroIOS/HeadingService.swift','utf8');
const bridge=fs.readFileSync('../QiblaAstroIOS/NativeBridge.swift','utf8');
const root=fs.readFileSync('../QiblaAstroIOS/RootViewController.swift','utf8');

// Apple layer must supply sensor data only. WMM2025 remains the sole
// magnetic->true correction in the existing WebApp compass path.
assert(heading.includes('newHeading.magneticHeading'));
assert(!heading.includes('newHeading.trueHeading'), 'native iOS must not bypass WebApp WMM2025 with Core Location trueHeading');
assert(heading.includes('newHeading.headingAccuracy >= 0'));
assert(heading.includes('CLLocationManager.headingAvailable()'));
assert(heading.includes('manager.headingFilter = 1.0'));
assert(heading.includes('manager.startUpdatingHeading()'));
assert(heading.includes('manager.stopUpdatingHeading()'));
assert(heading.includes('locationManagerShouldDisplayHeadingCalibration'));

assert(bridge.includes('source": "core-location-magnetic"'));
assert(bridge.includes('"magneticHeading": sample.magneticHeading'));
assert(!bridge.includes('"trueHeading"'));
assert(root.includes('qiblaHeading'));
assert(root.includes("CustomEvent('qibla-ios-heading'"));
assert(root.includes('startHeading: function()'));
assert(root.includes('stopHeading: function()'));

console.log('iOS native heading boundary gate: PASS');
console.log('Verified: Core Location exports magnetic heading only; existing WebApp/WMM compass mathematics remain authoritative.');
