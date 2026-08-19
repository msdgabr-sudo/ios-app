window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-QMRD6BZDRH");

// ══════════════════════════════════════════════════════════════════════════════
// [JS-4] CORE CONSTANTS & VARIABLES
// ══════════════════════════════════════════════════════════════════════════════

// QiblaAstro - Astronomical Qibla Compass
// Author  : Mohamed Sayed Gabr Behairy
// Arabic  : محمد سيد جبر بحيرى
// Version : 2.0  |  Year : 2026
// (c) 2026 Mohamed Sayed Gabr Behairy. All Rights Reserved.
// ════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════
const UTC_OFF=3;
const KLAT=21.42250833,KLON=39.82616667;
const R2D=180/Math.PI,D2R=Math.PI/180;



// ══════════════════════════════════════════════════════════════════════════════
// [JS-16] HELPERS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════
const D8=['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب'];
const DI=['⬆','↗','➡','↘','⬇','↙','⬅','↖'];
function d8(az){return D8[Math.round(((az%360)+360)/45)%8];}
function hm(h){
  if(h==null||isNaN(h))return'--:--';
  const hh=Math.floor(h)%24,mm=Math.round((h%1)*60);
  return`${String(mm===60?(hh+1)%24:hh).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}`;
}
function shms(s){
  s=Math.max(0,Math.round(s));
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;
  return h?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
function phaseName(ill,elong){
  if(elong<18)return'🌑 مولد';if(elong<90)return'🌒 هلال';
  if(elong<102)return'🌓 تربيع أول';if(elong<162)return'🌔 أحدب متزايد';
  if(elong<198)return'🌕 بدر كامل';if(elong<258)return'🌖 أحدب متناقص';
  if(elong<270)return'🌗 تربيع ثانٍ';if(elong<342)return'🌘 هلال متناقص';
  return'🌑 محاق';
}
function gel(id){return document.getElementById(id);}
function set(id,v){
  document.querySelectorAll('[id="'+id+'"]').forEach(function(e){
    e.textContent=v;
  });
}
function seti(id,v){const e=gel(id);if(e)e.innerHTML=v;}

