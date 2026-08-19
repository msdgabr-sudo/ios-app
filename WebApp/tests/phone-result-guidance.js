// QiblaAstro phone-test final-result guidance.
// Keeps terminal state stable and explains acceptance/rejection in Arabic.
(function (root) {
  'use strict';

  var module = root.QiblaAstronomicalObservationBridge;
  if (!module || !module.AstronomicalObservationBridge) return;

  var OriginalBridge = module.AstronomicalObservationBridge;

  var ARABIC = {
    DETECTION_CONFIDENCE_LOW: 'ثقة اكتشاف الجرم منخفضة. ثبّت القمر داخل العلامة وحاول مرة أخرى.',
    DETECTION_NOT_STABLE: 'لم يثبت الجرم في عدد كافٍ من الإطارات.',
    FRAME_OVEREXPOSED: 'صورة الجرم شديدة السطوع؛ خفّض التعريض إن أمكن.',
    BODY_SHAPE_UNCERTAIN: 'شكل الجرم داخل الصورة غير واضح بما يكفي.',
    GRAVITY_QUALITY_LOW: 'جودة مرجع الجاذبية منخفضة. ثبّت الهاتف أكثر.',
    DEVICE_NOT_STABLE: 'تحرك الهاتف أثناء الرصد.',
    GRAVITY_REFERENCE_STALE: 'قراءة الجاذبية قديمة بالنسبة إلى لحظة الرصد.',
    POSE_QUALITY_LOW: 'جودة حل وضعية الكاميرا غير كافية.',
    CELESTIAL_RESIDUAL_HIGH: 'موضع الجرم المرصود لا يطابق الحل الهندسي بالدقة المطلوبة.',
    ALTITUDE_RESIDUAL_HIGH: 'ارتفاع الجرم في الصورة لا يطابق ارتفاعه الفلكي بما يكفي.',
    BODY_OUTSIDE_FRAME: 'الجرم خارج منطقة الصورة الصالحة.',
    FOV_INVALID: 'قيمة مجال رؤية الكاميرا غير صالحة.',
    BODY_TOO_CLOSE_TO_EDGE: 'الجرم قريب جدًا من حافة الصورة.',
    FRAME_STALE: 'إطار الكاميرا قديم بالنسبة إلى زمن الحساب.',
    TIMING_SKEW_HIGH: 'توقيت الكاميرا والجاذبية والحساب الفلكي غير متزامن.',
    BODY_ALTITUDE_UNSAFE: 'ارتفاع الجرم غير مناسب حاليًا لحل موثوق.',
    GEOMETRY_DEGENERATE: 'الوضع الهندسي بين الجرم والجاذبية غير مناسب مؤقتًا.',
    OVERALL_SCORE_LOW: 'جودة الرصد الكلية أقل من الحد المطلوب.'
  };

  function firstError(result) {
    var reasons = result && result.quality && result.quality.reasons;
    if (!Array.isArray(reasons)) return null;
    return reasons.find(function (reason) { return reason && reason.severity === 'error'; }) || reasons[0] || null;
  }

  function setFinalUi(result) {
    var status = document.getElementById('status');
    var quality = document.getElementById('quality');
    var detection = document.getElementById('detection');
    if (!status || !quality) return;

    var score = result && result.quality && Number.isFinite(result.quality.overallScore)
      ? Math.round(result.quality.overallScore * 100) : null;

    if (result && result.accepted) {
      status.textContent = 'تم قبول الرصد الفلكي';
      status.className = 'v ok';
      quality.textContent = (score === null ? '' : score + '% · ') + 'مقبول';
      quality.className = 'v ok';
      return;
    }

    var reason = firstError(result);
    var message = reason && ARABIC[reason.code]
      ? ARABIC[reason.code]
      : 'لم تتحقق شروط جودة الرصد. أعد المحاولة مع تثبيت الهاتف والجرم.';

    status.textContent = 'الرصد مرفوض: ' + message;
    status.className = 'v bad';
    quality.textContent = (score === null ? '' : score + '% · ') + 'مرفوض';
    quality.className = 'v bad';

    if (detection && reason && reason.code === 'DETECTION_CONFIDENCE_LOW') {
      detection.className = 'v bad';
    }
  }

  function PatchedBridge(options) {
    options = Object.assign({}, options || {});
    var originalResult = typeof options.onResult === 'function' ? options.onResult : function () {};
    options.onResult = function (result) {
      originalResult(result);
      setFinalUi(result);
    };
    return new OriginalBridge(options);
  }

  PatchedBridge.prototype = OriginalBridge.prototype;
  Object.keys(OriginalBridge).forEach(function (key) {
    try { PatchedBridge[key] = OriginalBridge[key]; } catch (error) {}
  });

  root.QiblaAstronomicalObservationBridge = Object.freeze(Object.assign({}, module, {
    AstronomicalObservationBridge: PatchedBridge,
    explainResultArabic: setFinalUi
  }));
})(typeof globalThis !== 'undefined' ? globalThis : window);
