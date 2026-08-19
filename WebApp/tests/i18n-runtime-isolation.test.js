'use strict';

const fs = require('fs');

const rollout = fs.readFileSync('js/i18n/english-rollout.js', 'utf8');
const bootstrap = fs.readFileSync('js/presentation/bootstrap.js', 'utf8');
const picker = fs.readFileSync('js/i18n/home-language-picker.js', 'utf8');
const internalBridge = fs.readFileSync('js/i18n/internal-screen-language-bridge.js', 'utf8');
const falakiHost = fs.readFileSync('js/presentation/falaki/host.js', 'utf8');
const chrome = fs.readFileSync('js/presentation/internal-screen-chrome.js', 'utf8');
const homePhrases = fs.readFileSync('js/i18n/home-phrases.js', 'utf8');

function must(pattern, message) { if (!pattern.test(rollout)) throw new Error(message); }
function mustBootstrap(pattern, message) { if (!pattern.test(bootstrap)) throw new Error(message); }
function mustText(pattern, text, message) { if (!pattern.test(text)) throw new Error(message); }
function forbid(pattern, text, message) { if (pattern.test(text)) throw new Error(message); }

mustBootstrap(/js\/i18n\/english-rollout\.js/, 'Production i18n entry point is missing.');
mustBootstrap(/js\/i18n\/home-language-picker\.js/, 'Production language picker is missing.');
mustBootstrap(/js\/i18n\/internal-screen-language-bridge\.js/, 'Internal screen language bridge is not wired in Production bootstrap.');
forbid(/js\/i18n\/(?:runtime|global-safe-i18n|language-picker)\.js/, bootstrap,'Legacy i18n runtime/picker was reintroduced into Production bootstrap.');
forbid(/global-safe-i18n|QiblaSafeI18nAudit/, picker,'Home language picker references the retired safe-layer runtime/audit.');
mustText(/function\s+applyLanguage\s*\(/, picker,'Home language picker does not retry the active MizanI18n API safely.');

// Internal translation is presentation-only and must explicitly block protected scientific screens.
mustText(/compass:1/, internalBridge, 'Internal screen bridge does not explicitly block compass.');
mustText(/verification:1/, internalBridge, 'Internal screen bridge does not explicitly block verification.');
mustText(/astro-verification/, internalBridge, 'Internal screen bridge does not explicitly block astronomical verification.');
mustText(/MIZAN_INTERNAL_SCREEN_PHRASES/, internalBridge, 'Internal screen dictionary is loaded but not applied by the live bridge.');
mustText(/#page-prayer/, internalBridge, 'Prayer screen is not inside the safe internal translation scope.');
mustText(/#page-serenity/, internalBridge, 'Serenity screen is not inside the safe internal translation scope.');
mustText(/#page-falaki/, internalBridge, 'Falaki screen is not inside the safe internal translation scope.');
mustText(/#page-gnss/, internalBridge, 'GNSS screen is not inside the safe internal translation scope.');
mustText(/#page-settings/, internalBridge, 'Settings screen is not inside the safe internal translation scope.');
mustText(/qa-quran-frame/, internalBridge, 'Quran iframe is not inside the safe internal translation scope.');
mustText(/qa-azkar-frame/, internalBridge, 'Azkar iframe is not inside the safe internal translation scope.');
mustText(/qr-text|#qrText/, internalBridge, 'Quran text is not protected inside the internal translator.');
mustText(/az-dhikr-text|#azDhikrText/, internalBridge, 'Dhikr text is not protected inside the internal translator.');
forbid(/getUserMedia|mediaDevices|DeviceOrientationEvent|AbsoluteOrientationSensor|\b(?:LAT|LON|QT|targetAzDeg|targetAltDeg|trueCameraHeadingDeg)\s*=/,internalBridge,'Internal screen bridge touches protected sensors or scientific state.');

must(/#page-compass/, 'Live compass page is not protected from generic i18n DOM writes.');
must(/\.qa-observatory/, 'Astronomical camera observatory is not protected from generic i18n DOM writes.');
must(/['\"]video['\"]/, 'Video elements are not protected from generic i18n DOM writes.');
must(/['\"]canvas['\"]/, 'Canvas elements are not protected from generic i18n DOM writes.');
must(/function\s+restoreNode\s*\([^)]*\)\s*\{[^}]*protectedNode\s*\(/,'restoreNode can write into protected live DOM.');
must(/function\s+restoreAttrs\s*\([^)]*\)\s*\{[^}]*protectedNode\s*\(/,'restoreAttrs can write into protected live DOM.');
must(/if\(own!==undefined&&own===m\.target\.nodeValue\)return;/,'MutationObserver does not preserve translator-owned text markers across duplicate records.');
forbid(/if\(own!==undefined&&own===m\.target\.nodeValue\)\{\s*translatedValues\.delete/,rollout,'MutationObserver clears its own marker too early and can corrupt the Arabic source.');
must(/function\s+hasArabicSource\s*\(/,'Runtime has no Arabic-source validator for dynamic mutations.');
must(/if\(hasArabicSource\(value\)\)originals\.set\(n,value\)/,'Dynamic mutation source can be refreshed without validating Arabic source text.');
forbid(/function\s+refreshOriginalNode\s*\([^)]*\)\s*\{[^}]*originals\.set\(n,n\.nodeValue\)/,rollout,'Dynamic source refresh can still blindly store a translated node value.');
must(/data-mizan-i18n-source/,'Runtime does not support explicit immutable Arabic source labels.');
forbid(/['\"]js\/i18n\/compass-phrases\.js['\"]/, rollout,'Compass phrases were reintroduced into the generic Production i18n pack list.');
forbid(/navigator\.mediaDevices|\.getUserMedia\s*\(|DeviceOrientationEvent|AbsoluteOrientationSensor/,rollout,'i18n runtime must not access camera or orientation sensors.');
forbid(/\b(?:LAT|LON|QT|trueCameraHeadingDeg|targetAzDeg|targetAltDeg|verificationOffsetDeg)\s*=/,rollout,'i18n runtime must not assign scientific/verification state.');

mustText(/data-qa-rise-value/, falakiHost, 'Home rise value is not isolated from its translatable label.');
mustText(/data-qa-set-value/, falakiHost, 'Home set value is not isolated from its translatable label.');
mustText(/data-qa-alt-value/, falakiHost, 'Moon altitude value is not isolated from its translatable label.');
mustText(/data-qa-az-value/, falakiHost, 'Moon azimuth value is not isolated from its translatable label.');
mustText(/data-qa-mansion-value/, chrome, 'Falaki mansion value is not isolated from its translatable label.');
mustText(/data-mizan-i18n-source[^\n]*الشروق/, falakiHost,'Rise label does not carry an explicit Arabic source.');
mustText(/data-mizan-i18n-source[^\n]*الغروب/, falakiHost,'Set label does not carry an explicit Arabic source.');
mustText(/data-mizan-i18n-source[^\n]*الارتفاع/, falakiHost,'Altitude label does not carry an explicit Arabic source.');
mustText(/data-mizan-i18n-source[^\n]*السمت/, falakiHost,'Azimuth label does not carry an explicit Arabic source.');
mustText(/data-mizan-i18n-source/, chrome,'Mansion labels do not carry an explicit Arabic source.');
forbid(/textContent\s*=\s*['\"]شروق\s|textContent\s*=\s*label\s*\+\s*['\"]\s*·\s*['\"]\s*\+\s*val/,falakiHost + '\n' + chrome,'Dynamic Falaki text is rebuilding Arabic labels during live refresh.');
mustText(/eventTimer\s*=\s*setInterval\(eventRun,60000\)/, falakiHost,'Falaki event mirror is not throttled to the slow event cadence.');
forbid(/setInterval\([^\n]*mirrorEventTimes[^\n]*,1000\)|setInterval\(run,1000\)/, falakiHost,'Falaki event calculations were reintroduced into the one-second live loop.');

for (const token of [
  "'الغروب':'Sunset'", "'المنزلة الشمسية':'Solar mansion'", "'المنزلة القمرية':'Lunar mansion'",
  "'الغروب':'Coucher du soleil'", "'المنزلة الشمسية':'Manzil solaire'", "'المنزلة القمرية':'Manzil lunaire'",
  "'التحقق الفلكي':'Vérification astronomique'", "'القبلة الرقمية':'Qibla numérique'",
  "'الغروب':'Matahari terbenam'", "'المنزلة الشمسية':'Manzil surya'", "'المنزلة القمرية':'Manzil bulan'",
  "'الغروب':'غروب آفتاب'", "'المنزلة الشمسية':'شمسی منزل'", "'المنزلة القمرية':'قمری منزل'"
]) if (!homePhrases.includes(token)) throw new Error('Missing Home/Falaki translation: ' + token);

if (!fs.existsSync('js/i18n/unified-phrases.js')) throw new Error('Unified i18n compatibility layer is missing.');
console.log('PASS: Production i18n runtime is isolated from compass, camera and scientific engines.');
console.log('PASS: Internal screen translator applies its dictionary only to safe presentation roots/frames.');
console.log('PASS: Dynamic text preserves an Arabic source-of-truth across language round-trips.');
console.log('PASS: Falaki live values are isolated from translatable labels and event cadence is throttled.');
require('./i18n-pack-audit.test.js');
require('./internal-screen-i18n-audit.test.js');
