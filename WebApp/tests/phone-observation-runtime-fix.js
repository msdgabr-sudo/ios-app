// QiblaAstro phone-test observation runtime fix.
// 1) Downscale only the hidden analysis canvas for faster processing.
// 2) Stamp each observation after analysis so the tracker never discards a
//    freshly processed frame as stale on slower Android phones.
(function (root) {
  'use strict';

  var bridgeModule = root.QiblaAstronomicalObservationBridge;
  var detector = root.QiblaCelestialDetector;
  if (!bridgeModule || !bridgeModule.AstronomicalObservationBridge || !detector) return;

  var Bridge = bridgeModule.AstronomicalObservationBridge;
  var originalPrepare = Bridge.prototype._prepareMedia;

  Bridge.prototype._prepareMedia = async function () {
    await originalPrepare.call(this);

    var sourceWidth = this.video.videoWidth || this.canvas.width || 1280;
    var sourceHeight = this.video.videoHeight || this.canvas.height || 720;
    var maximumWidth = 480;
    var scale = Math.min(1, maximumWidth / Math.max(1, sourceWidth));
    var width = Math.max(160, Math.round(sourceWidth * scale));
    var height = Math.max(120, Math.round(sourceHeight * scale));

    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.phoneDebug = {
      sourceWidth: sourceWidth,
      sourceHeight: sourceHeight,
      analysisWidth: width,
      analysisHeight: height,
      totalFrames: 0,
      detectedFrames: 0,
      rejectedFrames: 0,
      lastReason: null,
      lastAnalysisMs: 0
    };
  };

  Bridge.prototype._readFrame = function () {
    if (!this.context || !this.video || this.video.readyState < 2) {
      return {
        found: false,
        reason: 'video-not-ready',
        timestamp: Date.now(),
        processingMs: 0
      };
    }

    var startedAt = performance && performance.now ? performance.now() : Date.now();
    var width = this.canvas.width;
    var height = this.canvas.height;
    this.context.drawImage(this.video, 0, 0, width, height);
    var imageData = this.context.getImageData(0, 0, width, height);
    var observation = detector.analyzeFrame(
      imageData.data,
      width,
      height,
      Object.assign({}, this.options.detectorOptions || {}, {
        // Temporary value only; replaced after analysis below.
        timestamp: Date.now()
      })
    );
    var endedAt = performance && performance.now ? performance.now() : Date.now();

    observation.timestamp = Date.now();
    observation.processingMs = Math.max(0, endedAt - startedAt);
    observation.analysisWidth = width;
    observation.analysisHeight = height;

    this.phoneDebug = this.phoneDebug || {};
    this.phoneDebug.totalFrames = (this.phoneDebug.totalFrames || 0) + 1;
    this.phoneDebug.lastAnalysisMs = observation.processingMs;
    this.phoneDebug.lastReason = observation.found ? null : observation.reason;
    if (observation.found) this.phoneDebug.detectedFrames = (this.phoneDebug.detectedFrames || 0) + 1;
    else this.phoneDebug.rejectedFrames = (this.phoneDebug.rejectedFrames || 0) + 1;
    observation.phoneDebug = Object.assign({}, this.phoneDebug);

    return observation;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
