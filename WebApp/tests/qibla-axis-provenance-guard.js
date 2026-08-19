(function () {
  'use strict';

  var CANONICAL_SOURCE = 'astronomical-qibla-alignment-observation';
  var source = document.getElementById('source');
  var status = document.getElementById('status');
  var observed = document.getElementById('observed');
  var offset = document.getElementById('offset');
  if (!source) return;

  function validate() {
    var value = String(source.textContent || '').trim();
    if (!value || value === '—' || value === 'لا توجد محاذاة qibla-axis') return;

    var valid = value === CANONICAL_SOURCE;
    source.classList.toggle('ok', valid);
    source.classList.toggle('bad', !valid);
    source.setAttribute('data-provenance-valid', valid ? 'true' : 'false');

    if (!valid) {
      if (observed) {
        observed.textContent = 'مرفوضة';
        observed.className = 'v bad';
      }
      if (offset) {
        offset.textContent = '—';
        offset.className = 'v bad';
      }
      if (status) {
        status.textContent = 'رفض السجل: مصدر النتيجة غير قانوني';
        status.className = 'v bad';
      }
    }
  }

  new MutationObserver(validate).observe(source, {
    childList: true,
    characterData: true,
    subtree: true
  });
  validate();

  window.QiblaAxisProvenanceGuard = Object.freeze({
    canonicalSource: CANONICAL_SOURCE,
    validate: validate
  });
})();
