/*
 * QiblaAstro — Astronomical Verification Session Controller
 * Android-safe production capture: freeze -> solve -> record -> stop -> compass.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(null, null, require('./astronomical-verification-store.js'), null);
    return;
  }
  root.QiblaAstronomicalVerificationSession = factory(root.QiblaAstronomicalObservationBridge, root.QiblaAstronomicalObservatoryUI, root.QiblaAstronomicalVerificationStore, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (BridgeModule, UiModule, Store, root) {
  'use strict';

  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function angleDiff(a, b) { return ((Number(a) - Number(b)) % 360 + 540) % 360 - 180; }
  function normalize360(value) { var n=Number(value)%360; return n<0?n+360:n; }

  function RelativeYawTracker(host, provider) {
    this.host=host||null; this.provider=typeof provider==='function'?provider:null;
    this.yawDeg=NaN; this.sampleCount=0; this.running=false; this._bound=this._onOrientation.bind(this);
  }
  RelativeYawTracker.prototype._read=function(event){
    if(this.provider){var supplied=Number(this.provider());return finite(supplied)?normalize360(supplied):NaN;}
    if(event&&finite(Number(event.alpha)))return normalize360(360-Number(event.alpha));
    return NaN;
  };
  RelativeYawTracker.prototype._onOrientation=function(event){var yaw=this._read(event);if(finite(yaw)){this.yawDeg=yaw;this.sampleCount++;}};
  RelativeYawTracker.prototype.start=async function(){
    if(this.running)return true;
    var h=this.host;if(this.provider){this.yawDeg=this._read(null);this.running=true;return finite(this.yawDeg);}
    if(!h||typeof h.addEventListener!=='function')return false;
    try{var C=h.DeviceOrientationEvent;if(C&&typeof C.requestPermission==='function'){var p=await C.requestPermission();if(p!=='granted')return false;}}catch(_){return false;}
    h.addEventListener('deviceorientation',this._bound,true);
    h.addEventListener('deviceorientationabsolute',this._bound,true);
    this.running=true;return true;
  };
  RelativeYawTracker.prototype.stop=function(){if(this.running&&this.host&&typeof this.host.removeEventListener==='function'){this.host.removeEventListener('deviceorientation',this._bound,true);this.host.removeEventListener('deviceorientationabsolute',this._bound,true);}this.running=false;};
  RelativeYawTracker.prototype.read=function(){if(this.provider){var v=this._read(null);if(finite(v))this.yawDeg=v;}return this.yawDeg;};

  function buildAnchoredHeading(anchorTrueHeadingDeg, anchorYawDeg, currentYawDeg) {
    if(!finite(Number(anchorTrueHeadingDeg))||!finite(Number(anchorYawDeg))||!finite(Number(currentYawDeg)))return NaN;
    return normalize360(Number(anchorTrueHeadingDeg)+angleDiff(Number(currentYawDeg),Number(anchorYawDeg)));
  }
  function merge(a, b) {
    var out = {}, key;
    a = a || {}; b = b || {};
    for (key in a) if (Object.prototype.hasOwnProperty.call(a, key)) out[key] = a[key];
    for (key in b) if (Object.prototype.hasOwnProperty.call(b, key)) out[key] = b[key];
    return out;
  }

  async function waitForFrozenCapture(ui, timeoutMs) {
    var started = Date.now();
    var timeout = finite(Number(timeoutMs)) ? Number(timeoutMs) : 6000;
    var captureSeen = false;
    while (Date.now() - started < timeout) {
      if (!ui) return false;
      var state = String(ui.state || '');
      if (ui.captureInProgress || state === 'CAPTURING' || state === 'CAPTURED' || state === 'RESULT') captureSeen = true;

      /* CAPTURED is emitted only after _freezeFrame() succeeds. The is-frozen
         CSS class is added later by showResult(), so requiring it here creates
         a circular wait between recording and result display. */
      if (captureSeen && !ui.captureInProgress && (state === 'CAPTURED' || state === 'RESULT')) return true;
      if (state === 'CLOSED' || state === 'CLOSING') return false;
      await sleep(25);
    }
    return false;
  }

  function defaultLocationProvider() { throw new Error('A raw GNSS location provider is required.'); }
  function positionValue(p, a, b) {
    if (!p) return NaN;
    var value = Number(p[a]);
    return !finite(value) && b ? Number(p[b]) : value;
  }
  function defaultCelestialProvider(body, now) {
    var position;
    if (body === 'sun') {
      if (typeof sunPos !== 'function') throw new Error('sunPos is unavailable.');
      position = sunPos(new Date(now));
    } else {
      if (typeof moonPos !== 'function') throw new Error('moonPos is unavailable.');
      position = moonPos(new Date(now));
    }
    var azimuth = positionValue(position, 'az', 'azApp');
    var altitude = positionValue(position, 'alt', 'altApp');
    if (!finite(azimuth) || !finite(altitude)) throw new Error('Celestial position is unavailable.');
    return { azimuthDeg: azimuth, altitudeDeg: altitude, body: body, timestamp: now };
  }
  function chooseBody(now) {
    now = finite(now) ? now : Date.now();
    var choices = [];
    try {
      var moon = defaultCelestialProvider('moon', now);
      if (moon.altitudeDeg > 5) choices.push({ body: 'moon', altitudeDeg: moon.altitudeDeg });
    } catch (_) {}
    try {
      var sun = defaultCelestialProvider('sun', now);
      if (sun.altitudeDeg > 5) choices.push({ body: 'sun', altitudeDeg: sun.altitudeDeg });
    } catch (_) {}
    choices.sort(function (a, b) {
      if (a.body === 'moon' && b.body !== 'moon') return -1;
      if (b.body === 'moon' && a.body !== 'moon') return 1;
      return b.altitudeDeg - a.altitudeDeg;
    });
    return choices[0] || null;
  }

  function mapProgress(progress, latestResult, frameSize) {
    progress = progress || {};
    var tracked = progress.trackedDetection || {};
    var observation = progress.frameObservation || {};
    var gravity = progress.gravity || (latestResult && latestResult.gravity) || {};
    var confidence = Number(tracked.confidence || observation.confidence || 0);
    var gravityQuality = Number(gravity.quality || 0);
    var solved = latestResult && latestResult.quality ? Number(latestResult.quality.overallScore) : NaN;
    var quality = finite(solved) ? solved : Math.max(0, Math.min(1, confidence * 0.68 + gravityQuality * 0.32));
    return {
      detection: {
        found: observation.found !== false && finite(Number(observation.x)) && finite(Number(observation.y)),
        x: Number(observation.x), y: Number(observation.y),
        radiusPx: Number(observation.radiusPx || tracked.radiusPx || 12),
        confidence: confidence, frameWidth: frameSize.width, frameHeight: frameSize.height
      },
      gravity: { quality: gravityQuality }, quality: quality,
      headingDeg: latestResult ? Number(latestResult.trueCameraHeadingDeg) : NaN,
      alignmentTarget: latestResult && latestResult.qiblaAlignmentTarget ? latestResult.qiblaAlignmentTarget : null,
      alignmentReady: !!(latestResult && latestResult.accepted && latestResult.astronomicalQiblaObservation && latestResult.astronomicalQiblaObservation.source === 'astronomical-qibla-alignment-observation')
    };
  }

  function mapResult(result, body, location, captureMode) {
    if (!result || !result.accepted) return null;
    var observation = result.astronomicalQiblaObservation;
    if (!observation || observation.source !== 'astronomical-qibla-alignment-observation') return null;
    var heading = Number(result.trueCameraHeadingDeg);
    var observed = Number(observation.observedQiblaBearingDeg);
    var reference = Number(observation.referenceQiblaBearingDeg);
    var offset = Number(observation.verificationOffsetDeg);
    if (!finite(heading) || !finite(observed) || !finite(reference) || !finite(offset)) return null;
    if (Math.abs(angleDiff(observed, heading)) > 1e-7) return null;
    return {
      body: body,
      headingDeg: heading,
      trueCameraHeadingDeg: heading,
      observedQiblaBearingDeg: observed,
      referenceQiblaBearingDeg: reference,
      verificationOffsetDeg: offset,
      reticleResidualDeg: finite(Number(observation.reticleResidualDeg)) ? Number(observation.reticleResidualDeg) : 0,
      quality: Number(result.quality && result.quality.overallScore || 0),
      detectionConfidence: Number(result.detection && result.detection.confidence || 0),
      gravityQuality: Number(result.gravity && result.gravity.quality || 0),
      targetAzDeg: result.celestial ? Number(result.celestial.azimuthDeg) : null,
      targetAltDeg: result.celestial ? Number(result.celestial.altitudeDeg) : null,
      latitude: location.latitude, longitude: location.longitude,
      timestamp: Date.now(), captureMode: captureMode === 'manual' ? 'manual' : 'auto',
      alignmentMode: result.alignmentMode || 'qibla-axis', rawResult: result
    };
  }

  function navigateToCompass() {
    if (!root || !root.document) return;
    try { if (typeof root.showPage === 'function') { root.showPage('compass'); return; } } catch (_) {}
    var selectors = ['#nav-compass', '#bottom-nav-compass', '[data-page="compass"]', '[data-target="compass"]', '[href="#compass"]', '[onclick*="compass"]'];
    for (var i = 0; i < selectors.length; i++) {
      var button = root.document.querySelector(selectors[i]);
      if (button && typeof button.click === 'function') {
        try { button.click(); return; } catch (_) {}
      }
    }
    var page = root.document.getElementById('page-compass');
    if (page) {
      var active = root.document.querySelectorAll('.page.active');
      for (var j = 0; j < active.length; j++) active[j].classList.remove('active');
      page.classList.add('active');
    }
  }

  function VerificationSession(options) {
    options = options || {};
    if (!BridgeModule || !BridgeModule.AstronomicalObservationBridge) throw new Error('Observation bridge is missing.');
    if (!UiModule || !UiModule.ObservatoryUI) throw new Error('Observatory UI is missing.');
    if (!Store) throw new Error('Verification store is missing.');
    this.options = options;
    this.body = options.body || null;
    this.locationProvider = options.locationProvider || defaultLocationProvider;
    this.celestialProvider = options.celestialProvider || defaultCelestialProvider;
    this.onAccepted = typeof options.onAccepted === 'function' ? options.onAccepted : function () {};
    this.onClosed = typeof options.onClosed === 'function' ? options.onClosed : function () {};
    this.onError = typeof options.onError === 'function' ? options.onError : function () {};
    this.bridge = null;
    this.ui = null;
    this.running = false;
    this.latestResult = null;
    this.latestMappedResult = null;
    this.location = null;
    this.captureMode = options.autoCapture === false ? 'manual' : 'auto';
    this._captureFinalizing = false;
    this._closed = false;
    this.phase = 'OBSERVE_CELESTIAL';
    this.yawTracker = new RelativeYawTracker(root, options.relativeYawProvider);
    this.headingAnchor = null;
    this.anchorCandidate = null;
    this.anchorStableCount = 0;
    this.alignmentHoldSince = 0;
  }

  VerificationSession.prototype._createUi = function () {
    var self = this;
    this.ui = new UiModule.ObservatoryUI({
      body: this.body,
      autoCapture: this.captureMode === 'auto',
      autoHoldMs: this.body === 'sun' ? 700 : 900,
      countdownSeconds: 2,
      minQuality: this.body === 'sun' ? 0.32 : 0.40,
      minStability: this.body === 'sun' ? 0.56 : 0.62,
      onBack: function () { self.stop('back'); },
      onManualCapture: function () { self._finalizeCapture('manual'); },
      onAutoCapture: function () { self._finalizeCapture('auto'); },
      onAccept: function (result) { return self.accept(result); },
      onRetry: function () {
        self.latestResult = null;
        self.latestMappedResult = null;
        self._captureFinalizing = false;
        self.phase = 'OBSERVE_CELESTIAL';
        self.headingAnchor = null;
        self.anchorCandidate = null;
        self.anchorStableCount = 0;
      }
    });
  };

  VerificationSession.prototype._createBridge = function () {
    var self = this;
    var isSun = this.body === 'sun';

    /*
     * The Moon and Sun must not share one detector profile.
     * The Moon is normally a compact bright disk. A phone camera renders the Sun
     * as a saturated core surrounded by a much larger flare/halo. The old Moon
     * profile rejected that halo by area/circularity, so tracking never started.
     */
    var bodyDetectorProfile = isSun ? {
      sampleStep: 2,
      minimumLuminance: 205,
      relativeThreshold: 0.88,
      minimumAreaRatio: 0.0000005,
      maximumAreaRatio: 0.18,
      minimumCircularity: 0.03,
      maximumEccentricity: 0.995,
      edgeMarginRatio: 0.015,
      minimumStableFrames: 3,
      historySize: 10,
      maximumFrameAgeMs: 2200,
      maximumCentroidSpreadPx: 24
    } : {
      sampleStep: 2,
      minimumLuminance: 185,
      relativeThreshold: 0.72,
      minimumAreaRatio: 0.000001,
      maximumAreaRatio: 0.04,
      minimumCircularity: 0.12,
      maximumEccentricity: 0.97,
      edgeMarginRatio: 0.025,
      minimumStableFrames: 5,
      historySize: 12,
      maximumFrameAgeMs: 1800,
      maximumCentroidSpreadPx: 14
    };

    var detectorOptions = merge(bodyDetectorProfile, this.options.detectorOptions);
    var gravityOptions = merge({
      minSamples: 8,
      sampleCount: 40,
      maxAgeMs: 2500,
      maxDirectionSpreadDeg: isSun ? 7.5 : 6.5,
      facingMode: 'environment'
    }, this.options.gravityOptions);
    var qualityThresholds = merge({
      minimumOverallScore: isSun ? 0.42 : 0.58,
      minimumDetectionConfidence: isSun ? 0.38 : 0.60,
      minimumGravityQuality: isSun ? 0.45 : 0.52,
      maximumGravitySpreadDeg: isSun ? 7.5 : 6.5,
      minimumPoseQuality: isSun ? 0.56 : 0.65,
      minimumStableFrames: isSun ? 3 : 5,
      maximumFrameAgeMs: isSun ? 2200 : 1800,
      maximumGravityAgeMs: 2500,
      maximumTimingSkewMs: isSun ? 2200 : 1800
    }, this.options.qualityThresholds);

    this.bridge = new BridgeModule.AstronomicalObservationBridge({
      video: this.ui.video,
      horizontalFovDeg: finite(Number(this.options.horizontalFovDeg)) ? Number(this.options.horizontalFovDeg) : 65,
      alignmentToleranceDeg: finite(Number(this.options.alignmentToleranceDeg)) ? Math.abs(Number(this.options.alignmentToleranceDeg)) : 1,
      detectorOptions: detectorOptions,
      gravityOptions: gravityOptions,
      qualityThresholds: qualityThresholds,
      locationProvider: function (now) {
        return Promise.resolve(self.locationProvider(now)).then(function (location) {
          self.location = location;
          return location;
        });
      },
      celestialProvider: function (now, location) { return self.celestialProvider(self.body, now, location); },
      onProgress: function (progress) {
        if (!self.ui || !self.bridge || self._captureFinalizing || self._closed) return;
        var canvas = self.bridge.canvas || { width: 1, height: 1 };
        var frameSize={width:Number(canvas.width||1),height:Number(canvas.height||1)};
        if(self.phase==='CAPTURE_RAW'&&self.latestMappedResult){
          var rawProgress=mapProgress(progress,self.latestResult,frameSize);
          rawProgress.alignmentReady=true;
          rawProgress.phase='CAPTURE_RAW';
          rawProgress.headingDeg=self.latestMappedResult.trueCameraHeadingDeg;
          self.ui.update(rawProgress);
          return;
        }
        self.ui.update(mapProgress(progress, self.latestResult, frameSize));
      },
      onResult: function (result) {
        if (self._closed) return;
        self.latestResult = result;
        if(self.phase==='OBSERVE_CELESTIAL'){
          var yaw=self.yawTracker.read();
          var reference=Number(result&&result.qibla&&result.qibla.qiblaBearingDeg);
          var heading=Number(result&&result.trueCameraHeadingDeg);
          var detectionConfidence=Number(result&&result.detection&&result.detection.confidence||0);
          var gravityQuality=Number(result&&result.gravity&&result.gravity.quality||0);
          var quality=Number(result&&result.quality&&result.quality.overallScore||0);
          var validAnchor=!!(result&&finite(heading)&&finite(reference)&&finite(yaw)&&self.yawTracker.sampleCount>=2&&detectionConfidence>=0.50&&gravityQuality>=0.40&&quality>=0.45);
          if(root){root.__qiblaAstroAnchorDebug={valid:validAnchor,accepted:!!(result&&result.accepted),heading:heading,reference:reference,yaw:yaw,yawSamples:self.yawTracker.sampleCount,detectionConfidence:detectionConfidence,gravityQuality:gravityQuality,quality:quality,stableCount:self.anchorStableCount,phase:self.phase};}
          if(validAnchor){
            if(self.anchorCandidate&&Math.abs(angleDiff(heading,self.anchorCandidate.trueHeadingDeg))<=2.5&&Math.abs(angleDiff(yaw,self.anchorCandidate.yawDeg))<=4.0){
              self.anchorStableCount++;
            }else{
              self.anchorStableCount=1;
            }
            self.anchorCandidate={
              trueHeadingDeg:heading,yawDeg:yaw,referenceQiblaBearingDeg:normalize360(reference),
              quality:quality,detectionConfidence:detectionConfidence,gravityQuality:gravityQuality,
              targetAzDeg:Number(result.celestial&&result.celestial.azimuthDeg),targetAltDeg:Number(result.celestial&&result.celestial.altitudeDeg)
            };
            if(self.anchorStableCount>=3){
              self.headingAnchor=self.anchorCandidate;
              self.latestMappedResult={
                body:self.body,
                headingDeg:heading,
                trueCameraHeadingDeg:heading,
                observedQiblaBearingDeg:normalize360(reference),
                referenceQiblaBearingDeg:normalize360(reference),
                verificationOffsetDeg:angleDiff(reference,heading),
                reticleResidualDeg:0,
                quality:quality,
                detectionConfidence:detectionConfidence,
                gravityQuality:gravityQuality,
                targetAzDeg:Number(result.celestial&&result.celestial.azimuthDeg),
                targetAltDeg:Number(result.celestial&&result.celestial.altitudeDeg),
                latitude:self.location&&self.location.latitude,
                longitude:self.location&&self.location.longitude,
                timestamp:Date.now(),
                captureMode:self.captureMode,
                alignmentMode:'astronomical-solved-bearing'
              };
              self.phase='CAPTURE_RAW';
              if(self.ui&&!self._captureFinalizing){
                self.ui.update({
                  detection:merge(result.detection||{},{found:true,frameWidth:self.bridge.canvas?self.bridge.canvas.width:1,frameHeight:self.bridge.canvas?self.bridge.canvas.height:1}),
                  gravity:result.gravity||{},quality:quality,headingDeg:heading,
                  alignmentReady:true,phase:'CAPTURE_RAW'
                });
              }
            }
          }else{
            self.anchorCandidate=null;
            self.anchorStableCount=0;
          }
        }
        self.latestMappedResult = self.phase==='OBSERVE_CELESTIAL'?mapResult(result, self.body, self.location || {}, self.captureMode):self.latestMappedResult;
        if (self.phase==='OBSERVE_CELESTIAL' && self.ui && self.latestMappedResult && !self._captureFinalizing) {
          self.ui.update({
            detection: merge(result.detection || {}, {
              found: true,
              frameWidth: self.bridge.canvas ? self.bridge.canvas.width : 1,
              frameHeight: self.bridge.canvas ? self.bridge.canvas.height : 1
            }),
            gravity: result.gravity || {},
            quality: result.quality ? result.quality.overallScore : 0,
            headingDeg: result.trueCameraHeadingDeg,
            alignmentTarget: result.qiblaAlignmentTarget || null,
            alignmentReady: !!(result.accepted && result.astronomicalQiblaObservation && result.astronomicalQiblaObservation.source === 'astronomical-qibla-alignment-observation')
          });
        }
      },
      onError: function (error) { if (!self._closed) self.onError(error); }
    });

    if (this.bridge.gravity) {
      this.bridge.gravity._boundMotion = function (event) {
        var source = event && event.accelerationIncludingGravity;
        if (!source || !finite(Number(source.x)) || !finite(Number(source.y)) || !finite(Number(source.z))) return;
        self.bridge.gravity.samples.push({
          x: Number(source.x),
          y: Number(source.y),
          z: Number(source.z),
          timestamp: Date.now()
        });
        var limit = self.bridge.gravity.sampleCount || 40;
        if (self.bridge.gravity.samples.length > limit) {
          self.bridge.gravity.samples.splice(0, self.bridge.gravity.samples.length - limit);
        }
      };
    }
  };

  VerificationSession.prototype.start = async function () {
    if (this.running) return true;
    var selected = this.body ? { body: this.body } : chooseBody(Date.now());
    if (!selected) throw new Error('No observable sun or moon is currently available.');
    this.body = selected.body;
    this.location = await Promise.resolve(this.locationProvider(Date.now()));
    await this.yawTracker.start();
    this._createUi();
    this._createBridge();
    await this.bridge.start();
    await this.ui.open(this.bridge.stream, { body: this.body });
    this.running = true;
    return true;
  };

  VerificationSession.prototype._obtainMeasurement = async function () {
    if (this.phase === 'CAPTURE_RAW') return this.latestMappedResult || null;
    if (this.latestMappedResult) return this.latestMappedResult;
    for (var attempt = 0; attempt < 24 && this.bridge && !this._closed; attempt++) {
      try {
        this.bridge.lastSolveAt = 0;
        var result = await this.bridge.processCurrentFrame(Date.now());
        if (result) {
          this.latestResult = result;
          this.latestMappedResult = mapResult(result, this.body, this.location || {}, this.captureMode);
        }
      } catch (error) { this.onError(error); }
      if (this.latestMappedResult) return this.latestMappedResult;
      await sleep(100);
    }
    return null;
  };

  VerificationSession.prototype._finalizeCapture = async function (mode) {
    if (this._captureFinalizing || this._closed) return null;
    this._captureFinalizing = true;
    this.captureMode = mode === 'manual' ? 'manual' : 'auto';
    try {
      var frozen = await waitForFrozenCapture(this.ui, 3000);
      if (!frozen) throw new Error('لم يكتمل تجميد إطار الرصد.');
      var mapped = await this._obtainMeasurement();
      if (!mapped) throw new Error('تعذر استخراج قياس نهائي من الرصد الحالي.');
      mapped.captureMode = this.captureMode;
      mapped.timestamp = Date.now();
      return this.accept(mapped);
    } catch (error) {
      this.onError(error);
      this._captureFinalizing = false;
      if (this.ui && !this._closed) this.ui.retry();
      return null;
    }
  };

  VerificationSession.prototype._scheduleCapturedResult = function (mode) { return this._finalizeCapture(mode); };

  VerificationSession.prototype.accept = function (result) {
    result = result || this.latestMappedResult;
    if (!result || this._closed) return null;
    var record = Store.record({
      body: result.body,
      observedQiblaBearingDeg: result.observedQiblaBearingDeg,
      referenceQiblaBearingDeg: result.referenceQiblaBearingDeg,
      verificationOffsetDeg: result.verificationOffsetDeg,
      reticleResidualDeg: result.reticleResidualDeg,
      trueCameraHeadingDeg: result.trueCameraHeadingDeg,
      alignmentMode: result.alignmentMode || 'astronomical-solved-bearing',
      quality: result.quality,
      detectionConfidence: result.detectionConfidence,
      gravityQuality: result.gravityQuality,
      targetAzDeg: result.targetAzDeg,
      targetAltDeg: result.targetAltDeg,
      latitude: result.latitude,
      longitude: result.longitude,
      timestamp: result.timestamp || Date.now(),
      captureMode: result.captureMode
    });
    if (!record) {
      this.onError(new Error('تعذر تسجيل نتيجة الرصد الفلكي.'));
      this.stop('capture-failed');
      return null;
    }
    try { this.onAccepted(record); } finally { this.stop('accepted'); }
    return record;
  };

  VerificationSession.prototype.stop = function (reason) {
    if (this._closed) return;
    this._closed = true;
    try { if (this.bridge) this.bridge.stop(); } catch (_) {}
    try { if (this.yawTracker) this.yawTracker.stop(); } catch (_) {}
    try {
      if (this.ui) {
        if (typeof this.ui._stopLensLoop === 'function') this.ui._stopLensLoop();
        if (this.ui.video) {
          try { this.ui.video.pause(); } catch (_) {}
          this.ui.video.srcObject = null;
        }
        if (this.ui.root && this.ui.root.parentNode) this.ui.root.parentNode.removeChild(this.ui.root);
        this.ui.state = 'CLOSED';
      }
    } catch (_) {}
    this.running = false;
    this._captureFinalizing = false;
    try { this.onClosed(reason || 'stop'); } catch (_) {}
    if (reason === 'accepted' || reason === 'back' || reason === 'capture-failed') navigateToCompass();
  };

  VerificationSession.prototype.destroy = function () {
    this.stop('destroy');
    this.ui = null;
    this.bridge = null;
  };

  return Object.freeze({
    chooseBody: chooseBody,
    mapProgress: mapProgress,
    mapResult: mapResult,
    navigateToCompass: navigateToCompass,
    waitForFrozenCapture: waitForFrozenCapture,
    RelativeYawTracker: RelativeYawTracker,
    buildAnchoredHeading: buildAnchoredHeading,
    VerificationSession: VerificationSession
  });
});
