// QiblaAstro phone-test gravity runtime adaptation.
// Android DeviceMotionEvent timestamps often use a performance timeline while
// the solver uses epoch milliseconds. This also tolerates natural hand tremor
// and briefly holds the last stable estimate instead of rejecting immediately.
(function (root) {
  'use strict';
  var module = root.QiblaGravityReference;
  if (!module || !module.GravityReference) return;

  var GravityReference = module.GravityReference;
  var originalGetEstimate = GravityReference.prototype.getEstimate;

  GravityReference.prototype._onMotion = function (event) {
    var vector = module.extractAccelerationIncludingGravity(event);
    if (!vector) return;
    this.samples.push({
      x: vector.x,
      y: vector.y,
      z: vector.z,
      timestamp: Date.now()
    });
    if (this.samples.length > this.sampleCount) {
      this.samples.splice(0, this.samples.length - this.sampleCount);
    }
  };

  GravityReference.prototype.getEstimate = function (options) {
    options = Object.assign({}, options || {});
    this.minSamples = Math.min(this.minSamples || 12, 8);
    this.sampleCount = Math.max(this.sampleCount || 25, 40);
    this.maxAgeMs = Math.max(this.maxAgeMs || 1200, 2500);
    this.maxDirectionSpreadDeg = Math.max(this.maxDirectionSpreadDeg || 2.5, 6.5);

    var result = originalGetEstimate.call(this, options);
    var now = typeof options.now === 'number' ? options.now : Date.now();

    if (result && result.valid) {
      this._phoneLastStableEstimate = Object.assign({}, result, {
        held: false,
        heldAt: now
      });
      return result;
    }

    var last = this._phoneLastStableEstimate;
    if (last && now - last.heldAt <= 1300 && result &&
        (result.reason === 'DIRECTION_UNSTABLE' || result.reason === 'INSUFFICIENT_SAMPLES')) {
      var ageRatio = Math.min(1, (now - last.heldAt) / 1300);
      return Object.assign({}, last, {
        valid: true,
        held: true,
        heldReason: result.reason,
        quality: Math.max(0.55, (last.quality || 0.8) * (1 - 0.25 * ageRatio)),
        timestamp: now
      });
    }

    return result;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
