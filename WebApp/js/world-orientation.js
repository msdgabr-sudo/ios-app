// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — World Orientation
// Converts astronomical horizontal coordinates to the local ENU world frame.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    var frames = null;

    if (typeof module === 'object' && module.exports) {
        frames = require('./coordinate-frames.js');
        module.exports = factory(frames);
        return;
    }

    frames = root && root.QiblaCoordinateFrames;
    if (!frames) {
        throw new Error('QiblaWorldOrientation requires QiblaCoordinateFrames.');
    }

    root.QiblaWorldOrientation = factory(frames);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Frames) {
    'use strict';

    var DEG_TO_RAD = Math.PI / 180;
    var RAD_TO_DEG = 180 / Math.PI;
    var WORLD_UP = Object.freeze({ x: 0, y: 0, z: 1 });
    var WORLD_NORTH = Object.freeze({ x: 0, y: 1, z: 0 });
    var WORLD_EAST = Object.freeze({ x: 1, y: 0, z: 0 });

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function assertFinite(value, name) {
        if (!isFiniteNumber(value)) {
            throw new TypeError((name || 'value') + ' must be a finite number.');
        }
    }

    function assertVector(value, name) {
        var label = name || 'vector';
        if (!value ||
            !isFiniteNumber(value.x) ||
            !isFiniteNumber(value.y) ||
            !isFiniteNumber(value.z)) {
            throw new TypeError(label + ' must contain finite x, y and z values.');
        }
    }

    function degreesToRadians(degrees) {
        assertFinite(degrees, 'degrees');
        return degrees * DEG_TO_RAD;
    }

    function radiansToDegrees(radians) {
        assertFinite(radians, 'radians');
        return radians * RAD_TO_DEG;
    }

    function normalizeDegrees(degrees) {
        assertFinite(degrees, 'degrees');
        var normalized = degrees % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    }

    function normalizeSignedDegrees(degrees) {
        var normalized = normalizeDegrees(degrees);
        return normalized > 180 ? normalized - 360 : normalized;
    }

    /**
     * Convert true astronomical horizontal coordinates to local ENU.
     * Azimuth convention: 0° = true north, 90° = east, clockwise positive.
     * Altitude convention: 0° = horizon, +90° = zenith.
     */
    function horizontalToENU(azimuthDeg, altitudeDeg) {
        assertFinite(azimuthDeg, 'azimuthDeg');
        assertFinite(altitudeDeg, 'altitudeDeg');

        if (altitudeDeg < -90 || altitudeDeg > 90) {
            throw new RangeError('altitudeDeg must be between -90 and +90 degrees.');
        }

        var azimuth = degreesToRadians(normalizeDegrees(azimuthDeg));
        var altitude = degreesToRadians(altitudeDeg);
        var horizontalMagnitude = Math.cos(altitude);

        return Frames.normalize(Frames.vector(
            horizontalMagnitude * Math.sin(azimuth), // East
            horizontalMagnitude * Math.cos(azimuth), // North
            Math.sin(altitude)                        // Up
        ));
    }

    /** Convert a non-zero ENU vector back to true azimuth and altitude. */
    function enuToHorizontal(enuVector) {
        assertVector(enuVector, 'enuVector');
        var unit = Frames.normalize(enuVector);
        var horizontalMagnitude = Math.hypot(unit.x, unit.y);

        var azimuthDeg;
        if (horizontalMagnitude <= Frames.EPSILON) {
            azimuthDeg = null; // Azimuth is undefined exactly at zenith/nadir.
        } else {
            azimuthDeg = normalizeDegrees(radiansToDegrees(Math.atan2(unit.x, unit.y)));
        }

        return Object.freeze({
            azimuthDeg: azimuthDeg,
            altitudeDeg: radiansToDegrees(Math.atan2(unit.z, horizontalMagnitude))
        });
    }

    function horizontalProjection(enuVector) {
        assertVector(enuVector, 'enuVector');
        var projection = Frames.vector(enuVector.x, enuVector.y, 0);
        var length = Frames.magnitude(projection);

        if (length <= Frames.EPSILON) {
            throw new RangeError('Heading is undefined for a vertical or near-vertical vector.');
        }

        return Frames.scale(projection, 1 / length);
    }

    /** Return true heading clockwise from north for a world-space forward vector. */
    function trueHeadingFromENU(enuForward) {
        var horizontal = horizontalProjection(enuForward);
        return normalizeDegrees(radiansToDegrees(Math.atan2(horizontal.x, horizontal.y)));
    }

    function altitudeFromENU(enuVector) {
        return enuToHorizontal(enuVector).altitudeDeg;
    }

    function signedHeadingDifference(targetHeadingDeg, referenceHeadingDeg) {
        assertFinite(targetHeadingDeg, 'targetHeadingDeg');
        assertFinite(referenceHeadingDeg, 'referenceHeadingDeg');
        return normalizeSignedDegrees(targetHeadingDeg - referenceHeadingDeg);
    }

    /**
     * Build the local astronomical world frame used by camera-pose.js.
     *
     * up:        local zenith.
     * toward:    horizontal direction toward the celestial body's azimuth.
     * transverse:right-handed horizontal perpendicular axis.
     *
     * A celestial body exactly at zenith/nadir cannot define horizontal azimuth,
     * so that geometry is explicitly rejected.
     */
    function buildAstronomicalWorldFrame(celestialENU) {
        assertVector(celestialENU, 'celestialENU');
        var celestial = Frames.normalize(celestialENU);
        var toward = horizontalProjection(celestial);
        var transverse = Frames.normalize(Frames.cross(WORLD_UP, toward));

        return Object.freeze({
            up: Frames.clone(WORLD_UP),
            toward: toward,
            transverse: transverse,
            celestial: celestial,
            celestialAltitudeDeg: altitudeFromENU(celestial),
            celestialAzimuthDeg: trueHeadingFromENU(celestial),
            matrix: Frames.matrixFromColumns(toward, transverse, WORLD_UP)
        });
    }

    function celestialSeparationFromZenithDeg(celestialENU) {
        assertVector(celestialENU, 'celestialENU');
        return radiansToDegrees(Frames.angleBetween(celestialENU, WORLD_UP));
    }

    function isCelestialGeometryUsable(celestialENU, minimumZenithSeparationDeg) {
        var minimum = isFiniteNumber(minimumZenithSeparationDeg) ?
            Math.abs(minimumZenithSeparationDeg) : 3;

        if (minimum >= 90) {
            throw new RangeError('minimumZenithSeparationDeg must be less than 90 degrees.');
        }

        var separation = celestialSeparationFromZenithDeg(celestialENU);
        return separation >= minimum && separation <= 180 - minimum;
    }

    function runSelfTests(logger) {
        var output = logger || (typeof console !== 'undefined' ? console : null);
        var passed = 0;
        var failed = 0;
        var failures = [];

        function nearlyEqual(a, b, tolerance) {
            return Math.abs(a - b) <= (tolerance || 1e-8);
        }

        function assert(name, condition) {
            if (condition) {
                passed++;
                if (output && output.log) output.log('PASS:', name);
            } else {
                failed++;
                failures.push(name);
                if (output && output.error) output.error('FAIL:', name);
            }
        }

        assert('north horizon maps to ENU north',
            Frames.vectorsNearlyEqual(horizontalToENU(0, 0), WORLD_NORTH));
        assert('east horizon maps to ENU east',
            Frames.vectorsNearlyEqual(horizontalToENU(90, 0), WORLD_EAST));
        assert('zenith maps to ENU up',
            Frames.vectorsNearlyEqual(horizontalToENU(25, 90), WORLD_UP));
        assert('south-west heading normalizes correctly',
            nearlyEqual(trueHeadingFromENU(horizontalToENU(225, 12)), 225));
        assert('altitude round trip is stable',
            nearlyEqual(enuToHorizontal(horizontalToENU(137.5, 42.25)).altitudeDeg, 42.25));
        assert('azimuth round trip is stable',
            nearlyEqual(enuToHorizontal(horizontalToENU(137.5, 42.25)).azimuthDeg, 137.5));
        assert('signed difference chooses shortest positive turn',
            nearlyEqual(signedHeadingDifference(10, 350), 20));
        assert('signed difference chooses shortest negative turn',
            nearlyEqual(signedHeadingDifference(350, 10), -20));

        var frame = buildAstronomicalWorldFrame(horizontalToENU(120, 30));
        assert('world frame matrix is orthonormal', Frames.isOrthonormalMatrix(frame.matrix));
        assert('world frame preserves celestial azimuth', nearlyEqual(frame.celestialAzimuthDeg, 120));
        assert('world frame preserves celestial altitude', nearlyEqual(frame.celestialAltitudeDeg, 30));
        assert('ordinary celestial geometry is usable',
            isCelestialGeometryUsable(horizontalToENU(120, 30), 3));
        assert('near-zenith geometry is rejected',
            !isCelestialGeometryUsable(horizontalToENU(120, 89), 3));

        var verticalHeadingRejected = false;
        try {
            trueHeadingFromENU(WORLD_UP);
        } catch (error) {
            verticalHeadingRejected = error instanceof RangeError;
        }
        assert('vertical vectors cannot produce heading', verticalHeadingRejected);

        return Object.freeze({
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        });
    }

    return Object.freeze({
        DEG_TO_RAD: DEG_TO_RAD,
        RAD_TO_DEG: RAD_TO_DEG,
        WORLD_UP: WORLD_UP,
        WORLD_NORTH: WORLD_NORTH,
        WORLD_EAST: WORLD_EAST,
        degreesToRadians: degreesToRadians,
        radiansToDegrees: radiansToDegrees,
        normalizeDegrees: normalizeDegrees,
        normalizeSignedDegrees: normalizeSignedDegrees,
        horizontalToENU: horizontalToENU,
        enuToHorizontal: enuToHorizontal,
        horizontalProjection: horizontalProjection,
        trueHeadingFromENU: trueHeadingFromENU,
        altitudeFromENU: altitudeFromENU,
        signedHeadingDifference: signedHeadingDifference,
        buildAstronomicalWorldFrame: buildAstronomicalWorldFrame,
        celestialSeparationFromZenithDeg: celestialSeparationFromZenithDeg,
        isCelestialGeometryUsable: isCelestialGeometryUsable,
        runSelfTests: runSelfTests
    });
});
