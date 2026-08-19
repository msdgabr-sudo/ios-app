// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION — طبقة الربط بين النظام الفلكي الجديد وواجهة المستخدم
// ══════════════════════════════════════════════════════════════════════════════
//
//  هذا الملف هو "الغراء" بين:
//    - AstroVerification (تدفّق التحقق الفلكي)
//    - CameraEngine (الكاميرا + المحاذاة الحية)
//    - CompassCards (بطاقات العرض)
//    - ConfidenceFusionEngine (حساب الثقة)
//    - TrackingLock (التتبع والقفل)
//
//  لا يُعدّل أي ملف آخر ولا يفترض وجود عناصر HTML محددة.
//  كل دالة تتحقق من وجود العنصر قبل التعديل.
//  يُحمَّل بعد جميع الملفات الأخرى.
// ════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ══════════════════════════════════════════
  //  إعدادات DOM (عناصر HTML المتوقعة)
  // ══════════════════════════════════════════
  //  تم تعديل هذه القائمة لتطابق IDs index.html المعدل
  // ══════════════════════════════════════════
  var DOM = {
    // البطاقات (تطابق IDs في index.html)
    CARD_LIVE_COMPASS:    'live-compass-card',
    CARD_GNSS_QIBLA:      'box-qibla',
    CARD_ASTRO_BODY:      'astro-body-card',
    CARD_ASTRO_QIBLA:     'astro-qibla-value',
    CARD_ASTRO_DEVIATION: 'astro-deviation-value',
    CARD_FINAL_DEVIATION: 'box-diff',

    // العناصر الفرعية داخل البطاقات
    ASTRO_BODY_LABEL:     'astro-body-label',
    ASTRO_BODY_VALUE:     'astro-body-value',
    ASTRO_BODY_HINT:      'astro-body-hint',
    ASTRO_QIBLA_HINT:     'astro-qibla-hint',
    ASTRO_DEVIATION_HINT: 'astro-deviation-hint',
    LIVE_COMPASS_HINT:    'live-compass-hint',
    BOX_HEADING:          'box-heading',
    GNSS_BADGE:           'gnss-badge',
    BOX_DIR:              'box-dir',

    // الأزرار
    BTN_ASTRO_VERIFY:     'astro-body-card',   // البطاقة نفسها هي المُطلق
    BTN_VERIFY_SUN:       'verify-sun-btn',
    BTN_VERIFY_MOON:      'verify-moon-btn',
    BTN_VERIFY_START:     'verify-start-btn',
    BTN_CANCEL_CAMERA:    'camera-close',
    BTN_TRACKING:         'tracking-toggle-btn',
    BTN_LOCK:             'lock-toggle-btn',

    // النوافذ المنبثقة
    MODAL_VERIFY:         'astro-verify-modal',
    MODAL_INSTRUCTIONS:   'verify-instructions',

    // الكاميرا
    CAMERA_OVERLAY:       'camera-overlay',
    CAMERA_VIDEO:         'camera-video',
    CAMERA_CANVAS:        'camera-canvas',
    CAMERA_RETICLE:       'camera-reticle',
    CAMERA_STATUS:        'camera-status',
    CAMERA_DEVIATION:     'camera-deviation',
    CAMERA_GUIDE:         'camera-guide',

    // عناصر إضافية
    COMPASS_STATUS_MSG:   'compass-status-msg',
    CONFIDENCE_BAR:       'confidence-bar',
    CONFIDENCE_FILL:      'confidence-fill',
    CONFIDENCE_SCORE:     'confidence-score',
    CONFIDENCE_LABEL:     'confidence-label',
    MEASURED_HEADING:     'measured-heading',
    TOAST_MESSAGE:        'toast-message'
  };

  // حالة التحقق الداخلية
  var _selectedBody = null;  // 'sun' | 'moon'
  var _targetAz = null;

  // ══════════════════════════════════════════
  //  دوال مساعدة — الوصول الآمن للعناصر
  // ══════════════════════════════════════════
  function gel(id) { return document.getElementById(id); }

  function setText(id, text) {
    var el = gel(id);
    if (el) el.textContent = text;
  }

  function setHtml(id, html) {
    var el = gel(id);
    if (el) el.innerHTML = html;
  }

  function showEl(id, display) {
    var el = gel(id);
    if (el) el.style.display = display || 'block';
  }

  function hideEl(id) {
    var el = gel(id);
    if (el) el.style.display = 'none';
  }

  function addClass(id, cls) {
    var el = gel(id);
    if (el) el.classList.add(cls);
  }

  function removeClass(id, cls) {
    var el = gel(id);
    if (el) el.classList.remove(cls);
  }

  // ══════════════════════════════════════════
  //  Toast بسيط (رسالة منبثقة)
  // ══════════════════════════════════════════
  function showToast(message, durationMs) {
    var toast = gel(DOM.TOAST_MESSAGE);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = DOM.TOAST_MESSAGE;
      toast.style.cssText = [
        'position:fixed','bottom:100px','left:50%',
        'transform:translateX(-50%)','padding:12px 24px',
        'border-radius:12px','background:rgba(10,14,28,0.92)',
        'backdrop-filter:blur(10px)','color:#E8C850',
        'font-size:14px','font-weight:600','z-index:9999999',
        'pointer-events:none','transition:opacity 0.3s ease',
        'opacity:0','border:1px solid rgba(232,200,80,0.2)',
        'text-align:center','max-width:90%','white-space:nowrap'
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(function () { toast.style.opacity = '0'; }, durationMs || 3000);
  }

  // ══════════════════════════════════════════
  //  عرض نافذة التحقق (الموجودة في HTML)
  // ══════════════════════════════════════════
  function openVerifyModal() {
    var modal = gel(DOM.MODAL_VERIFY);
    if (!modal) { showToast('❌ نافذة التحقق غير موجودة'); return; }

    // إعادة تعيين الحالة
    _selectedBody = null;
    _targetAz = null;
    hideEl(DOM.MODAL_INSTRUCTIONS);
    showEl(DOM.BTN_VERIFY_START, 'none');

    // إعادة تعيين أزرار الاختيار
    var sunBtn = gel(DOM.BTN_VERIFY_SUN);
    var moonBtn = gel(DOM.BTN_VERIFY_MOON);
    if (sunBtn) { sunBtn.style.borderColor = 'rgba(240,200,60,.3)'; sunBtn.style.background = 'rgba(240,200,60,.08)'; }
    if (moonBtn) { moonBtn.style.borderColor = 'rgba(138,174,240,.3)'; moonBtn.style.background = 'rgba(138,174,240,.08)'; }

    // تحديد الجرم المُوصى به تلقائياً
    if (typeof window.AstroVerification !== 'undefined') {
      var pick = AstroVerification.canStartVerification();
      if (pick.possible) {
        selectBody(pick.primary);
      }
    }

    showEl(DOM.MODAL_VERIFY, 'flex');
  }

  function closeVerifyModal() {
    hideEl(DOM.MODAL_VERIFY);
  }

  // ══════════════════════════════════════════
  //  اختيار الجرم (شمس / قمر)
  // ══════════════════════════════════════════
  function selectBody(body) {
    _selectedBody = body;
    var sunBtn = gel(DOM.BTN_VERIFY_SUN);
    var moonBtn = gel(DOM.BTN_VERIFY_MOON);

    if (body === 'sun') {
      if (sunBtn) { sunBtn.style.borderColor = '#E8C878'; sunBtn.style.background = 'rgba(240,200,60,.25)'; }
      if (moonBtn) { moonBtn.style.borderColor = 'rgba(138,174,240,.3)'; moonBtn.style.background = 'rgba(138,174,240,.08)'; }
    } else {
      if (sunBtn) { sunBtn.style.borderColor = 'rgba(240,200,60,.3)'; sunBtn.style.background = 'rgba(240,200,60,.08)'; }
      if (moonBtn) { moonBtn.style.borderColor = '#8AAEF0'; moonBtn.style.background = 'rgba(138,174,240,.25)'; }
    }

    // إنشاء التعليمات
    var instructions = generateInstructions(body);
    var instrEl = gel(DOM.MODAL_INSTRUCTIONS);
    if (instrEl) {
      instrEl.innerHTML = instructions;
      showEl(DOM.MODAL_INSTRUCTIONS, 'block');
    }
    showEl(DOM.BTN_VERIFY_START, 'inline-block');
  }

  function generateInstructions(body) {
    var bodyName = body === 'sun' ? 'الشمس' : 'القمر';
    var steps = [
      '<strong style="color:#E8C878">الخطوة ١:</strong> وقف في مكان مفتوح حيث يُرى ' + bodyName + ' بوضوح.',
      '<strong style="color:#E8C878">الخطوة ٢:</strong> امسك الهاتف بشكل أفقي أمامك.',
      '<strong style="color:#E8C878">الخطوة ٣:</strong> وجّه الكاميرا نحو ' + bodyName + ' مباشرة.',
      '<strong style="color:#E8C878">الخطوة ٤:</strong> انتظر حتى يثبت المؤشر الأخضر ويظهر "تم التقاط".',
      '<strong style="color:#E8C878">ملاحظة:</strong> يجب أن يكون الانحراف أقل من ١° ويكون ' + bodyName + ' داخل دائرة التوجيه.'
    ];
    return '<div style="line-height:2">' + steps.join('<br>') + '</div>';
  }

  // ══════════════════════════════════════════
  //  1) الضغط على زر "التحقق الفلكي"
  // ══════════════════════════════════════════
  function onAstroVerifyClick() {
    if (typeof window.AstroVerification === 'undefined') {
      showToast('❌ نظام التحقق غير متاح');
      return;
    }

    var pick = AstroVerification.canStartVerification();
    if (!pick.possible) {
      showToast('⚠️ لا يوجد جرم سماوي متاح الآن (تأكد من وقت النهار/الليل)');
      return;
    }

    openVerifyModal();
  }

  // ══════════════════════════════════════════
  //  2) تأكيد اختيار الجرم → فتح الكاميرا
  // ══════════════════════════════════════════
  function onConfirmVerifyStart() {
    if (!_selectedBody) {
      showToast('⚠️ اختر الشمس أو القمر أولاً');
      return;
    }

    closeVerifyModal();

    if (typeof window.AstroVerification === 'undefined' || typeof window.CameraEngine === 'undefined') {
      showToast('❌ أنظمة التحقق غير جاهزة');
      return;
    }

    // إعادة الضبط القسري — تأكد من أن الحالة IDLE
    AstroVerification.resetFlow();
    // إيقاف الكاميرا إذا كانت تعمل
    if (typeof CameraEngine.cancelCapture === 'function') {
      try { CameraEngine.cancelCapture(); } catch(e) {}
    }

    // بدء التدفق في AstroVerification
    var result = AstroVerification.startFlow(_selectedBody);
    if (!result.ok) {
      showToast('❌ خطأ في بدء التحقق: ' + (result.reason || 'غير معروف'));
      return;
    }

    var confirm = AstroVerification.confirmInstructionsSeen();
    if (!confirm.ok) {
      showToast('❌ خطأ في الانتقال للكاميرا');
      return;
    }

    _targetAz = confirm.targetAz;
    var bodyName = _selectedBody === 'sun' ? 'الشمس' : 'القمر';

    CameraEngine.start(function (camResult) {
      onCameraResult(camResult);
    }, {
      targetAz: _targetAz,
      bodyLabel: bodyName,
      label: 'وجّه الهاتف نحو ' + bodyName
    });
  }

  // ══════════════════════════════════════════
  //  3) إلغاء التحقق
  // ══════════════════════════════════════════
  function onCancelVerify() {
    closeVerifyModal();
    if (typeof window.AstroVerification !== 'undefined') {
      AstroVerification.cancelFlow();
    }
    updateAllCards();
  }

  // ══════════════════════════════════════════
  //  4) نتيجة الكاميرا (نجاح / فشل / إلغاء)
  // ══════════════════════════════════════════
  function onCameraResult(result) {
    if (result.ok) {
      showToast('✓ تم التحقق الفلكي بنجاح — القبلة الفلكية محسوبة', 4000);
      // تسجيل الاتجاه الفلكي
      if (result.trueCameraHeading !== undefined) {
        setText(DOM.MEASURED_HEADING, result.trueCameraHeading.toFixed(2) + '°');
      }
      updateAllCards();
      updateConfidenceDisplay();
    } else {
      if (result.reason === 'cancelled') {
        showToast('تم إلغاء التحقق', 2000);
      } else if (result.reason === 'heading-unavailable') {
        showToast('❌ اتجاه الهاتف غير متاح — أعد تفعيل البوصلة', 4000);
      } else {
        showToast('❌ فشل التحقق: ' + (result.reason || 'خطأ غير معروف'), 4000);
      }
      if (typeof window.AstroVerification !== 'undefined') {
        AstroVerification.cancelFlow();
      }
      updateAllCards();
    }
  }

  // ══════════════════════════════════════════
  //  5) تحديث جميع البطاقات
  // ══════════════════════════════════════════
  function updateAllCards() {
    if (typeof window.CompassCards === 'undefined') return;

    var cards = CompassCards.getAllCards();
    if (!cards) return;

    if (cards.loading) {
      setText(DOM.ASTRO_BODY_HINT, 'جاري التحميل...');
      setText(DOM.ASTRO_QIBLA_HINT, 'جاري التحميل...');
      setText(DOM.ASTRO_DEVIATION_HINT, 'جاري التحميل...');
      return;
    }

    // تحديث البطاقة الفلكية (الجرم)
    if (cards.astroBody) {
      updateAstroBodyCard(cards.astroBody);
    }
    // تحديث القبلة الفلكية
    if (cards.astroQibla) {
      updateAstroQiblaCard(cards.astroQibla);
    }
    // تحديث الانحراف الفلكي
    if (cards.astroDeviation) {
      updateAstroDeviationCard(cards.astroDeviation);
    }
    // تحديث البوصلة الحية
    if (cards.liveCompass) {
      updateLiveCompassCard(cards.liveCompass);
    }
    // تحديث القبلة الحسابية
    if (cards.gnssQibla) {
      updateGnssQiblaCard(cards.gnssQibla);
    }
    // تحديث الانحراف النهائي
    if (cards.finalDeviation) {
      updateFinalDeviationCard(cards.finalDeviation);
    }
  }

  // ══════════════════════════════════════════
  //  تحديث كل بطاقة على حدة (تطابق HTML)
  // ══════════════════════════════════════════
  function updateAstroBodyCard(data) {
    var hint = gel(DOM.ASTRO_BODY_HINT);
    var value = gel(DOM.ASTRO_BODY_VALUE);
    var label = gel(DOM.ASTRO_BODY_LABEL);

    if (label) {
      label.textContent = data.label || 'البوصلة الفلكية';
    }
    if (value) {
      if (data.value !== null && data.value !== undefined) {
        value.textContent = data.value;
        value.style.display = '';
      } else {
        value.style.display = 'none';
      }
    }
    if (hint) {
      if (data.state === 'verified') {
        hint.textContent = '✓ ' + (data.hint || 'تم التحقق');
        hint.style.color = '#50C880';
      } else if (data.state === 'error') {
        hint.textContent = '✗ ' + (data.reason || 'خطأ');
        hint.style.color = '#FF8080';
      } else if (data.state === 'stale') {
        hint.textContent = '⏱ ' + (data.staleMessage || 'بيانات قديمة');
        hint.style.color = '#E8C878';
      } else {
        hint.textContent = data.hint || 'اضغط للتحقق';
        hint.style.color = '#8AAEF0';
      }
    }
  }

  function updateAstroQiblaCard(data) {
    var value = gel(DOM.CARD_ASTRO_QIBLA);
    var hint = gel(DOM.ASTRO_QIBLA_HINT);
    if (value) {
      value.textContent = (data.value !== null && data.value !== undefined) ? data.value : '---°';
      value.style.color = data.state === 'verified' ? '#50C880' : '#E8C878';
    }
    if (hint) {
      if (data.captureAge) {
        hint.textContent = 'تم التحقق منذ ' + data.captureAge;
        hint.style.color = '#50C880';
      } else if (data.state === 'stale') {
        hint.textContent = data.staleMessage || 'بانتظار التحقق';
        hint.style.color = '#E8C878';
      } else {
        hint.textContent = 'بانتظار التحقق';
        hint.style.color = '#5AC8FA';
      }
    }
  }

  function updateAstroDeviationCard(data) {
    var value = gel(DOM.CARD_ASTRO_DEVIATION);
    var hint = gel(DOM.ASTRO_DEVIATION_HINT);
    if (value) {
      value.textContent = (data.value !== null && data.value !== undefined) ? data.value : '---';
      var color = data.state === 'verified' ? '#50C880' : data.state === 'error' ? '#FF8080' : '#E8C878';
      value.style.color = color;
    }
    if (hint) {
      hint.textContent = data.hint || 'لا يوجد تحقق بعد';
      hint.style.color = data.state === 'verified' ? '#50C880' : '#5AC8FA';
    }
  }

  function updateLiveCompassCard(data) {
    var hint = gel(DOM.LIVE_COMPASS_HINT);
    var value = gel(DOM.BOX_HEADING);
    if (hint) {
      if (data.state === 'active') {
        hint.textContent = '✓ البوصلة تعمل';
        hint.style.color = '#50C880';
      } else if (data.state === 'error') {
        hint.textContent = '✗ ' + (data.reason || 'خطأ');
        hint.style.color = '#FF8080';
      } else {
        hint.textContent = 'اضغط لتفعيل البوصلة';
        hint.style.color = '#8AAEF0';
      }
    }
    if (value && data.value !== null && data.value !== undefined) {
      value.textContent = data.value;
      value.style.display = '';
    }
  }

  function updateGnssQiblaCard(data) {
    var value = gel(DOM.CARD_GNSS_QIBLA);
    var badge = gel(DOM.GNSS_BADGE);
    if (value && data.value !== null && data.value !== undefined) {
      value.textContent = data.value;
    }
    if (badge && data.badge) {
      badge.textContent = data.badge;
    }
  }

  function updateFinalDeviationCard(data) {
    var value = gel(DOM.CARD_FINAL_DEVIATION);
    var dir = gel(DOM.BOX_DIR);
    if (value && data.value !== null && data.value !== undefined) {
      value.textContent = data.value;
      var absDiff = parseFloat(data.value) || 0;
      value.style.color = absDiff < 5 ? '#50C880' : absDiff < 15 ? '#E8C878' : '#FF8080';
    }
    if (dir && data.dir) {
      dir.textContent = data.dir;
    }
  }

  // ══════════════════════════════════════════
  //  6) تحديث شريط الثقة (Confidence)
  // ══════════════════════════════════════════
  function updateConfidenceDisplay() {
    if (typeof window.ConfidenceFusionEngine === 'undefined') return;

    var report = ConfidenceFusionEngine.getReport();
    if (!report || !report.confidence) return;

    var conf = report.confidence;
    var fill = gel(DOM.CONFIDENCE_FILL);
    var score = gel(DOM.CONFIDENCE_SCORE);
    var lbl = gel(DOM.CONFIDENCE_LABEL);
    var bar = gel(DOM.CONFIDENCE_BAR);

    if (fill) {
      fill.style.width = conf.confidence + '%';
    }

    if (score) {
      score.textContent = conf.confidence.toFixed(0) + '%';
      var scoreColor = conf.confidence >= 90 ? '#50C880' :
                       conf.confidence >= 75 ? '#E8C878' :
                       conf.confidence >= 55 ? '#E8C050' : '#FF8080';
      score.style.color = scoreColor;
    }

    if (lbl) {
      lbl.textContent = conf.label + '';
      lbl.style.color = conf.confidence >= 75 ? '#50C880' :
                        conf.confidence >= 55 ? '#E8C878' : '#FF8080';
    }

    if (bar) {
      if (conf.confidence >= 75) {
        bar.classList.add('verified');
      } else {
        bar.classList.remove('verified');
      }
    }

    // تحديث رسالة الحالة
    var statusMsg = gel(DOM.COMPASS_STATUS_MSG);
    if (statusMsg && conf.celestialUsed) {
      statusMsg.textContent = '✓ تحقق فلكي نشط — ' + conf.label;
    }
  }

  // ══════════════════════════════════════════
  //  7) ربط الأزرار الموجودة في HTML
  // ══════════════════════════════════════════
  function bindButtons() {
    // زر التحقق الفلكي (البطاقة نفسها)
    var btnVerify = gel(DOM.BTN_ASTRO_VERIFY);
    if (btnVerify) {
      // إزالة المعالج القديم إن وُجد
      btnVerify.onclick = null;
      btnVerify.addEventListener('click', function(e) {
        e.preventDefault();
        onAstroVerifyClick();
      });
    }

    // أزرار اختيار الجرم داخل النافذة
    var sunBtn = gel(DOM.BTN_VERIFY_SUN);
    var moonBtn = gel(DOM.BTN_VERIFY_MOON);
    if (sunBtn) {
      sunBtn.addEventListener('click', function() { selectBody('sun'); });
    }
    if (moonBtn) {
      moonBtn.addEventListener('click', function() { selectBody('moon'); });
    }

    // زر بدء التحقق
    var startBtn = gel(DOM.BTN_VERIFY_START);
    if (startBtn) {
      startBtn.addEventListener('click', onConfirmVerifyStart);
    }

    // زر إلغاء في النافذة (الزر الموجود في HTML)
    var modal = gel(DOM.MODAL_VERIFY);
    if (modal) {
      // زر الإلغاء الموجود في HTML
      var cancelBtn = modal.querySelector('button[onclick*="astro-verify-modal"]');
      if (cancelBtn) {
        cancelBtn.onclick = null;
        cancelBtn.addEventListener('click', onCancelVerify);
      }
    }

    // زر إغلاق الكاميرا
    var camClose = gel(DOM.BTN_CANCEL_CAMERA);
    if (camClose) {
      camClose.addEventListener('click', function() {
        if (typeof window.CameraEngine !== 'undefined') {
          CameraEngine.cancel();
        }
      });
    }
  }

  // ══════════════════════════════════════════
  //  8) ربط التحديثات المستمرة (Hooks)
  // ══════════════════════════════════════════
  function hookUpdates() {
    // Hook: onDeviceOrientation
    var _origOnDeviceOrientation = window.onDeviceOrientation;
    window.onDeviceOrientation = function (e) {
      if (_origOnDeviceOrientation) _origOnDeviceOrientation(e);
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(function () {
          updateAllCards();
          updateCompassHeadingInline();
        });
      }
    };

    // Hook: updateQiblaFromPosition
    var _origUpdateQibla = window.updateQiblaFromPosition;
    window.updateQiblaFromPosition = function () {
      if (_origUpdateQibla) _origUpdateQibla();
      updateAllCards();
      updateConfidenceDisplay();
    };
  }

  // ══════════════════════════════════════════
  //  تحديث الانحراف المباشر في الواجهة
  // ══════════════════════════════════════════
  function updateCompassHeadingInline() {
    if (typeof deviceHeading === 'undefined' || deviceHeading === null) return;
    if (typeof QT === 'undefined' || QT === null) return;

    var diff = ((QT - deviceHeading) + 360) % 360;
    if (diff > 180) diff = diff - 360;
    var absDiff = Math.abs(diff);

    var color = absDiff < 5 ? '#50C880' : absDiff < 15 ? '#E8C878' : '#FF8080';
    var dir = diff > 1 ? '← يسار' : diff < -1 ? 'يمين →' : '✅ دقيق';

    var elDiff = gel('box-diff');
    if (elDiff) { elDiff.textContent = absDiff.toFixed(1) + '°'; elDiff.style.color = color; }

    var elDir = gel('box-dir');
    if (elDir) elDir.textContent = dir;
  }

  // ══════════════════════════════════════════
  //  9) التتبع والقفل — ربط أزرار HTML
  // ══════════════════════════════════════════
  function bindTrackingLock() {
    if (typeof window.TrackingLock === 'undefined') return;

    var btnTrack = gel(DOM.BTN_TRACKING);
    if (btnTrack) {
      btnTrack.addEventListener('click', function () {
        if (TrackingLock.isTracking()) {
          TrackingLock.stopTracking();
          btnTrack.textContent = '📍 تتبّع';
          btnTrack.style.background = 'rgba(138,174,240,.08)';
          btnTrack.style.color = '#8AAEF0';
        } else {
          TrackingLock.startTracking(function () {
            updateAllCards();
            updateCompassHeadingInline();
          }, 1000);
          btnTrack.textContent = '⏹ إيقاف التتبع';
          btnTrack.style.background = 'rgba(138,174,240,.25)';
          btnTrack.style.color = '#fff';
        }
      });
    }

    var btnLock = gel(DOM.BTN_LOCK);
    if (btnLock) {
      btnLock.addEventListener('click', function () {
        if (TrackingLock.isLocked()) {
          TrackingLock.unlock();
          btnLock.textContent = '🔒 قفل';
          btnLock.style.background = 'rgba(200,164,74,.08)';
          btnLock.style.color = '#E8C878';
          showToast('🔓 تم فك القفل');
        } else {
          var res = TrackingLock.lockReport();
          if (res.ok) {
            btnLock.textContent = '🔓 فك القفل';
            btnLock.style.background = 'rgba(200,164,74,.25)';
            btnLock.style.color = '#fff';
            showToast('🔒 تم قفل التقرير الفلكي');
          } else {
            showToast('❌ لا يمكن القفل: ' + res.reason);
          }
        }
      });
    }
  }

  // ══════════════════════════════════════════
  //  10) تهيئة النظام
  // ══════════════════════════════════════════
  function init() {
    bindButtons();
    bindTrackingLock();
    hookUpdates();
    updateAllCards();
    updateConfidenceDisplay();

    if (typeof updateSkyBackground === 'function' && typeof sunPos === 'function') {
      try { updateSkyBackground(sunPos(new Date()), new Date()); } catch (e) {}
    }

    console.log('✅ QiblaIntegration initialized');
  }

  // ══════════════════════════════════════════
  //  API عام — للوصول من HTML أو ملفات أخرى
  // ══════════════════════════════════════════
  window.QiblaIntegration = {
    init: init,
    onAstroVerifyClick: onAstroVerifyClick,
    onConfirmVerifyStart: onConfirmVerifyStart,
    onCancelVerify: onCancelVerify,
    onCameraResult: onCameraResult,
    updateAllCards: updateAllCards,
    updateConfidenceDisplay: updateConfidenceDisplay,
    showToast: showToast,
    openVerifyModal: openVerifyModal,
    closeVerifyModal: closeVerifyModal,
    selectBody: selectBody
  };


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
