// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Astronomical Solver Pipeline
// Coordinates image projection, gravity reference, celestial world geometry,
// camera-pose solving, independent Qibla bearing and verification quality.
// Uses no compass, magnetometer, device heading, QT or magnetic declination.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./coordinate-frames.js'),
            require('./world-orientation.js'),
            require('./camera-projection.js'),
            require('./camera-pose.js'),
            require('./astro-qibla-engine.js'),
            require('./verification-quality.js')
        );
        return;
    }

    if (!root ||
        !root.QiblaCoordinateFrames ||
        !root.QiblaWorldOrientation ||
        !root.QiblaCameraProjection ||
        !root.QiblaCameraPose ||
        !root.QiblaAstroQiblaEngine ||
        !root.QiblaVerificationQuality) {
        throw new Error(
            'QiblaAstronomicalSolver requires coordinate frames, world orientation, ' +
            'camera projection, camera pose, astronomical Qibla engine and verification quality.'
        );
    }

    root.QiblaAstronomicalSolver = factory(
        root.QiblaCoordinateFrames,
        root.QiblaWorldOrientation,
        root.QiblaCameraProjection,
        root.QiblaCameraPose,
        root.QiblaAstroQiblaEngine,
        root.QiblaVerificationQuality
    );
})(typeof globalThis !== 'undefined' ? globalThis : this,
    function (Frames, World, Projection, CameraPose, Qibla, Quality) {
        'use strict';

        var VERSION = '1.0.0-foundation';
        var DEFAULT_ALIGNED_TOLERANCE_DEG = 1;

        function isFiniteNumber(value) {
            return typeof value === 'number' && Number.isFinite(value);
        }

        function assertFinite(value, name) {
            if (!isFiniteNumber(value)) {
                throw new TypeError((name || 'value') + ' must be a finite number.');
            }
        }

        function assertObject(value, name) {
            if (!value || typeof value !== 'object') {
                throw new TypeError((name || 'value') + ' must be an object.');
            }
        }

        function assertTimestamp(value, name) {
            assertFinite(value, name);
            if (value < 0) {
                throw new RangeError((name || 'timestamp') + ' must not be negative.');
            }
        }

        function clamp(value, minimum, maximum) {
            return Math.max(minimum, Math.min(maximum, value));
        }

        function timestampOr(value, fallback) {
            return isFiniteNumber(value) ? value : fallback;
        }

        function edgeMarginRatio(u, v, width, height) {
            var marginPx = Math.min(u, width - u, v, height - v);
            return clamp(marginPx / Math.max(1, Math.min(width, height)), 0, 0.5);
        }

        function angularSeparationDeg(a, b) {
            return Frames.angleBetween(a, b) * 180 / Math.PI;
        }

        function buildIntrinsics(camera) {
            assertObject(camera, 'camera');
            return Projection.intrinsicsFromFov({
                width: camera.width,
                height: camera.height,
                horizontalFovDeg: camera.horizontalFovDeg,
                verticalFovDeg: camera.verticalFovDeg,
                cx: camera.cx,
                cy: camera.cy
            });
        }

        function normalizeDetection(input, now) {
            assertObject(input, 'detection');
            assertFinite(input.x, 'detection.x');
            assertFinite(input.y, 'detection.y');

            return Object.freeze({
                x: input.x,
                y: input.y,
                radiusPx: isFiniteNumber(input.radiusPx) ? input.radiusPx : null,
                confidence: clamp(isFiniteNumber(input.confidence) ? input.confidence : 0, 0, 1),
                stableFrames: isFiniteNumber(input.frameCount) ? input.frameCount :
                    (isFiniteNumber(input.stableFrames) ? input.stableFrames : 0),
                saturationRatio: clamp(isFiniteNumber(input.saturationRatio) ? input.saturationRatio : 0.7, 0, 1),
                circularity: clamp(isFiniteNumber(input.circularity) ? input.circularity : 0.8, 0, 1),
                timestamp: timestampOr(input.timestamp, now)
            });
        }

        function normalizeGravity(input, now) {
            assertObject(input, 'gravity');
            assertObject(input.downCamera, 'gravity.downCamera');

            var timestamp = timestampOr(input.timestamp, now);
            assertTimestamp(timestamp, 'gravity.timestamp');

            return Object.freeze({
                downCamera: Frames.normalize(Frames.vector(
                    input.downCamera.x,
                    input.downCamera.y,
                    input.downCamera.z
                )),
                quality: clamp(isFiniteNumber(input.quality) ? input.quality : 0, 0, 1),
                directionSpreadDeg: isFiniteNumber(input.directionSpreadDeg) ?
                    Math.abs(input.directionSpreadDeg) : Infinity,
                timestamp: timestamp
            });
        }

        function normalizeCelestial(input, now) {
            assertObject(input, 'celestial');
            assertFinite(input.azimuthDeg, 'celestial.azimuthDeg');
            assertFinite(input.altitudeDeg, 'celestial.altitudeDeg');

            var timestamp = timestampOr(input.timestamp, now);
            assertTimestamp(timestamp, 'celestial.timestamp');

            return Object.freeze({
                body: input.body === 'moon' ? 'moon' : 'sun',
                azimuthDeg: World.normalizeDegrees(input.azimuthDeg),
                altitudeDeg: input.altitudeDeg,
                timestamp: timestamp
            });
        }

        function normalizeLocation(input) {
            assertObject(input, 'location');
            assertFinite(input.latitude, 'location.latitude');
            assertFinite(input.longitude, 'location.longitude');
            return Object.freeze({
                latitude: input.latitude,
                longitude: input.longitude
            });
        }

        /**
         * Solve one already-detected celestial observation.
         *
         * Required input:
         * - location: { latitude, longitude }
         * - celestial: { azimuthDeg, altitudeDeg, timestamp, body }
         * - camera: { width, height, horizontalFovDeg?, verticalFovDeg?, rotationDeg? }
         * - detection: { x, y, confidence, frameCount, timestamp, ... }
         * - gravity: { downCamera:{x,y,z}, quality, directionSpreadDeg, timestamp }
         */
        function solveObservation(options) {
            var input = options || {};
            var now = isFiniteNumber(input.now) ? input.now : Date.now();
            assertTimestamp(now, 'now');

            var location = normalizeLocation(input.location);
            var celestial = normalizeCelestial(input.celestial, now);
            var detection = normalizeDetection(input.detection, now);
            var gravity = normalizeGravity(input.gravity, now);
            var intrinsics = buildIntrinsics(input.camera);

            if (!Projection.isPixelInsideFrame(
                detection.x,
                detection.y,
                intrinsics.width,
                intrinsics.height,
                0
            )) {
                throw new RangeError('Detected celestial centroid is outside the camera frame.');
            }

            var cameraCelestialRay = Projection.pixelToCameraRay(
                detection.x,
                detection.y,
                intrinsics,
                {
                    rotationDeg: isFiniteNumber(input.camera.rotationDeg) ? input.camera.rotationDeg : 0,
                    invertImageY: input.camera.invertImageY
                }
            );

            var worldCelestialVector = World.horizontalToENU(
                celestial.azimuthDeg,
                celestial.altitudeDeg
            );

            var pose = CameraPose.solve({
                cameraCelestialVector: cameraCelestialRay,
                cameraGravityVector: gravity.downCamera,
                worldCelestialVector: worldCelestialVector,
                worldUpVector: World.WORLD_UP,
                cameraForwardAxis: input.camera.forwardAxis || CameraPose.DEFAULT_FORWARD,
                minimumForwardHorizontalMagnitude: input.minimumForwardHorizontalMagnitude,
                maximumAltitudeResidualDeg: input.maximumAltitudeResidualDeg
            });

            var relativeQibla = Qibla.calculateRelativeQibla(
                location.latitude,
                location.longitude,
                pose.trueHeadingDeg,
                {
                    kaaba: input.kaaba,
                    alignedToleranceDeg: isFiniteNumber(input.alignedToleranceDeg) ?
                        Math.abs(input.alignedToleranceDeg) : DEFAULT_ALIGNED_TOLERANCE_DEG
                }
            );

            var marginRatio = edgeMarginRatio(
                detection.x,
                detection.y,
                intrinsics.width,
                intrinsics.height
            );
            var gravityUp = Frames.negate(gravity.downCamera);
            var referenceSeparationDeg = angularSeparationDeg(cameraCelestialRay, gravityUp);
            var observationTimestamp = Math.max(
                detection.timestamp,
                gravity.timestamp,
                celestial.timestamp
            );

            var qualityInput = {
                detection: {
                    confidence: detection.confidence,
                    stableFrames: detection.stableFrames,
                    saturationRatio: detection.saturationRatio,
                    circularity: detection.circularity
                },
                gravity: {
                    quality: gravity.quality,
                    directionSpreadDeg: gravity.directionSpreadDeg,
                    ageMs: Math.abs(now - gravity.timestamp)
                },
                pose: {
                    quality: pose.confidence,
                    celestialResidualDeg: pose.celestialResidualDeg,
                    altitudeResidualDeg: pose.altitudeResidualDeg,
                    rotationIsOrthonormal: Frames.isOrthonormalMatrix(pose.rotationCameraToWorld, 1e-7)
                },
                projection: {
                    horizontalFovDeg: intrinsics.horizontalFovDeg,
                    verticalFovDeg: intrinsics.verticalFovDeg,
                    edgeMarginRatio: marginRatio,
                    insideFrame: true
                },
                timing: {
                    frameAgeMs: Math.abs(now - detection.timestamp),
                    observationSkewMs: Math.max(
                        detection.timestamp,
                        gravity.timestamp,
                        celestial.timestamp
                    ) - Math.min(
                        detection.timestamp,
                        gravity.timestamp,
                        celestial.timestamp
                    )
                },
                geometry: {
                    bodyAltitudeDeg: celestial.altitudeDeg,
                    referenceSeparationDeg: referenceSeparationDeg
                }
            };

            var quality = Quality.evaluate(qualityInput, input.qualityThresholds);
            var accepted = quality.accepted && pose.valid;

            return Object.freeze({
                version: VERSION,
                accepted: accepted,
                status: accepted ? 'accepted' : 'rejected',
                body: celestial.body,
                observationTimestamp: observationTimestamp,
                location: location,
                celestial: celestial,
                camera: Object.freeze({
                    intrinsics: intrinsics,
                    celestialRay: cameraCelestialRay,
                    angularOffsetDeg: Projection.angularOffsetFromOpticalAxis(cameraCelestialRay),
                    edgeMarginRatio: marginRatio
                }),
                gravity: gravity,
                worldCelestialVector: worldCelestialVector,
                pose: pose,
                trueCameraHeadingDeg: pose.trueHeadingDeg,
                qibla: relativeQibla,
                quality: quality,
                rejectionReason: accepted ? null :
                    (pose.rejectionReason ||
                        (quality.reasons.length ? quality.reasons[0].code : 'QUALITY_REJECTED'))
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

            function near(a, b, tolerance) {
                return Math.abs(a - b) <= (tolerance || 1e-6);
            }

            var now = 100000;
            var altitudeRad = 30 * Math.PI / 180;
            var result = solveObservation({
                now: now,
                location: { latitude: 30.0444, longitude: 31.2357 },
                celestial: {
                    body: 'sun',
                    azimuthDeg: 90,
                    altitudeDeg: 30,
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
            });

            assert('pipeline returns a finite true heading', isFiniteNumber(result.trueCameraHeadingDeg));
            assert('centered celestial body points camera toward body azimuth',
                near(result.trueCameraHeadingDeg, 90, 1e-5));
            assert('independent Qibla bearing is in Cairo expected range',
                result.qibla.qiblaBearingDeg > 135 && result.qibla.qiblaBearingDeg < 137.5);
            assert('pipeline result contains an orthonormal rotation',
                Frames.isOrthonormalMatrix(result.pose.rotationCameraToWorld));
            assert('pipeline uses no QT or compass result fields',
                !Object.prototype.hasOwnProperty.call(result, 'QT') &&
                !Object.prototype.hasOwnProperty.call(result, 'deviceHeading'));
            assert('nominal pipeline observation is accepted', result.accepted === true);

            var edgeResult = solveObservation({
                now: now,
                location: { latitude: 30.0444, longitude: 31.2357 },
                celestial: { azimuthDeg: 90, altitudeDeg: 30, timestamp: now },
                camera: { width: 1000, height: 750, horizontalFovDeg: 65 },
                detection: {
                    x: 10, y: 375, confidence: 0.96, frameCount: 18,
                    saturationRatio: 0.70, circularity: 0.90, timestamp: now
                },
                gravity: {
                    downCamera: { x: 0, y: -Math.cos(altitudeRad), z: -Math.sin(altitudeRad) },
                    quality: 0.96, directionSpreadDeg: 0.4, timestamp: now
                }
            });
            assert('body near image edge is rejected by quality gate', edgeResult.accepted === false);

            return Object.freeze({
                passed: passed,
                failed: failed,
                success: failed === 0,
                failures: failures
            });
        }

        return Object.freeze({
            VERSION: VERSION,
            DEFAULT_ALIGNED_TOLERANCE_DEG: DEFAULT_ALIGNED_TOLERANCE_DEG,
            edgeMarginRatio: edgeMarginRatio,
            solveObservation: solveObservation,
            runSelfTests: runSelfTests
        });
    });