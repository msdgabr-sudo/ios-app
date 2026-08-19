'use strict';

// QiblaAstro — Astronomical Solver Integration Tests
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.

var assert = require('assert');

var Frames = require('../js/coordinate-frames.js');
var World = require('../js/world-orientation.js');
var Projection = require('../js/camera-projection.js');
var CameraPose = require('../js/camera-pose.js');
var Gravity = require('../js/gravity-reference.js');
var Qibla = require('../js/astro-qibla-engine.js');
var Quality = require('../js/verification-quality.js');
var Detector = require('../js/celestial-detector.js');
var Solver = require('../js/astronomical-solver.js');

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

function near(actual, expected, tolerance) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        'Expected ' + actual + ' to be within ' + tolerance + ' of ' + expected
    );
}

function nominalObservation(overrides) {
    var now = 100000;
    var altitudeDeg = 30;
    var altitudeRad = altitudeDeg * Math.PI / 180;
    var base = {
        now: now,
        location: { latitude: 30.0444, longitude: 31.2357 },
        celestial: {
            body: 'sun',
            azimuthDeg: 90,
            altitudeDeg: altitudeDeg,
            timestamp: now - 30
        },
        camera: {
            width: 1000,
            height: 750,
            horizontalFovDeg: 65
        },
        detection: {
            x: 500,
            y: 375,
            confidence: 0.96,
            frameCount: 18,
            saturationRatio: 0.70,
            circularity: 0.90,
            timestamp: now - 20
        },
        gravity: {
            downCamera: {
                x: 0,
                y: -Math.cos(altitudeRad),
                z: -Math.sin(altitudeRad)
            },
            quality: 0.96,
            directionSpreadDeg: 0.4,
            timestamp: now - 10
        }
    };

    if (!overrides) return base;
    Object.keys(overrides).forEach(function (key) {
        if (overrides[key] && typeof overrides[key] === 'object' &&
            !Array.isArray(overrides[key]) && base[key] && typeof base[key] === 'object') {
            base[key] = Object.assign({}, base[key], overrides[key]);
        } else {
            base[key] = overrides[key];
        }
    });
    return base;
}

[
    ['coordinate-frames self tests', Frames],
    ['world-orientation self tests', World],
    ['camera-projection self tests', Projection],
    ['camera-pose self tests', CameraPose],
    ['gravity-reference self tests', Gravity],
    ['astro-qibla-engine self tests', Qibla],
    ['verification-quality self tests', Quality],
    ['celestial-detector self tests', Detector],
    ['astronomical-solver self tests', Solver]
].forEach(function (entry) {
    test(entry[0], function () {
        assert.strictEqual(typeof entry[1].runSelfTests, 'function');
        var result = entry[1].runSelfTests({ log: function () {}, error: function () {} });
        assert.strictEqual(result.success, true, JSON.stringify(result.failures || []));
        assert.strictEqual(result.failed, 0);
    });
});

test('nominal observation is accepted and recovers east heading', function () {
    var result = Solver.solveObservation(nominalObservation());
    assert.strictEqual(result.accepted, true);
    near(result.trueCameraHeadingDeg, 90, 1e-5);
    assert.ok(result.qibla.qiblaBearingDeg > 135 && result.qibla.qiblaBearingDeg < 137.5);
    assert.strictEqual(Frames.isOrthonormalMatrix(result.pose.rotationCameraToWorld), true);
});

test('pipeline output is independent from QT and magnetic heading fields', function () {
    var input = nominalObservation({ QT: 5, deviceHeading: 275, magneticDeclination: 12 });
    var result = Solver.solveObservation(input);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'QT'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'deviceHeading'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'magneticDeclination'), false);
    near(result.trueCameraHeadingDeg, 90, 1e-5);
});

test('near-edge celestial centroid is rejected by the quality gate', function () {
    var result = Solver.solveObservation(nominalObservation({
        detection: { x: 10, y: 375 }
    }));
    assert.strictEqual(result.accepted, false);
    assert.ok(result.quality.reasons.some(function (reason) {
        return reason.code === 'BODY_TOO_CLOSE_TO_EDGE';
    }));
});

test('unstable gravity observation is rejected', function () {
    var result = Solver.solveObservation(nominalObservation({
        gravity: { directionSpreadDeg: 7.5 }
    }));
    assert.strictEqual(result.accepted, false);
    assert.ok(result.quality.reasons.some(function (reason) {
        return reason.code === 'DEVICE_NOT_STABLE';
    }));
});

test('stale celestial detection is rejected', function () {
    var result = Solver.solveObservation(nominalObservation({
        detection: { timestamp: 97000 }
    }));
    assert.strictEqual(result.accepted, false);
    assert.ok(result.quality.reasons.some(function (reason) {
        return reason.code === 'FRAME_STALE';
    }));
});

test('invalid centroid outside the frame throws before solving', function () {
    assert.throws(function () {
        Solver.solveObservation(nominalObservation({
            detection: { x: -1, y: 375 }
        }));
    }, RangeError);
});

test('known projection round trip preserves a non-central observation', function () {
    var intrinsics = Projection.intrinsicsFromFov({
        width: 1280,
        height: 720,
        horizontalFovDeg: 65
    });
    var ray = Projection.pixelToCameraRay(760, 290, intrinsics);
    var pixel = Projection.cameraRayToPixel(ray, intrinsics);
    near(pixel.u, 760, 1e-6);
    near(pixel.v, 290, 1e-6);
});

console.log('\nAstronomical solver integration summary:');
console.log('Passed:', passed);
console.log('Failed:', failed);

if (failed > 0) {
    process.exitCode = 1;
} else {
    console.log('RESULT: SUCCESS');
}
