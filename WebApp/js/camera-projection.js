// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Camera Projection
// Converts image pixels into normalized 3D camera rays using a pinhole model.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./coordinate-frames.js'));
        return;
    }

    if (!root || !root.QiblaCoordinateFrames) {
        throw new Error('QiblaCameraProjection requires QiblaCoordinateFrames.');
    }

    root.QiblaCameraProjection = factory(root.QiblaCoordinateFrames);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Frames) {
    'use strict';

    var DEG_TO_RAD = Math.PI / 180;
    var RAD_TO_DEG = 180 / Math.PI;
    var DEFAULT_HORIZONTAL_FOV_DEG = 65;
    var MIN_FOV_DEG = 1;
    var MAX_FOV_DEG = 179;

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function assertFinite(value, name) {
        if (!isFiniteNumber(value)) {
            throw new TypeError((name || 'value') + ' must be a finite number.');
        }
    }

    function assertPositive(value, name) {
        assertFinite(value, name);
        if (value <= 0) {
            throw new RangeError((name || 'value') + ' must be greater than zero.');
        }
    }

    function assertFov(value, name) {
        assertFinite(value, name);
        if (value < MIN_FOV_DEG || value > MAX_FOV_DEG) {
            throw new RangeError((name || 'FOV') + ' must be between ' + MIN_FOV_DEG + ' and ' + MAX_FOV_DEG + ' degrees.');
        }
    }

    function normalizeRotation(rotationDeg) {
        assertFinite(rotationDeg, 'rotationDeg');
        var normalized = ((rotationDeg % 360) + 360) % 360;
        var allowed = [0, 90, 180, 270];
        for (var i = 0; i < allowed.length; i++) {
            if (Math.abs(normalized - allowed[i]) < 1e-8) return allowed[i];
        }
        throw new RangeError('rotationDeg must be 0, 90, 180 or 270 degrees.');
    }

    function verticalFovFromHorizontal(horizontalFovDeg, width, height) {
        assertFov(horizontalFovDeg, 'horizontalFovDeg');
        assertPositive(width, 'width');
        assertPositive(height, 'height');

        var horizontalRad = horizontalFovDeg * DEG_TO_RAD;
        var aspect = width / height;
        var verticalRad = 2 * Math.atan(Math.tan(horizontalRad / 2) / aspect);
        return verticalRad * RAD_TO_DEG;
    }

    function horizontalFovFromVertical(verticalFovDeg, width, height) {
        assertFov(verticalFovDeg, 'verticalFovDeg');
        assertPositive(width, 'width');
        assertPositive(height, 'height');

        var verticalRad = verticalFovDeg * DEG_TO_RAD;
        var aspect = width / height;
        var horizontalRad = 2 * Math.atan(Math.tan(verticalRad / 2) * aspect);
        return horizontalRad * RAD_TO_DEG;
    }

    function intrinsicsFromFov(options) {
        var opts = options || {};
        var width = opts.width;
        var height = opts.height;
        assertPositive(width, 'width');
        assertPositive(height, 'height');

        var horizontalFovDeg = isFiniteNumber(opts.horizontalFovDeg)
            ? opts.horizontalFovDeg
            : DEFAULT_HORIZONTAL_FOV_DEG;
        assertFov(horizontalFovDeg, 'horizontalFovDeg');

        var verticalFovDeg = isFiniteNumber(opts.verticalFovDeg)
            ? opts.verticalFovDeg
            : verticalFovFromHorizontal(horizontalFovDeg, width, height);
        assertFov(verticalFovDeg, 'verticalFovDeg');

        var fx = width / (2 * Math.tan(horizontalFovDeg * DEG_TO_RAD / 2));
        var fy = height / (2 * Math.tan(verticalFovDeg * DEG_TO_RAD / 2));
        var cx = isFiniteNumber(opts.cx) ? opts.cx : width / 2;
        var cy = isFiniteNumber(opts.cy) ? opts.cy : height / 2;

        assertFinite(cx, 'cx');
        assertFinite(cy, 'cy');

        return Object.freeze({
            width: width,
            height: height,
            fx: fx,
            fy: fy,
            cx: cx,
            cy: cy,
            horizontalFovDeg: horizontalFovDeg,
            verticalFovDeg: verticalFovDeg
        });
    }

    function assertIntrinsics(intrinsics) {
        if (!intrinsics || typeof intrinsics !== 'object') {
            throw new TypeError('intrinsics are required.');
        }
        assertPositive(intrinsics.width, 'intrinsics.width');
        assertPositive(intrinsics.height, 'intrinsics.height');
        assertPositive(intrinsics.fx, 'intrinsics.fx');
        assertPositive(intrinsics.fy, 'intrinsics.fy');
        assertFinite(intrinsics.cx, 'intrinsics.cx');
        assertFinite(intrinsics.cy, 'intrinsics.cy');
    }

    function rotatePixelToSensor(u, v, width, height, rotationDeg) {
        assertFinite(u, 'u');
        assertFinite(v, 'v');
        assertPositive(width, 'width');
        assertPositive(height, 'height');
        var rotation = normalizeRotation(rotationDeg || 0);

        if (rotation === 0) {
            return { u: u, v: v, width: width, height: height };
        }
        if (rotation === 90) {
            return { u: v, v: width - u, width: height, height: width };
        }
        if (rotation === 180) {
            return { u: width - u, v: height - v, width: width, height: height };
        }
        return { u: height - v, v: u, width: height, height: width };
    }

    function pixelToNormalizedCoordinates(u, v, intrinsics) {
        assertIntrinsics(intrinsics);
        assertFinite(u, 'u');
        assertFinite(v, 'v');

        return {
            x: (u - intrinsics.cx) / intrinsics.fx,
            y: (v - intrinsics.cy) / intrinsics.fy
        };
    }

    function pixelToCameraRay(u, v, intrinsics, options) {
        assertIntrinsics(intrinsics);
        var opts = options || {};
        var point = { u: u, v: v };

        if (isFiniteNumber(opts.rotationDeg) && opts.rotationDeg !== 0) {
            var rotated = rotatePixelToSensor(
                u,
                v,
                intrinsics.width,
                intrinsics.height,
                opts.rotationDeg
            );
            point.u = rotated.u;
            point.v = rotated.v;
        }

        var normalized = pixelToNormalizedCoordinates(point.u, point.v, intrinsics);
        var y = opts.invertImageY === false ? normalized.y : -normalized.y;

        return Frames.normalize(Frames.vector(normalized.x, y, 1));
    }

    function cameraRayToPixel(ray, intrinsics, options) {
        assertIntrinsics(intrinsics);
        var opts = options || {};
        var unit = Frames.normalize(ray);
        if (unit.z <= 0) {
            throw new RangeError('ray must point in front of the camera.');
        }

        var imageY = opts.invertImageY === false ? unit.y : -unit.y;
        return {
            u: intrinsics.fx * (unit.x / unit.z) + intrinsics.cx,
            v: intrinsics.fy * (imageY / unit.z) + intrinsics.cy
        };
    }

    function angularOffsetFromOpticalAxis(ray) {
        var unit = Frames.normalize(ray);
        var forward = Frames.vector(0, 0, 1);
        return Frames.angleBetween(unit, forward) * RAD_TO_DEG;
    }

    function horizontalVerticalAnglesFromRay(ray) {
        var unit = Frames.normalize(ray);
        return {
            horizontalDeg: Math.atan2(unit.x, unit.z) * RAD_TO_DEG,
            verticalDeg: Math.atan2(unit.y, Math.sqrt(unit.x * unit.x + unit.z * unit.z)) * RAD_TO_DEG
        };
    }

    function isPixelInsideFrame(u, v, width, height, margin) {
        assertFinite(u, 'u');
        assertFinite(v, 'v');
        assertPositive(width, 'width');
        assertPositive(height, 'height');
        var safeMargin = isFiniteNumber(margin) ? Math.max(0, margin) : 0;
        return u >= safeMargin &&
            u <= width - safeMargin &&
            v >= safeMargin &&
            v <= height - safeMargin;
    }

    function runSelfTests(logger) {
        var output = logger || (typeof console !== 'undefined' ? console : null);
        var passed = 0;
        var failed = 0;
        var failures = [];

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

        function near(a, b, tolerance) {
            return Math.abs(a - b) <= (tolerance || 1e-8);
        }

        var intrinsics = intrinsicsFromFov({ width: 1000, height: 500, horizontalFovDeg: 90 });
        var centerRay = pixelToCameraRay(500, 250, intrinsics);
        assert('center pixel maps to optical axis', Frames.vectorsNearlyEqual(centerRay, Frames.vector(0, 0, 1), 1e-8));

        var rightRay = pixelToCameraRay(1000, 250, intrinsics);
        var rightAngles = horizontalVerticalAnglesFromRay(rightRay);
        assert('right edge is approximately +45 degrees', near(rightAngles.horizontalDeg, 45, 1e-6));

        var leftRay = pixelToCameraRay(0, 250, intrinsics);
        var leftAngles = horizontalVerticalAnglesFromRay(leftRay);
        assert('left edge is approximately -45 degrees', near(leftAngles.horizontalDeg, -45, 1e-6));

        var topRay = pixelToCameraRay(500, 0, intrinsics);
        assert('top pixel has positive camera y', topRay.y > 0);

        var roundTripPixel = cameraRayToPixel(rightRay, intrinsics);
        assert('ray-to-pixel round trip preserves u', near(roundTripPixel.u, 1000, 1e-6));
        assert('ray-to-pixel round trip preserves v', near(roundTripPixel.v, 250, 1e-6));

        var verticalFov = verticalFovFromHorizontal(90, 1000, 500);
        assert('vertical FOV respects aspect ratio', near(verticalFov, 53.13010235415598, 1e-8));
        assert('horizontal FOV inverse conversion', near(horizontalFovFromVertical(verticalFov, 1000, 500), 90, 1e-8));

        assert('center offset is zero', near(angularOffsetFromOpticalAxis(centerRay), 0, 1e-8));
        assert('right edge offset is 45 degrees', near(angularOffsetFromOpticalAxis(rightRay), 45, 1e-6));
        assert('inside-frame accepts valid point', isPixelInsideFrame(500, 250, 1000, 500, 10));
        assert('inside-frame rejects edge inside margin', !isPixelInsideFrame(5, 250, 1000, 500, 10));

        var invalidFovRejected = false;
        try {
            intrinsicsFromFov({ width: 1000, height: 500, horizontalFovDeg: 180 });
        } catch (error) {
            invalidFovRejected = error instanceof RangeError;
        }
        assert('invalid FOV is rejected', invalidFovRejected);

        var rearRejected = false;
        try {
            cameraRayToPixel(Frames.vector(0, 0, -1), intrinsics);
        } catch (error) {
            rearRejected = error instanceof RangeError;
        }
        assert('rear-facing ray is rejected', rearRejected);

        return {
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        };
    }

    return Object.freeze({
        DEFAULT_HORIZONTAL_FOV_DEG: DEFAULT_HORIZONTAL_FOV_DEG,
        verticalFovFromHorizontal: verticalFovFromHorizontal,
        horizontalFovFromVertical: horizontalFovFromVertical,
        intrinsicsFromFov: intrinsicsFromFov,
        rotatePixelToSensor: rotatePixelToSensor,
        pixelToNormalizedCoordinates: pixelToNormalizedCoordinates,
        pixelToCameraRay: pixelToCameraRay,
        cameraRayToPixel: cameraRayToPixel,
        angularOffsetFromOpticalAxis: angularOffsetFromOpticalAxis,
        horizontalVerticalAnglesFromRay: horizontalVerticalAnglesFromRay,
        isPixelInsideFrame: isPixelInsideFrame,
        runSelfTests: runSelfTests
    });
});
