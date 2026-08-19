/* Mizan / QiblaAstro — LEGACY presentation direction layer.
 * Not loaded by the current Production bootstrap; retained temporarily for cleanup traceability.
 * English/Indonesian UI becomes LTR only on safe general screens.
 * Compass / astronomical verification layout is intentionally excluded so its proven UI geometry remains unchanged.
 * Arabic/Urdu remain RTL. Quran and dhikr source text always remain RTL.
 */
(function(root){
'use strict';
var STYLE_ID='mizan-i18n-direction-style';
var CSS=[
  'html[dir="ltr"] body{direction:ltr}',
  'html[dir="ltr"] #page-home,html[dir="ltr"] #page-settings,html[dir="ltr"] #page-prayer,html[dir="ltr"] #page-gnss,html[dir="ltr"] #page-serenity,html[dir="ltr"] .qa-home,html[dir="ltr"] .qa-prayer-screen,html[dir="ltr"] .qr-app,html[dir="ltr"] .az-app,html[dir="ltr"] .shell{direction:ltr!important}',
  'html[dir="ltr"] #page-settings [style*="direction:rtl"],html[dir="ltr"] #page-prayer [style*="direction:rtl"],html[dir="ltr"] .qa-home [style*="direction:rtl"]{direction:ltr!important}',
  'html[dir="ltr"] #page-settings [style*="text-align:right"],html[dir="ltr"] #page-prayer [style*="text-align:right"],html[dir="ltr"] .qa-home [style*="text-align:right"]{text-align:left!important}',
  'html[dir="ltr"] .qr-text,html[dir="ltr"] .qr-basmala,html[dir="ltr"] .qr-surah-frame,html[dir="ltr"] #qrText,html[dir="ltr"] #qrBasmala{direction:rtl!important}',
  'html[dir="ltr"] .az-dhikr-text,html[dir="ltr"] #azDhikrText,html[dir="ltr"] .az-dhikr-source,html[dir="ltr"] .az-dhikr-virtue{direction:rtl!important}',
  'html[dir="ltr"] [data-i18n-protect]{direction:rtl!important}'
].join('\n');
function ensure(doc){if(!doc||!doc.documentElement)return;var style=doc.getElementById(STYLE_ID);if(style)return;style=doc.createElement('style');style.id=STYLE_ID;style.textContent=CSS;(doc.head||doc.documentElement).appendChild(style);}
function apply(doc,lang){if(!doc||!doc.documentElement)return;ensure(doc);var dir=(lang==='ar'||lang==='ur')?'rtl':'ltr';doc.documentElement.setAttribute('dir',dir);doc.documentElement.setAttribute('lang',lang);doc.documentElement.setAttribute('data-mizan-lang',lang);}
root.MizanI18nDirection=Object.freeze({apply:apply});
})(typeof globalThis!=='undefined'?globalThis:window);
