// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Verification Quality
// Aggregates observation-quality signals and decides whether a celestial solve
// is safe to accept. Uses no compass, magnetometer, QT or magnetic correction.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    var api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QiblaVerificationQuality = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var DEFAULTS = Object.freeze({
        minimumOverallScore: 0.72,
        minimumDetectionConfidence: 0.68,
        maximumGravitySpreadDeg: 2.5,
        minimumGravityQuality: 0.68,
        maximumPoseResidualDeg: 2.0,
        minimumPoseQuality: 0.70,
        maximumFrameAgeMs: 900,
        maximumGravityAgeMs: 1200,
        minimumEdgeMarginRatio: 0.08,
        minimumFovDeg: 20,
        maximumFovDeg: 120,
        minimumBodyAltitudeDeg: 5,
        maximumBodyAltitudeDeg: 85,
        maximumTimingSkewMs: 750,
        minimumStableFrames: 8,
        minimumGeometrySeparationDeg: 8,
        maximumGeometrySeparationDeg: 172
    });

    var WEIGHTS = Object.freeze({
        detection: 0.22,
        gravity: 0.18,
        pose: 0.26,
        projection: 0.12,
        timing: 0.10,
        geometry: 0.12
    });

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function normalizeUnit(value, fallback) {
        if (!isFiniteNumber(value)) return isFiniteNumber(fallback) ? fallback : 0;
        return clamp(value, 0, 1);
    }

    function mergeOptions(options) {
        var result = {};
        var key;
        for (key in DEFAULTS) result[key] = DEFAULTS[key];
        if (options) {
            for (key in options) {
                if (Object.prototype.hasOwnProperty.call(options, key)) {
                    result[key] = options[key];
                }
            }
        }
        return result;
    }

    function addReason(collection, code, message, severity, details) {
        collection.push(Object.freeze({
            code: code,
            message: message,
            severity: severity || 'error',
            details: details || null
        }));
    }

    function thresholdDescending(value, goodAtOrBelow, rejectAbove) {
        if (!isFiniteNumber(value)) return 0;
        if (value <= goodAtOrBelow) return 1;
        if (value >= rejectAbove) return 0;
        return 1 - ((value - goodAtOrBelow) / (rejectAbove - goodAtOrBelow));
    }

    function thresholdAscending(value, rejectBelow, goodAtOrAbove) {
        if (!isFiniteNumber(value)) return 0;
        if (value <= rejectBelow) return 0;
        if (value >= goodAtOrAbove) return 1;
        return (value - rejectBelow) / (goodAtOrAbove - rejectBelow);
    }

    function scoreDetection(input, config, reasons) {
        var detection = input && input.detection ? input.detection : {};
        var confidence = normalizeUnit(detection.confidence, 0);
        var stableFrames = isFiniteNumber(detection.stableFrames) ? detection.stableFrames : 0;
        var saturation = normalizeUnit(detection.saturationRatio, 0);
        var circularity = normalizeUnit(detection.circularity, 1);

        if (confidence < config.minimumDetectionConfidence) {
            addReason(reasons, 'DETECTION_CONFIDENCE_LOW',
                'Celestial-body detection confidence is below the acceptance threshold.',
                'error', { value: confidence, minimum: config.minimumDetectionConfidence });
        }
        if (stableFrames < config.minimumStableFrames) {
            addReason(reasons, 'DETECTION_NOT_STABLE',
                'The celestial body was not stable for enough consecutive frames.',
                'error', { value: stableFrames, minimum: config.minimumStableFrames });
        }
        if (saturation > 0.92) {
            addReason(reasons, 'FRAME_OVEREXPOSED',
                'The detected region is excessively saturated.',
                'warning', { value: saturation });
        }
        if (circularity < 0.45) {
            addReason(reasons, 'BODY_SHAPE_UNCERTAIN',
                'The detected region is not sufficiently consistent with a celestial disc.',
                'warning', { value: circularity });
        }

        var stabilityScore = clamp(stableFrames / Math.max(config.minimumStableFrames, 1), 0, 1);
        var saturationScore = saturation <= 0.85 ? 1 : thresholdDescending(saturation, 0.85, 1);
        var shapeScore = thresholdAscending(circularity, 0.25, 0.75);

        return clamp(
            confidence * 0.55 +
            stabilityScore * 0.20 +
            saturationScore * 0.10 +
            shapeScore * 0.15,
            0, 1
        );
    }

    function scoreGravity(input, config, reasons) {
        var gravity = input && input.gravity ? input.gravity : {};
        var quality = normalizeUnit(gravity.quality, 0);
        var spread = gravity.directionSpreadDeg;
        var age = gravity.ageMs;

        if (quality < config.minimumGravityQuality) {
            addReason(reasons, 'GRAVITY_QUALITY_LOW',
                'Gravity reference quality is below the acceptance threshold.',
                'error', { value: quality, minimum: config.minimumGravityQuality });
        }
        if (!isFiniteNumber(spread) || spread > config.maximumGravitySpreadDeg) {
            addReason(reasons, 'DEVICE_NOT_STABLE',
                'The phone moved too much during the observation.',
                'error', { value: spread, maximum: config.maximumGravitySpreadDeg });
        }
        if (!isFiniteNumber(age) || age > config.maximumGravityAgeMs) {
            addReason(reasons, 'GRAVITY_REFERENCE_STALE',
                'The gravity reference is too old for this camera observation.',
                'error', { value: age, maximum: config.maximumGravityAgeMs });
        }

        var spreadScore = thresholdDescending(spread, config.maximumGravitySpreadDeg * 0.35,
            config.maximumGravitySpreadDeg);
        var ageScore = thresholdDescending(age, config.maximumGravityAgeMs * 0.4,
            config.maximumGravityAgeMs);

        return clamp(quality * 0.55 + spreadScore * 0.30 + ageScore * 0.15, 0, 1);
    }

    function scorePose(input, config, reasons) {
        var pose = input && input.pose ? input.pose : {};
        var quality = normalizeUnit(pose.quality, 0);
        var bodyResidual = pose.celestialResidualDeg;
        var altitudeResidual = pose.altitudeResidualDeg;
        var orthonormal = pose.rotationIsOrthonormal !== false;

        if (!orthonormal) {
            addReason(reasons, 'POSE_ROTATION_INVALID',
                'The computed camera rotation matrix is not orthonormal.', 'error');
        }
        if (quality < config.minimumPoseQuality) {
            addReason(reasons, 'POSE_QUALITY_LOW',
                'Camera-pose quality is below the acceptance threshold.',
                'error', { value: quality, minimum: config.minimumPoseQuality });
        }
        if (!isFiniteNumber(bodyResidual) || bodyResidual > config.maximumPoseResidualDeg) {
            addReason(reasons, 'CELESTIAL_RESIDUAL_HIGH',
                'The solved camera pose does not reproduce the observed celestial ray accurately enough.',
                'error', { value: bodyResidual, maximum: config.maximumPoseResidualDeg });
        }
        if (!isFiniteNumber(altitudeResidual) || altitudeResidual > config.maximumPoseResidualDeg) {
            addReason(reasons, 'ALTITUDE_RESIDUAL_HIGH',
                'The solved altitude is inconsistent with the astronomical altitude.',
                'error', { value: altitudeResidual, maximum: config.maximumPoseResidualDeg });
        }

        var bodyScore = thresholdDescending(bodyResidual,
            config.maximumPoseResidualDeg * 0.25, config.maximumPoseResidualDeg);
        var altitudeScore = thresholdDescending(altitudeResidual,
            config.maximumPoseResidualDeg * 0.25, config.maximumPoseResidualDeg);

        return clamp(quality * 0.50 + bodyScore * 0.25 + altitudeScore * 0.20 +
            (orthonormal ? 0.05 : 0), 0, 1);
    }

    function scoreProjection(input, config, reasons) {
        var projection = input && input.projection ? input.projection : {};
        var fovH = projection.horizontalFovDeg;
        var fovV = projection.verticalFovDeg;
        var edgeMargin = projection.edgeMarginRatio;
        var inside = projection.insideFrame !== false;

        if (!inside) {
            addReason(reasons, 'BODY_OUTSIDE_FRAME',
                'The detected celestial body is outside the valid image area.', 'error');
        }
        if (!isFiniteNumber(fovH) || fovH < config.minimumFovDeg || fovH > config.maximumFovDeg ||
            !isFiniteNumber(fovV) || fovV < config.minimumFovDeg * 0.5 || fovV > config.maximumFovDeg) {
            addReason(reasons, 'FOV_INVALID',
                'Camera field-of-view parameters are missing or outside safe limits.',
                'error', { horizontal: fovH, vertical: fovV });
        }
        if (!isFiniteNumber(edgeMargin) || edgeMargin < config.minimumEdgeMarginRatio) {
            addReason(reasons, 'BODY_TOO_CLOSE_TO_EDGE',
                'The celestial body is too close to the image edge for a reliable projection.',
                'error', { value: edgeMargin, minimum: config.minimumEdgeMarginRatio });
        }

        var edgeScore = thresholdAscending(edgeMargin, 0, config.minimumEdgeMarginRatio * 2);
        var fovScore = (isFiniteNumber(fovH) && isFiniteNumber(fovV)) ? 1 : 0;
        return clamp((inside ? 0.35 : 0) + edgeScore * 0.45 + fovScore * 0.20, 0, 1);
    }

    function scoreTiming(input, config, reasons) {
        var timing = input && input.timing ? input.timing : {};
        var frameAge = timing.frameAgeMs;
        var skew = timing.observationSkewMs;

        if (!isFiniteNumber(frameAge) || frameAge > config.maximumFrameAgeMs) {
            addReason(reasons, 'FRAME_STALE',
                'The camera frame is too old for the astronomical timestamp.',
                'error', { value: frameAge, maximum: config.maximumFrameAgeMs });
        }
        if (!isFiniteNumber(skew) || Math.abs(skew) > config.maximumTimingSkewMs) {
            addReason(reasons, 'TIMING_SKEW_HIGH',
                'Camera, gravity and astronomical timestamps are not sufficiently synchronized.',
                'error', { value: skew, maximum: config.maximumTimingSkewMs });
        }

        var frameScore = thresholdDescending(frameAge,
            config.maximumFrameAgeMs * 0.35, config.maximumFrameAgeMs);
        var skewScore = thresholdDescending(Math.abs(skew),
            config.maximumTimingSkewMs * 0.25, config.maximumTimingSkewMs);
        return clamp(frameScore * 0.55 + skewScore * 0.45, 0, 1);
    }

    function scoreGeometry(input, config, reasons) {
        var geometry = input && input.geometry ? input.geometry : {};
        var altitude = geometry.bodyAltitudeDeg;
        var separation = geometry.referenceSeparationDeg;

        if (!isFiniteNumber(altitude) || altitude < config.minimumBodyAltitudeDeg ||
            altitude > config.maximumBodyAltitudeDeg) {
            addReason(reasons, 'BODY_ALTITUDE_UNSAFE',
                'The celestial body altitude is outside the reliable solving range.',
                'error', { value: altitude, minimum: config.minimumBodyAltitudeDeg,
                    maximum: config.maximumBodyAltitudeDeg });
        }
        if (!isFiniteNumber(separation) || separation < config.minimumGeometrySeparationDeg ||
            separation > config.maximumGeometrySeparationDeg) {
            addReason(reasons, 'GEOMETRY_DEGENERATE',
                'The celestial ray and gravity reference are too close to parallel.',
                'error', { value: separation, minimum: config.minimumGeometrySeparationDeg,
                    maximum: config.maximumGeometrySeparationDeg });
        }

        var altitudeMid = (config.minimumBodyAltitudeDeg + config.maximumBodyAltitudeDeg) / 2;
        var altitudeHalf = (config.maximumBodyAltitudeDeg - config.minimumBodyAltitudeDeg) / 2;
        var altitudeScore = isFiniteNumber(altitude) ?
            clamp(1 - Math.abs(altitude - altitudeMid) / Math.max(altitudeHalf, 1), 0, 1) : 0;
        altitudeScore = 0.45 + altitudeScore * 0.55;

        var separationScore = thresholdAscending(separation,
            config.minimumGeometrySeparationDeg,
            Math.min(45, config.maximumGeometrySeparationDeg));
        if (isFiniteNumber(separation) && separation > 90) {
            separationScore = thresholdDescending(separation, 135,
                config.maximumGeometrySeparationDeg);
        }

        return clamp(altitudeScore * 0.40 + separationScore * 0.60, 0, 1);
    }

    function evaluate(input, options) {
        var config = mergeOptions(options);
        var reasons = [];

        var scores = Object.freeze({
            detection: scoreDetection(input, config, reasons),
            gravity: scoreGravity(input, config, reasons),
            pose: scorePose(input, config, reasons),
            projection: scoreProjection(input, config, reasons),
            timing: scoreTiming(input, config, reasons),
            geometry: scoreGeometry(input, config, reasons)
        });

        var overall =
            scores.detection * WEIGHTS.detection +
            scores.gravity * WEIGHTS.gravity +
            scores.pose * WEIGHTS.pose +
            scores.projection * WEIGHTS.projection +
            scores.timing * WEIGHTS.timing +
            scores.geometry * WEIGHTS.geometry;

        overall = clamp(overall, 0, 1);
        var hasFatalReason = reasons.some(function (reason) { return reason.severity === 'error'; });

        if (overall < config.minimumOverallScore) {
            addReason(reasons, 'OVERALL_SCORE_LOW',
                'The combined verification quality is below the acceptance threshold.',
                'error', { value: overall, minimum: config.minimumOverallScore });
            hasFatalReason = true;
        }

        var accepted = !hasFatalReason;
        var grade = overall >= 0.90 ? 'excellent' :
            overall >= 0.80 ? 'good' :
                overall >= config.minimumOverallScore ? 'marginal' : 'rejected';

        return Object.freeze({
            accepted: accepted,
            overallScore: overall,
            grade: grade,
            scores: scores,
            reasons: Object.freeze(reasons.slice()),
            thresholds: Object.freeze(config)
        });
    }

    function createNominalObservation() {
        return {
            detection: {
                confidence: 0.94,
                stableFrames: 18,
                saturationRatio: 0.70,
                circularity: 0.88
            },
            gravity: {
                quality: 0.94,
                directionSpreadDeg: 0.6,
                ageMs: 180
            },
            pose: {
                quality: 0.95,
                celestialResidualDeg: 0.25,
                altitudeResidualDeg: 0.35,
                rotationIsOrthonormal: true
            },
            projection: {
                horizontalFovDeg: 65,
                verticalFovDeg: 43,
                edgeMarginRatio: 0.22,
                insideFrame: true
            },
            timing: {
                frameAgeMs: 120,
                observationSkewMs: 80
            },
            geometry: {
                bodyAltitudeDeg: 35,
                referenceSeparationDeg: 55
            }
        };
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

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        var nominal = createNominalObservation();
        var nominalResult = evaluate(nominal);
        assert('nominal observation is accepted', nominalResult.accepted);
        assert('nominal observation has high score', nominalResult.overallScore > 0.85);
        assert('nominal observation has no fatal reasons',
            !nominalResult.reasons.some(function (reason) { return reason.severity === 'error'; }));

        var lowDetection = clone(nominal);
        lowDetection.detection.confidence = 0.3;
        assert('low detection confidence is rejected', !evaluate(lowDetection).accepted);

        var moving = clone(nominal);
        moving.gravity.directionSpreadDeg = 6;
        assert('moving phone is rejected', !evaluate(moving).accepted);

        var staleGravity = clone(nominal);
        staleGravity.gravity.ageMs = 3000;
        assert('stale gravity is rejected', !evaluate(staleGravity).accepted);

        var badPose = clone(nominal);
        badPose.pose.celestialResidualDeg = 4;
        assert('high celestial residual is rejected', !evaluate(badPose).accepted);

        var invalidRotation = clone(nominal);
        invalidRotation.pose.rotationIsOrthonormal = false;
        assert('invalid rotation matrix is rejected', !evaluate(invalidRotation).accepted);

        var edge = clone(nominal);
        edge.projection.edgeMarginRatio = 0.01;
        assert('body near frame edge is rejected', !evaluate(edge).accepted);

        var staleFrame = clone(nominal);
        staleFrame.timing.frameAgeMs = 1500;
        assert('stale frame is rejected', !evaluate(staleFrame).accepted);

        var badSkew = clone(nominal);
        badSkew.timing.observationSkewMs = -1200;
        assert('large timing skew is rejected', !evaluate(badSkew).accepted);

        var zenith = clone(nominal);
        zenith.geometry.bodyAltitudeDeg = 89;
        assert('body too close to zenith is rejected', !evaluate(zenith).accepted);

        var parallel = clone(nominal);
        parallel.geometry.referenceSeparationDeg = 3;
        assert('degenerate reference geometry is rejected', !evaluate(parallel).accepted);

        var custom = clone(nominal);
        custom.detection.confidence = 0.60;
        assert('custom threshold can accept lower detector confidence',
            evaluate(custom, { minimumDetectionConfidence: 0.55, minimumOverallScore: 0.60 }).accepted);

        return {
            passed: passed,
            failed: failed,
            success: failed === 0,
            failures: failures
        };
    }

    return Object.freeze({
        DEFAULTS: DEFAULTS,
        WEIGHTS: WEIGHTS,
        evaluate: evaluate,
        createNominalObservation: createNominalObservation,
        runSelfTests: runSelfTests
    });
});