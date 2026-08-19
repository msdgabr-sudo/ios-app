// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Astronomical Observation Bridge
// Connects camera frames, celestial detection, gravity, solver and Qibla-axis
// alignment. Uses no compass, magnetometer, device heading, QT or card text.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════
(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./celestial-detector.js'),
            require('./gravity-reference.js'),
            require('./astronomical-solver.js'),
            require('./qibla-alignment-reticle.js')
        );
        return;
    }
    if (!root || !root.QiblaCelestialDetector || !root.QiblaGravityReference ||
        !root.QiblaAstronomicalSolver || !root.QiblaAlignmentReticle) {
        throw new Error('QiblaAstronomicalObservationBridge dependencies are missing.');
    }
    root.QiblaAstronomicalObservationBridge = factory(
        root.QiblaCelestialDetector,
        root.QiblaGravityReference,
        root.QiblaAstronomicalSolver,
        root.QiblaAlignmentReticle
    );
})(typeof globalThis !== 'undefined' ? globalThis : this,
function (Detector, GravityModule, Solver, Reticle) {
    'use strict';

    var DEFAULTS = Object.freeze({
        facingMode: 'environment',
        width: 1280,
        height: 720,
        horizontalFovDeg: 65,
        frameIntervalMs: 100,
        solveCooldownMs: 500,
        alignmentToleranceDeg: 1,
        detectorOptions: null,
        gravityOptions: null,
        qualityThresholds: null
    });

    function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
    function merge(options) {
        var result = {}, key;
        for (key in DEFAULTS) result[key] = DEFAULTS[key];
        options = options || {};
        for (key in options) if (Object.prototype.hasOwnProperty.call(options, key)) result[key] = options[key];
        return result;
    }
    function requireFunction(value, name) {
        if (typeof value !== 'function') throw new TypeError(name + ' must be a function.');
        return value;
    }
    function createCanvas(width, height, suppliedCanvas) {
        var canvas = suppliedCanvas || null;
        if (!canvas) {
            if (typeof document === 'undefined' || !document.createElement) {
                throw new Error('A canvas must be supplied outside a browser environment.');
            }
            canvas = document.createElement('canvas');
        }
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    function cameraConstraints(config) {
        return {
            audio: false,
            video: {
                facingMode: { ideal: config.facingMode },
                width: { ideal: config.width },
                height: { ideal: config.height }
            }
        };
    }

    function immutableResult(base, target, evaluation, observation) {
        var result = {}, key;
        for (key in base) if (Object.prototype.hasOwnProperty.call(base, key)) result[key] = base[key];
        result.detection = base.detection || null;
        result.qiblaAlignmentTarget = target;
        result.qiblaAlignment = evaluation;
        result.astronomicalQiblaObservation = observation;
        result.accepted = !!(base.accepted && observation && evaluation && evaluation.aligned);
        result.status = result.accepted ? 'accepted' : 'rejected';
        if (!result.accepted && !result.rejectionReason) {
            result.rejectionReason = !target.visible
                ? target.reason
                : 'QIBLA_AXIS_NOT_ALIGNED';
        }
        return Object.freeze(result);
    }

    function AstronomicalObservationBridge(options) {
        var opts = merge(options);
        this.options = opts;
        this.video = opts.video || null;
        this.canvas = opts.canvas || null;
        this.context = null;
        this.stream = null;
        this.running = false;
        this.timer = null;
        this.lastSolveAt = 0;
        this.locationProvider = opts.locationProvider || null;
        this.celestialProvider = opts.celestialProvider || null;
        this.onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};
        this.onResult = typeof opts.onResult === 'function' ? opts.onResult : function () {};
        this.onError = typeof opts.onError === 'function' ? opts.onError : function () {};
        this.tracker = new Detector.Tracker(opts.detectorOptions || undefined);
        this.gravity = opts.gravityReference || new GravityModule.GravityReference(
            opts.gravityOptions || { facingMode: opts.facingMode }
        );
    }

    AstronomicalObservationBridge.isCameraSupported = function () {
        return typeof navigator !== 'undefined' && navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';
    };

    AstronomicalObservationBridge.prototype.setProviders = function (providers) {
        providers = providers || {};
        if (providers.locationProvider) {
            this.locationProvider = requireFunction(providers.locationProvider, 'locationProvider');
        }
        if (providers.celestialProvider) {
            this.celestialProvider = requireFunction(providers.celestialProvider, 'celestialProvider');
        }
    };

    AstronomicalObservationBridge.prototype._prepareMedia = async function () {
        if (!AstronomicalObservationBridge.isCameraSupported()) {
            throw new Error('Camera API is not supported in this environment.');
        }
        if (!this.video) {
            if (typeof document === 'undefined') throw new Error('A video element must be supplied.');
            this.video = document.createElement('video');
        }
        this.video.setAttribute('playsinline', '');
        this.video.muted = true;
        this.stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(this.options));
        this.video.srcObject = this.stream;
        await this.video.play();
        var width = this.video.videoWidth || this.options.width;
        var height = this.video.videoHeight || this.options.height;
        this.canvas = createCanvas(width, height, this.canvas);
        this.context = this.canvas.getContext('2d', { willReadFrequently: true });
        if (!this.context) throw new Error('Unable to create a 2D camera canvas context.');
    };

    AstronomicalObservationBridge.prototype.start = async function () {
        if (this.running) return true;
        requireFunction(this.locationProvider, 'locationProvider');
        requireFunction(this.celestialProvider, 'celestialProvider');
        var gravityAllowed = await GravityModule.GravityReference.requestPermission();
        if (!gravityAllowed) throw new Error('Motion permission was not granted.');
        if (!this.gravity.start()) throw new Error('Gravity reference is not supported.');
        try {
            await this._prepareMedia();
            this.running = true;
            this._scheduleNext(0);
            return true;
        } catch (error) {
            this.gravity.stop();
            this.stop();
            throw error;
        }
    };

    AstronomicalObservationBridge.prototype.stop = function () {
        this.running = false;
        if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
        this.gravity.stop();
        if (this.stream && this.stream.getTracks) {
            this.stream.getTracks().forEach(function (track) { track.stop(); });
        }
        this.stream = null;
        if (this.video) this.video.srcObject = null;
        this.tracker.reset();
    };

    AstronomicalObservationBridge.prototype._scheduleNext = function (delay) {
        var self = this;
        if (!this.running) return;
        this.timer = setTimeout(function () {
            self.processCurrentFrame().catch(function (error) {
                self.onError(error);
            }).finally(function () {
                self._scheduleNext(self.options.frameIntervalMs);
            });
        }, Math.max(0, delay));
    };

    AstronomicalObservationBridge.prototype._readFrame = function (timestamp) {
        if (!this.context || !this.video || this.video.readyState < 2) {
            return { found: false, reason: 'video-not-ready' };
        }
        var width = this.canvas.width;
        var height = this.canvas.height;
        this.context.drawImage(this.video, 0, 0, width, height);
        var imageData = this.context.getImageData(0, 0, width, height);
        return Detector.analyzeFrame(
            imageData.data,
            width,
            height,
            Object.assign({}, this.options.detectorOptions || {}, { timestamp: timestamp })
        );
    };

    AstronomicalObservationBridge.prototype.processCurrentFrame = async function (now) {
        now = finite(now) ? now : Date.now();
        var frameObservation = this._readFrame(now);
        var tracked = this.tracker.push(frameObservation);
        var gravity = this.gravity.getEstimate({ now: now, facingMode: this.options.facingMode });

        this.onProgress(Object.freeze({
            phase: tracked.stable ? (gravity.valid ? 'stable-detection' : 'gravity-not-ready') : 'detecting',
            frameObservation: frameObservation,
            trackedDetection: tracked,
            gravity: gravity
        }));

        if (!tracked.stable || !gravity.valid ||
            now - this.lastSolveAt < this.options.solveCooldownMs) return null;

        var location = await Promise.resolve(this.locationProvider(now));
        var celestial = await Promise.resolve(this.celestialProvider(now, location));
        var solved = Solver.solveObservation({
            now: now,
            location: location,
            celestial: celestial,
            camera: {
                width: this.canvas.width,
                height: this.canvas.height,
                horizontalFovDeg: this.options.horizontalFovDeg,
                rotationDeg: finite(this.options.rotationDeg) ? this.options.rotationDeg : 0
            },
            detection: tracked,
            gravity: {
                downCamera: gravity.downCamera,
                quality: gravity.quality,
                directionSpreadDeg: gravity.directionSpreadDeg,
                timestamp: gravity.timestamp || now
            },
            qualityThresholds: this.options.qualityThresholds
        });

        var target = Reticle.calculateTarget({
            celestialAzimuthDeg: celestial.azimuthDeg,
            referenceQiblaBearingDeg: solved.qibla.qiblaBearingDeg,
            camera: {
                width: this.canvas.width,
                height: this.canvas.height,
                horizontalFovDeg: this.options.horizontalFovDeg
            },
            marginPx: 24
        });
        var evaluation = Reticle.evaluateDetection(
            target,
            { x: Number(tracked.x) },
            this.options.alignmentToleranceDeg
        );
        var observation = null;
        if (solved.accepted && evaluation.aligned) {
            observation = Reticle.observedQiblaFromSolvedHeading(
                solved.trueCameraHeadingDeg,
                target,
                evaluation
            );
        }

        var solvedWithDetection = {}, key;
        for (key in solved) if (Object.prototype.hasOwnProperty.call(solved, key)) {
            solvedWithDetection[key] = solved[key];
        }
        solvedWithDetection.detection = Object.freeze({
            x: Number(tracked.x),
            y: Number(tracked.y),
            radiusPx: finite(Number(tracked.radiusPx)) ? Number(tracked.radiusPx) : null,
            confidence: finite(Number(tracked.confidence)) ? Number(tracked.confidence) : 0,
            stableFrames: finite(Number(tracked.stableFrames)) ? Number(tracked.stableFrames) :
                (finite(Number(tracked.frameCount)) ? Number(tracked.frameCount) : 0),
            timestamp: finite(Number(tracked.timestamp)) ? Number(tracked.timestamp) : now
        });

        var result = immutableResult(solvedWithDetection, target, evaluation, observation);
        this.lastSolveAt = now;
        this.onResult(result);
        return result;
    };

    AstronomicalObservationBridge.prototype.processImageData = async function (imageData, metadata) {
        metadata = metadata || {};
        if (!imageData || !imageData.data || !finite(imageData.width) || !finite(imageData.height)) {
            throw new TypeError('imageData with data, width and height is required.');
        }
        var now = finite(metadata.now) ? metadata.now : Date.now();
        var observation = Detector.analyzeFrame(
            imageData.data,
            imageData.width,
            imageData.height,
            Object.assign({}, this.options.detectorOptions || {}, { timestamp: now })
        );
        return this.tracker.push(observation);
    };

    return Object.freeze({
        DEFAULTS: DEFAULTS,
        cameraConstraints: cameraConstraints,
        AstronomicalObservationBridge: AstronomicalObservationBridge
    });
});
