// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Gravity Reference
// Stable gravity-vector acquisition and device-to-camera coordinate conversion.
// Uses no magnetometer, compass heading or magnetic declination.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./coordinate-frames.js'));
        return;
    }

    if (!root || !root.QiblaCoordinateFrames) {
        throw new Error('QiblaGravityReference requires QiblaCoordinateFrames.');
    }

    root.QiblaGravityReference = factory(root.QiblaCoordinateFrames);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Frames) {
    'use strict';

    var STANDARD_GRAVITY = 9.80665;
    var DEFAULT_SAMPLE_COUNT = 25;
    var DEFAULT_MIN_SAMPLES = 12;
    var DEFAULT_MAX_AGE_MS = 1200;
    var DEFAULT_MAX_DIRECTION_SPREAD_DEG = 2.5;
    var DEFAULT_MIN_NORM = 6.0;
    var DEFAULT_MAX_NORM = 13.5;
    var DEG_TO_RAD = Math.PI / 180;
    var RAD_TO_DEG = 180 / Math.PI;

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function normalizeQuarterTurn(value) {
        var angle = Number(value);
        if (!isFiniteNumber(angle)) angle = 0;
        angle = ((angle % 360) + 360) % 360;
        return (Math.round(angle / 90) * 90) % 360;
    }

    function median(values) {
        if (!Array.isArray(values) || values.length === 0) {
            throw new RangeError('median requires at least one value.');
        }
        var sorted = values.slice().sort(function (a, b) { return a - b; });
        var middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }

    function medianVector(samples) {
        if (!Array.isArray(samples) || samples.length === 0) {
            throw new RangeError('medianVector requires at least one sample.');
        }
        return Frames.vector(
            median(samples.map(function (sample) { return sample.x; })),
            median(samples.map(function (sample) { return sample.y; })),
            median(samples.map(function (sample) { return sample.z; }))
        );
    }

    function rotateDeviceVectorForScreen(vector, screenAngleDeg) {
        var angle = normalizeQuarterTurn(screenAngleDeg);
        switch (angle) {
        case 90:
            return Frames.vector(vector.y, -vector.x, vector.z);
        case 180:
            return Frames.vector(-vector.x, -vector.y, vector.z);
        case 270:
            return Frames.vector(-vector.y, vector.x, vector.z);
        default:
            return Frames.vector(vector.x, vector.y, vector.z);
        }
    }

    function deviceToCamera(vector, options) {
        var opts = options || {};
        var rotated = rotateDeviceVectorForScreen(vector, opts.screenAngleDeg || 0);
        var facingMode = opts.facingMode || 'environment';
        var cameraVector;

        if (facingMode === 'user') {
            cameraVector = Frames.vector(-rotated.x, rotated.y, rotated.z);
        } else {
            cameraVector = Frames.vector(rotated.x, rotated.y, -rotated.z);
        }

        if (opts.mountMatrix) {
            cameraVector = Frames.multiplyMatrixVector(opts.mountMatrix, cameraVector);
        }
        return cameraVector;
    }

    function angularSpreadDeg(unitVectors, center) {
        if (!unitVectors.length) return Infinity;
        var maximum = 0;
        for (var index = 0; index < unitVectors.length; index++) {
            var cosine = clamp(Frames.dot(unitVectors[index], center), -1, 1);
            maximum = Math.max(maximum, Math.acos(cosine) * RAD_TO_DEG);
        }
        return maximum;
    }

    function analyzeSamples(samples, options) {
        var opts = options || {};
        var minimumSamples = isFiniteNumber(opts.minSamples) ? Math.max(1, opts.minSamples) : DEFAULT_MIN_SAMPLES;
        var minimumNorm = isFiniteNumber(opts.minNorm) ? opts.minNorm : DEFAULT_MIN_NORM;
        var maximumNorm = isFiniteNumber(opts.maxNorm) ? opts.maxNorm : DEFAULT_MAX_NORM;
        var maximumSpread = isFiniteNumber(opts.maxDirectionSpreadDeg) ?
            Math.max(0, opts.maxDirectionSpreadDeg) : DEFAULT_MAX_DIRECTION_SPREAD_DEG;

        if (!Array.isArray(samples) || samples.length < minimumSamples) {
            return { valid: false, reason: 'INSUFFICIENT_SAMPLES', sampleCount: samples ? samples.length : 0 };
        }

        var vectors = [];
        var norms = [];
        for (var index = 0; index < samples.length; index++) {
            var sample = samples[index];
            if (!sample || !isFiniteNumber(sample.x) || !isFiniteNumber(sample.y) || !isFiniteNumber(sample.z)) continue;
            var vector = Frames.vector(sample.x, sample.y, sample.z);
            var norm = Frames.magnitude(vector);
            if (norm <= Frames.EPSILON) continue;
            vectors.push(vector);
            norms.push(norm);
        }

        if (vectors.length < minimumSamples) {
            return { valid: false, reason: 'INSUFFICIENT_VALID_SAMPLES', sampleCount: vectors.length };
        }

        var robustVector = medianVector(vectors);
        var robustNorm = Frames.magnitude(robustVector);
        if (robustNorm < minimumNorm || robustNorm > maximumNorm) {
            return {
                valid: false,
                reason: 'GRAVITY_NORM_OUT_OF_RANGE',
                sampleCount: vectors.length,
                norm: robustNorm
            };
        }

        var unitVectors = vectors.map(function (vector) { return Frames.normalize(vector); });
        var center = Frames.normalize(robustVector);
        var spreadDeg = angularSpreadDeg(unitVectors, center);
        var normMedian = median(norms);
        var normDeviation = median(norms.map(function (norm) { return Math.abs(norm - normMedian); }));
        var stable = spreadDeg <= maximumSpread;
        var quality = clamp(1 - (spreadDeg / Math.max(maximumSpread * 2, 0.1)), 0, 1);
        quality *= clamp(1 - normDeviation / 2.0, 0, 1);

        return {
            valid: stable,
            reason: stable ? null : 'DIRECTION_UNSTABLE',
            sampleCount: vectors.length,
            rawMedian: robustVector,
            downDevice: center,
            norm: robustNorm,
            normMedian: normMedian,
            normMad: normDeviation,
            directionSpreadDeg: spreadDeg,
            quality: quality
        };
    }

    function extractAccelerationIncludingGravity(event) {
        var source = event && event.accelerationIncludingGravity;
        if (!source || !isFiniteNumber(source.x) || !isFiniteNumber(source.y) || !isFiniteNumber(source.z)) {
            return null;
        }
        return Frames.vector(source.x, source.y, source.z);
    }

    function getScreenAngle() {
        if (typeof screen !== 'undefined' && screen.orientation && isFiniteNumber(screen.orientation.angle)) {
            return screen.orientation.angle;
        }
        if (typeof window !== 'undefined' && isFiniteNumber(window.orientation)) {
            return window.orientation;
        }
        return 0;
    }

    function GravityReference(options) {
        var opts = options || {};
        this.sampleCount = isFiniteNumber(opts.sampleCount) ? Math.max(3, Math.round(opts.sampleCount)) : DEFAULT_SAMPLE_COUNT;
        this.minSamples = isFiniteNumber(opts.minSamples) ? Math.max(3, Math.round(opts.minSamples)) : DEFAULT_MIN_SAMPLES;
        this.maxAgeMs = isFiniteNumber(opts.maxAgeMs) ? Math.max(100, opts.maxAgeMs) : DEFAULT_MAX_AGE_MS;
        this.maxDirectionSpreadDeg = isFiniteNumber(opts.maxDirectionSpreadDeg) ?
            Math.max(0.1, opts.maxDirectionSpreadDeg) : DEFAULT_MAX_DIRECTION_SPREAD_DEG;
        this.facingMode = opts.facingMode || 'environment';
        this.mountMatrix = opts.mountMatrix || null;
        this.samples = [];
        this.running = false;
        this._boundMotion = this._onMotion.bind(this);
    }

    GravityReference.isSupported = function () {
        return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    };

    GravityReference.requestPermission = function () {
        if (typeof DeviceMotionEvent === 'undefined') return Promise.resolve(false);
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            return DeviceMotionEvent.requestPermission().then(function (state) { return state === 'granted'; });
        }
        return Promise.resolve(true);
    };

    GravityReference.prototype._onMotion = function (event) {
        var vector = extractAccelerationIncludingGravity(event);
        if (!vector) return;
        var timestamp = isFiniteNumber(event.timeStamp) ? event.timeStamp : Date.now();
        this.samples.push({ x: vector.x, y: vector.y, z: vector.z, timestamp: timestamp });
        if (this.samples.length > this.sampleCount) {
            this.samples.splice(0, this.samples.length - this.sampleCount);
        }
    };

    GravityReference.prototype.start = function () {
        if (this.running) return true;
        if (!GravityReference.isSupported()) return false;
        window.addEventListener('devicemotion', this._boundMotion, { passive: true });
        this.running = true;
        return true;
    };

    GravityReference.prototype.stop = function () {
        if (!this.running) return;
        window.removeEventListener('devicemotion', this._boundMotion);
        this.running = false;
    };

    GravityReference.prototype.reset = function () {
        this.samples.length = 0;
    };

    GravityReference.prototype.getEstimate = function (options) {
        var opts = options || {};
        var now = isFiniteNumber(opts.now) ? opts.now : Date.now();
        var fresh = this.samples.filter(function (sample) {
            return !isFiniteNumber(sample.timestamp) || Math.abs(now - sample.timestamp) <= this.maxAgeMs;
        }, this);

        var analysis = analyzeSamples(fresh, {
            minSamples: this.minSamples,
            maxDirectionSpreadDeg: this.maxDirectionSpreadDeg,
            minNorm: opts.minNorm,
            maxNorm: opts.maxNorm
        });

        if (!analysis.valid) return analysis;

        var screenAngleDeg = isFiniteNumber(opts.screenAngleDeg) ? opts.screenAngleDeg : getScreenAngle();
        var downCamera = Frames.normalize(deviceToCamera(analysis.downDevice, {
            screenAngleDeg: screenAngleDeg,
            facingMode: opts.facingMode || this.facingMode,
            mountMatrix: opts.mountMatrix || this.mountMatrix
        }));

        return Object.assign({}, analysis, {
            screenAngleDeg: normalizeQuarterTurn(screenAngleDeg),
            downCamera: downCamera,
            upCamera: Frames.negate(downCamera)
        });
    };

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
            return Math.abs(a - b) <= (tolerance || 1e-8);
        }

        assert('quarter-turn normalization', normalizeQuarterTurn(451) === 90);
        assert('median odd count', median([9, 1, 5]) === 5);
        assert('median even count', median([1, 3, 5, 7]) === 4);

        var east = Frames.vector(1, 0, 0);
        assert('screen 90 rotation', Frames.vectorsNearlyEqual(
            rotateDeviceVectorForScreen(east, 90), Frames.vector(0, -1, 0)
        ));
        assert('screen 180 rotation', Frames.vectorsNearlyEqual(
            rotateDeviceVectorForScreen(east, 180), Frames.vector(-1, 0, 0)
        ));
        assert('rear camera reverses device z', Frames.vectorsNearlyEqual(
            deviceToCamera(Frames.vector(1, 2, 3), { facingMode: 'environment' }),
            Frames.vector(1, 2, -3)
        ));

        var stable = [];
        for (var index = 0; index < 20; index++) {
            stable.push({ x: 0.02 * Math.sin(index), y: -9.80 + 0.01 * Math.cos(index), z: 0.01 });
        }
        var stableResult = analyzeSamples(stable, { minSamples: 12, maxDirectionSpreadDeg: 2.5 });
        assert('stable gravity accepted', stableResult.valid === true);
        assert('stable vector is normalized', close(Frames.magnitude(stableResult.downDevice), 1, 1e-8));
        assert('stable quality is high', stableResult.quality > 0.8);

        var unstable = [];
        for (var angle = 0; angle < 20; angle++) {
            unstable.push({
                x: 9.8 * Math.sin(angle * 12 * DEG_TO_RAD),
                y: -9.8 * Math.cos(angle * 12 * DEG_TO_RAD),
                z: 0
            });
        }
        var unstableResult = analyzeSamples(unstable, { minSamples: 12, maxDirectionSpreadDeg: 2.5 });
        assert('moving device rejected', unstableResult.valid === false && unstableResult.reason === 'DIRECTION_UNSTABLE');

        var weak = stable.map(function () { return { x: 0, y: -1, z: 0 }; });
        var weakResult = analyzeSamples(weak, { minSamples: 12 });
        assert('invalid gravity norm rejected', weakResult.reason === 'GRAVITY_NORM_OUT_OF_RANGE');

        var estimateSource = new GravityReference({ minSamples: 12 });
        estimateSource.samples = stable.map(function (sample) {
            return { x: sample.x, y: sample.y, z: sample.z, timestamp: 1000 };
        });
        var estimate = estimateSource.getEstimate({ now: 1000, screenAngleDeg: 0 });
        assert('estimate includes camera up', estimate.valid && close(Frames.magnitude(estimate.upCamera), 1));
        assert('camera up opposes camera down', close(Frames.dot(estimate.upCamera, estimate.downCamera), -1));

        var stale = estimateSource.getEstimate({ now: 5000, screenAngleDeg: 0 });
        assert('stale samples rejected', stale.valid === false && stale.reason === 'INSUFFICIENT_SAMPLES');

        return { passed: passed, failed: failed, success: failed === 0, failures: failures };
    }

    return Object.freeze({
        STANDARD_GRAVITY: STANDARD_GRAVITY,
        DEFAULT_SAMPLE_COUNT: DEFAULT_SAMPLE_COUNT,
        DEFAULT_MIN_SAMPLES: DEFAULT_MIN_SAMPLES,
        median: median,
        medianVector: medianVector,
        normalizeQuarterTurn: normalizeQuarterTurn,
        rotateDeviceVectorForScreen: rotateDeviceVectorForScreen,
        deviceToCamera: deviceToCamera,
        analyzeSamples: analyzeSamples,
        extractAccelerationIncludingGravity: extractAccelerationIncludingGravity,
        GravityReference: GravityReference,
        runSelfTests: runSelfTests
    });
});
