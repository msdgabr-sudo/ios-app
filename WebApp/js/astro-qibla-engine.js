// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Astronomical Qibla Engine
// Independent geodesic Qibla bearing and camera-relative direction calculation.
// Uses no QT state, compass heading, magnetometer or magnetic declination.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }

    root.QiblaAstroQiblaEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var DEG_TO_RAD = Math.PI / 180;
    var RAD_TO_DEG = 180 / Math.PI;

    var DEFAULT_KAABA = Object.freeze({
        latitude: 21.422487,
        longitude: 39.826206
    });

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function assertFinite(value, name) {
        if (!isFiniteNumber(value)) {
            throw new TypeError((name || 'value') + ' must be a finite number.');
        }
    }

    function assertLatitude(latitude, name) {
        assertFinite(latitude, name || 'latitude');
        if (latitude < -90 || latitude > 90) {
            throw new RangeError((name || 'latitude') + ' must be between -90 and 90 degrees.');
        }
    }

    function assertLongitude(longitude, name) {
        assertFinite(longitude, name || 'longitude');
        if (longitude < -180 || longitude > 180) {
            throw new RangeError((name || 'longitude') + ' must be between -180 and 180 degrees.');
        }
    }

    function normalize360(degrees) {
        assertFinite(degrees, 'degrees');
        var value = degrees % 360;
        return value < 0 ? value + 360 : value;
    }

    function normalize180(degrees) {
        var value = normalize360(degrees);
        return value > 180 ? value - 360 : value;
    }

    function shortestSignedDifference(targetDeg, referenceDeg) {
        assertFinite(targetDeg, 'targetDeg');
        assertFinite(referenceDeg, 'referenceDeg');
        return normalize180(targetDeg - referenceDeg);
    }

    function haversineCentralAngle(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
        assertLatitude(lat1Deg, 'lat1Deg');
        assertLongitude(lon1Deg, 'lon1Deg');
        assertLatitude(lat2Deg, 'lat2Deg');
        assertLongitude(lon2Deg, 'lon2Deg');

        var lat1 = lat1Deg * DEG_TO_RAD;
        var lat2 = lat2Deg * DEG_TO_RAD;
        var dLat = (lat2Deg - lat1Deg) * DEG_TO_RAD;
        var dLon = normalize180(lon2Deg - lon1Deg) * DEG_TO_RAD;

        var sinLat = Math.sin(dLat / 2);
        var sinLon = Math.sin(dLon / 2);
        var a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    }

    function initialGreatCircleBearing(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
        assertLatitude(lat1Deg, 'lat1Deg');
        assertLongitude(lon1Deg, 'lon1Deg');
        assertLatitude(lat2Deg, 'lat2Deg');
        assertLongitude(lon2Deg, 'lon2Deg');

        var centralAngle = haversineCentralAngle(lat1Deg, lon1Deg, lat2Deg, lon2Deg);
        if (centralAngle < 1e-12) {
            throw new RangeError('Bearing is undefined because origin and destination coincide.');
        }

        var lat1 = lat1Deg * DEG_TO_RAD;
        var lat2 = lat2Deg * DEG_TO_RAD;
        var dLon = normalize180(lon2Deg - lon1Deg) * DEG_TO_RAD;

        var y = Math.sin(dLon) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        return normalize360(Math.atan2(y, x) * RAD_TO_DEG);
    }

    function calculateQiblaBearing(latitude, longitude, kaaba) {
        assertLatitude(latitude, 'latitude');
        assertLongitude(longitude, 'longitude');

        var target = kaaba || DEFAULT_KAABA;
        if (!target || typeof target !== 'object') {
            throw new TypeError('kaaba must be an object containing latitude and longitude.');
        }

        assertLatitude(target.latitude, 'kaaba.latitude');
        assertLongitude(target.longitude, 'kaaba.longitude');

        return initialGreatCircleBearing(
            latitude,
            longitude,
            target.latitude,
            target.longitude
        );
    }

    function classifyRelativeDirection(relativeAngleDeg, alignedToleranceDeg) {
        assertFinite(relativeAngleDeg, 'relativeAngleDeg');
        var tolerance = alignedToleranceDeg === undefined ? 1 : Math.abs(alignedToleranceDeg);
        assertFinite(tolerance, 'alignedToleranceDeg');

        var angle = normalize180(relativeAngleDeg);
        if (Math.abs(angle) <= tolerance) return 'aligned';
        if (Math.abs(angle) >= 180 - tolerance) return 'behind';
        return angle > 0 ? 'right' : 'left';
    }

    function calculateRelativeQibla(latitude, longitude, trueCameraHeadingDeg, options) {
        assertFinite(trueCameraHeadingDeg, 'trueCameraHeadingDeg');
        var opts = options || {};
        var bearing = calculateQiblaBearing(latitude, longitude, opts.kaaba);
        var heading = normalize360(trueCameraHeadingDeg);
        var relative = shortestSignedDifference(bearing, heading);
        var tolerance = opts.alignedToleranceDeg === undefined ? 1 : Math.abs(opts.alignedToleranceDeg);

        return Object.freeze({
            qiblaBearingDeg: bearing,
            trueCameraHeadingDeg: heading,
            relativeQiblaAngleDeg: relative,
            absoluteDeviationDeg: Math.abs(relative),
            direction: classifyRelativeDirection(relative, tolerance),
            isAligned: Math.abs(relative) <= tolerance,
            alignedToleranceDeg: tolerance
        });
    }

    function runSelfTests(logger) {
        var output = logger || (typeof console !== 'undefined' ? console : null);
        var passed = 0;
        var failed = 0;
        var failures = [];

        function nearlyEqual(a, b, tolerance) {
            return Math.abs(a - b) <= (tolerance === undefined ? 1e-8 : tolerance);
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

        assert('normalize360 wraps negative angle', nearlyEqual(normalize360(-10), 350));
        assert('normalize180 maps 350 to -10', nearlyEqual(normalize180(350), -10));
        assert('shortest difference crosses north correctly', nearlyEqual(shortestSignedDifference(5, 355), 10));
        assert('north bearing on same longitude', nearlyEqual(initialGreatCircleBearing(0, 0, 10, 0), 0, 1e-9));
        assert('east bearing on equator', nearlyEqual(initialGreatCircleBearing(0, 0, 0, 10), 90, 1e-9));
        assert('south bearing on same longitude', nearlyEqual(initialGreatCircleBearing(10, 0, 0, 0), 180, 1e-9));

        var cairo = calculateQiblaBearing(30.0444, 31.2357);
        assert('Cairo Qibla bearing is in expected range', cairo > 135 && cairo < 137.5);

        var london = calculateQiblaBearing(51.5074, -0.1278);
        assert('London Qibla bearing is in expected range', london > 117 && london < 120);

        var aligned = calculateRelativeQibla(30.0444, 31.2357, cairo, { alignedToleranceDeg: 0.5 });
        assert('matching camera heading is aligned', aligned.isAligned && nearlyEqual(aligned.relativeQiblaAngleDeg, 0, 1e-9));

        var right = calculateRelativeQibla(30.0444, 31.2357, cairo - 15);
        assert('Qibla to camera right gives positive angle', right.direction === 'right' && nearlyEqual(right.relativeQiblaAngleDeg, 15, 1e-8));

        var left = calculateRelativeQibla(30.0444, 31.2357, cairo + 15);
        assert('Qibla to camera left gives negative angle', left.direction === 'left' && nearlyEqual(left.relativeQiblaAngleDeg, -15, 1e-8));

        var coincidentRejected = false;
        try {
            initialGreatCircleBearing(DEFAULT_KAABA.latitude, DEFAULT_KAABA.longitude, DEFAULT_KAABA.latitude, DEFAULT_KAABA.longitude);
        } catch (error) {
            coincidentRejected = error instanceof RangeError;
        }
        assert('coincident origin and destination are rejected', coincidentRejected);

        var invalidLatitudeRejected = false;
        try {
            calculateQiblaBearing(95, 0);
        } catch (error) {
            invalidLatitudeRejected = error instanceof RangeError;
        }
        assert('invalid latitude is rejected', invalidLatitudeRejected);

        return {
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        };
    }

    return Object.freeze({
        DEFAULT_KAABA: DEFAULT_KAABA,
        normalize360: normalize360,
        normalize180: normalize180,
        shortestSignedDifference: shortestSignedDifference,
        haversineCentralAngle: haversineCentralAngle,
        initialGreatCircleBearing: initialGreatCircleBearing,
        calculateQiblaBearing: calculateQiblaBearing,
        classifyRelativeDirection: classifyRelativeDirection,
        calculateRelativeQibla: calculateRelativeQibla,
        runSelfTests: runSelfTests
    });
});
