// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM CHECK — فحص سريع يُنفَّذ من Console
// ══════════════════════════════════════════════════════════════════════════════
// انسخ والصق هذا في Console للتحقق من تحميل جميع الأنظمة:
//
//   QiblaIntegration.systemCheck()
//
// ════════════════════════════════════════════════════════════════════════════

(function() {
  function systemCheck() {
    var results = [];
    function check(name, obj, method) {
      var ok = !!(obj && (!method || typeof obj[method] === 'function'));
      results.push({ name: name, ok: ok });
      return ok;
    }

    check('AstroVerification',     window.AstroVerification,     'startFlow');
    check('CameraEngine',          window.CameraEngine,          'start');
    check('ConfidenceFusionEngine', window.ConfidenceFusionEngine, 'getReport');
    check('CompassCards',          window.CompassCards,          'getAllCards');
    check('CelestialOverlay',      window.CelestialOverlay,      'renderCelestialOverlay');
    check('TrackingLock',          window.TrackingLock,          'startTracking');
    check('QiblaIntegration',      window.QiblaIntegration,      'updateAllCards');

    // متغيرات عالمية أساسية
    check('LAT (GPS)',             window, null); // LAT exists as global var
    check('LON (GPS)',             window, null);
    check('QT (Qibla)',            window, null);
    check('deviceHeading',         window, null);
    check('compassAvailable',      window, null);

    var pass = results.filter(function(r){ return r.ok; }).length;
    var fail = results.filter(function(r){ return !r.ok; }).length;

    console.log('═══════════════════════════════════════════');
    console.log('  QIBLA SYSTEM CHECK');
    console.log('═══════════════════════════════════════════');
    results.forEach(function(r){
      console.log((r.ok ? '✅' : '❌') + ' ' + r.name);
    });
    console.log('───────────────────────────────────────────');
    console.log('  ' + pass + ' PASS / ' + fail + ' FAIL');
    console.log('═══════════════════════════════════════════');

    if (window.QiblaIntegration) {
      window.QiblaIntegration._systemCheckResults = results;
    }
    return { pass: pass, fail: fail, results: results };
  }

  if (window.QiblaIntegration) {
    window.QiblaIntegration.systemCheck = systemCheck;
  } else {
    window.QiblaSystemCheck = systemCheck;
  }
})();
