(function () {
  'use strict';
  var vectors = [
    [2025.0, 28, 89, -121, -99.77],
    [2025.0, 48, 80, -96, -29.91],
    [2025.0, 54, 82, 87, 54.89],
    [2025.0, 65, 43, 93, 0.50],
    [2025.0, 51, -33, 109, -5.49],
    [2025.0, 39, -59, -8, -15.75],
    [2025.0, 3, -50, -103, 27.96],
    [2025.0, 94, -29, -110, 15.74],
    [2025.0, 66, 14, 143, -0.19],
    [2025.0, 18, 0, 21, 1.29],
    [2025.5, 6, -36, -137, 20.28],
    [2025.5, 63, 26, 81, 0.51],
    [2026.0, 69, 23, 63, 1.17]
  ];
  var engine = QiblaAstroWMM2025.create();
  var lines = [];
  var passed = 0;
  var maxError = 0;
  vectors.forEach(function (v, index) {
    var actual = engine.declination(v[1], v[2], v[3], v[0]);
    var error = Math.abs(actual - v[4]);
    var ok = error <= 0.02;
    if (ok) passed += 1;
    maxError = Math.max(maxError, error);
    lines.push((ok ? 'PASS' : 'FAIL') + ' #' + (index + 1) + ' expected=' + v[4].toFixed(2) + ' actual=' + actual.toFixed(4) + ' error=' + error.toFixed(4));
  });
  var allPassed = passed === vectors.length;
  lines.unshift((allPassed ? 'PASS' : 'FAIL') + ' ' + passed + '/' + vectors.length + ' maxError=' + maxError.toFixed(4) + ' deg; runtime integration OFF');
  document.getElementById('result').textContent = lines.join('\n');
  window.__WMM2025_GATE__ = { pass: allPassed, passed: passed, total: vectors.length, maxError: maxError };
}());
