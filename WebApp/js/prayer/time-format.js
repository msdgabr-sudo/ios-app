/* QiblaAstro — prayer-only 12-hour civil-time formatter. */
(function(root){
'use strict';
function wrap24(h){return ((Number(h)%24)+24)%24;}
function format12(hour){var h=wrap24(hour);if(!Number.isFinite(h))return '--:--';var total=Math.round(h*60)%1440,H=Math.floor(total/60),M=total%60,period=H<12?'ص':'م',display=H%12||12;return display+':'+String(M).padStart(2,'0')+' '+period;}
root.QiblaPrayerTimeFormat=Object.freeze({format12:format12});
})(typeof globalThis!=='undefined'?globalThis:window);
