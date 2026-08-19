// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Camera Pose
// Solves camera-to-world orientation from a celestial ray and gravity reference.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./coordinate-frames.js'),
            require('./world-orientation.js')
        );
        return;
    }

    if (!root || !root.QiblaCoordinateFrames || !root.QiblaWorldOrientation) {
        throw new Error('QiblaCameraPose requires QiblaCoordinateFrames and QiblaWorldOrientation.');
    }

    root.QiblaCameraPose = factory(root.QiblaCoordinateFrames, root.QiblaWorldOrientation);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Frames, World) {
    'use strict';

    var RAD_TO_DEG = 180 / Math.PI;
    var DEFAULT_FORWARD = Object.freeze({ x: 0, y: 0, z: 1 });
    var DEFAULT_MIN_HORIZONTAL = 0.02;
    var DEFAULT_MAX_ALTITUDE_RESIDUAL_DEG = 5;

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function vectorCopy(input, name) {
        if (!input || !isFiniteNumber(input.x) || !isFiniteNumber(input.y) || !isFiniteNumber(input.z)) {
            throw new TypeError((name || 'vector') + ' must contain finite x, y and z values.');
        }
        return Frames.vector(input.x, input.y, input.z);
    }

    function radiansToDegrees(value) {
        return value * RAD_TO_DEG;
    }

    function altitudeFromUp(direction, up) {
        var unitDirection = Frames.normalize(direction);
        var unitUp = Frames.normalize(up);
        return Math.asin(clamp(Frames.dot(unitDirection, unitUp), -1, 1));
    }

    function horizontalMagnitude(direction, up) {
        return Frames.magnitude(Frames.rejectFrom(Frames.normalize(direction), Frames.normalize(up)));
    }

    function buildObservationFrame(celestialVector, upVector, label) {
        var celestial = Frames.normalize(vectorCopy(celestialVector, label + ' celestialVector'));
        var up = Frames.normalize(vectorCopy(upVector, label + ' upVector'));
        var horizontal = Frames.rejectFrom(celestial, up);
        var horizontalLength = Frames.magnitude(horizontal);

        if (horizontalLength <= Frames.EPSILON) {
            throw new RangeError(label + ' celestial vector is too close to the vertical axis.');
        }

        return {
            up: up,
            celestial: celestial,
            horizontalCelestial: Frames.normalize(horizontal),
            frame: Frames.buildOrthonormalFrame(up, horizontal)
        };
    }

    function solve(options) {
        var input = options || {};
        var cameraCelestial = vectorCopy(input.cameraCelestialVector, 'cameraCelestialVector');
        var cameraGravity = vectorCopy(input.cameraGravityVector, 'cameraGravityVector');
        var worldCelestial = vectorCopy(input.worldCelestialVector, 'worldCelestialVector');
        var worldUp = vectorCopy(input.worldUpVector || World.WORLD_UP, 'worldUpVector');
        var cameraForward = vectorCopy(input.cameraForwardAxis || DEFAULT_FORWARD, 'cameraForwardAxis');

        var minHorizontal = isFiniteNumber(input.minimumForwardHorizontalMagnitude)
            ? Math.abs(input.minimumForwardHorizontalMagnitude)
            : DEFAULT_MIN_HORIZONTAL;
        var maxAltitudeResidual = isFiniteNumber(input.maximumAltitudeResidualDeg)
            ? Math.abs(input.maximumAltitudeResidualDeg)
            : DEFAULT_MAX_ALTITUDE_RESIDUAL_DEG;

        var cameraUp = Frames.negate(Frames.normalize(cameraGravity));
        var cameraObservation = buildObservationFrame(cameraCelestial, cameraUp, 'camera');
        var worldObservation = buildObservationFrame(worldCelestial, worldUp, 'world');
        var rotationCameraToWorld = Frames.rotationBetweenFrames(
            cameraObservation.frame,
            worldObservation.frame
        );

        if (!Frames.isOrthonormalMatrix(rotationCameraToWorld, 1e-7)) {
            throw new Error('Computed camera-to-world rotation is not orthonormal.');
        }

        var solvedCelestialWorld = Frames.normalize(
            Frames.multiplyMatrixVector(rotationCameraToWorld, cameraObservation.celestial)
        );
        var solvedUpWorld = Frames.normalize(
            Frames.multiplyMatrixVector(rotationCameraToWorld, cameraObservation.up)
        );
        var worldForward = Frames.normalize(
            Frames.multiplyMatrixVector(rotationCameraToWorld, Frames.normalize(cameraForward))
        );

        var cameraAltitude = altitudeFromUp(cameraObservation.celestial, cameraObservation.up);
        var worldAltitude = altitudeFromUp(worldObservation.celestial, worldObservation.up);
        var altitudeResidualDeg = Math.abs(radiansToDegrees(cameraAltitude - worldAltitude));
        var celestialResidualDeg = radiansToDegrees(
            Frames.angleBetween(solvedCelestialWorld, worldObservation.celestial)
        );
        var upResidualDeg = radiansToDegrees(
            Frames.angleBetween(solvedUpWorld, worldObservation.up)
        );
        var forwardHorizontalMagnitude = horizontalMagnitude(worldForward, worldObservation.up);

        if (forwardHorizontalMagnitude < minHorizontal) {
            throw new RangeError('Camera forward axis is too close to vertical to produce a stable heading.');
        }

        var trueHeading = World.trueHeadingFromENU(worldForward);
        var valid = altitudeResidualDeg <= maxAltitudeResidual;
        var altitudeScore = clamp(1 - altitudeResidualDeg / Math.max(maxAltitudeResidual, 1e-9), 0, 1);
        var geometryScore = clamp(forwardHorizontalMagnitude, 0, 1);
        var confidence = altitudeScore * geometryScore;

        return Object.freeze({
            rotationCameraToWorld: rotationCameraToWorld,
            worldForwardVector: worldForward,
            solvedCelestialWorldVector: solvedCelestialWorld,
            solvedUpWorldVector: solvedUpWorld,
            trueHeadingDeg: trueHeading,
            cameraCelestialAltitudeDeg: radiansToDegrees(cameraAltitude),
            expectedCelestialAltitudeDeg: radiansToDegrees(worldAltitude),
            altitudeResidualDeg: altitudeResidualDeg,
            celestialResidualDeg: celestialResidualDeg,
            upResidualDeg: upResidualDeg,
            forwardHorizontalMagnitude: forwardHorizontalMagnitude,
            confidence: confidence,
            valid: valid,
            rejectionReason: valid ? null : 'ALTITUDE_RESIDUAL_TOO_LARGE'
        });
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

        function close(a, b, tolerance) {
            return Math.abs(a - b) <= (tolerance || 1e-7);
        }

        var worldCelestial = World.horizontalToENU(90, 30);
        var gravityDown = Frames.vector(0, 0, -1);
        var identityResult = solve({
            cameraCelestialVector: worldCelestial,
            cameraGravityVector: gravityDown,
            worldCelestialVector: worldCelestial,
            cameraForwardAxis: Frames.vector(0, 1, 0)
        });

        assert('identity observation produces north heading for north forward axis',
            close(identityResult.trueHeadingDeg, 0));
        assert('identity rotation has negligible celestial residual',
            identityResult.celestialResidualDeg < 1e-6);
        assert('identity rotation has negligible altitude residual',
            identityResult.altitudeResidualDeg < 1e-6);
        assert('identity result is valid', identityResult.valid === true);

        var yawEast90 = [
            [0, -1, 0],
            [1, 0, 0],
            [0, 0, 1]
        ];
        var worldToCamera = Frames.transpose(yawEast90);
        var cameraCelestial = Frames.multiplyMatrixVector(worldToCamera, worldCelestial);
        var cameraGravity = Frames.multiplyMatrixVector(worldToCamera, gravityDown);
        var yawResult = solve({
            cameraCelestialVector: cameraCelestial,
            cameraGravityVector: cameraGravity,
            worldCelestialVector: worldCelestial,
            cameraForwardAxis: Frames.vector(1, 0, 0)
        });

        assert('known yaw pose recovers north heading', close(yawResult.trueHeadingDeg, 0));
        assert('known yaw pose recovers orthonormal rotation',
            Frames.isOrthonormalMatrix(yawResult.rotationCameraToWorld));
        assert('known yaw pose maps celestial ray correctly', yawResult.celestialResidualDeg < 1e-6);
        assert('known yaw pose maps up correctly', yawResult.upResidualDeg < 1e-6);

        var inconsistentCameraCelestial = World.horizontalToENU(90, 10);
        var inconsistent = solve({
            cameraCelestialVector: inconsistentCameraCelestial,
            cameraGravityVector: gravityDown,
            worldCelestialVector: worldCelestial,
            cameraForwardAxis: Frames.vector(0, 1, 0),
            maximumAltitudeResidualDeg: 5
        });
        assert('inconsistent observed altitude is rejected', inconsistent.valid === false);
        assert('inconsistent observation reports altitude reason',
            inconsistent.rejectionReason === 'ALTITUDE_RESIDUAL_TOO_LARGE');

        var verticalForwardRejected = false;
        try {
            solve({
                cameraCelestialVector: worldCelestial,
                cameraGravityVector: gravityDown,
                worldCelestialVector: worldCelestial,
                cameraForwardAxis: Frames.vector(0, 0, 1)
            });
        } catch (error) {
            verticalForwardRejected = error instanceof RangeError;
        }
        assert('near-vertical forward axis is rejected', verticalForwardRejected);

        var zenithRejected = false;
        try {
            solve({
                cameraCelestialVector: Frames.vector(0, 0, 1),
                cameraGravityVector: gravityDown,
                worldCelestialVector: Frames.vector(0, 0, 1),
                cameraForwardAxis: Frames.vector(0, 1, 0)
            });
        } catch (error) {
            zenithRejected = error instanceof RangeError;
        }
        assert('zenith celestial observation is rejected as degenerate', zenithRejected);

        return {
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        };
    }

    return Object.freeze({
        DEFAULT_FORWARD: DEFAULT_FORWARD,
        buildObservationFrame: buildObservationFrame,
        altitudeFromUp: altitudeFromUp,
        horizontalMagnitude: horizontalMagnitude,
        solve: solve,
        runSelfTests: runSelfTests
    });
});