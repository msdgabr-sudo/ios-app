'use strict';

// QiblaAstro — Astronomical Observation Bridge Tests
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.

var assert = require('assert');
var BridgeModule = require('../js/astronomical-observation-bridge.js');

var passed = 0;
var failed = 0;

function test(name, fn) {
    try {
        fn();
        passed += 1;
        console.log('PASS:', name);
    } catch (error) {
        failed += 1;
        console.error('FAIL:', name);
        console.error(error && error.stack ? error.stack : error);
    }
}

test('module loads without browser globals', function () {
    assert.strictEqual(typeof BridgeModule.AstronomicalObservationBridge, 'function');
});

test('camera constraints request rear camera without audio', function () {
    var constraints = BridgeModule.cameraConstraints({
        facingMode: 'environment', width: 1280, height: 720
    });
    assert.strictEqual(constraints.audio, false);
    assert.strictEqual(constraints.video.facingMode.ideal, 'environment');
    assert.strictEqual(constraints.video.width.ideal, 1280);
    assert.strictEqual(constraints.video.height.ideal, 720);
});

test('bridge constructor remains isolated and inactive', function () {
    var bridge = new BridgeModule.AstronomicalObservationBridge({
        locationProvider: function () { return { latitude: 30, longitude: 31 }; },
        celestialProvider: function () { return { azimuthDeg: 90, altitudeDeg: 30 }; }
    });
    assert.strictEqual(bridge.running, false);
    assert.strictEqual(bridge.stream, null);
    assert.strictEqual(bridge.timer, null);
});

test('providers can be replaced independently', function () {
    var bridge = new BridgeModule.AstronomicalObservationBridge({});
    var location = function () { return { latitude: 1, longitude: 2 }; };
    var celestial = function () { return { azimuthDeg: 3, altitudeDeg: 4 }; };
    bridge.setProviders({ locationProvider: location, celestialProvider: celestial });
    assert.strictEqual(bridge.locationProvider, location);
    assert.strictEqual(bridge.celestialProvider, celestial);
});

test('invalid provider is rejected', function () {
    var bridge = new BridgeModule.AstronomicalObservationBridge({});
    assert.throws(function () {
        bridge.setProviders({ locationProvider: 12 });
    }, TypeError);
});

test('stop is safe before camera startup', function () {
    var bridge = new BridgeModule.AstronomicalObservationBridge({});
    bridge.stop();
    assert.strictEqual(bridge.running, false);
    assert.strictEqual(bridge.stream, null);
});

console.log('\nAstronomical observation bridge summary:');
console.log('Passed:', passed);
console.log('Failed:', failed);

if (failed > 0) {
    process.exitCode = 1;
} else {
    console.log('RESULT: SUCCESS');
}
