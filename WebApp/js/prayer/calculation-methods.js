/* QiblaAstro — global prayer calculation profiles.
 * Prayer-only domain module. It consumes existing solar event fields and never
 * touches Qibla, compass, camera, WMM or astronomical-verification state.
 */
(function(root){
'use strict';
var D2R=Math.PI/180,R2D=180/Math.PI;
var METHODS={
  mwl:{id:'mwl',label:'رابطة العالم الإسلامي (MWL)',fajrAngle:18,ishaAngle:17},
  egyptian:{id:'egyptian',label:'الهيئة المصرية العامة للمساحة',fajrAngle:19.5,ishaAngle:17.5},
  ummAlQura:{id:'ummAlQura',label:'أم القرى — مكة',fajrAngle:18.5,ishaInterval:90,ramadanIshaInterval:120},
  karachi:{id:'karachi',label:'جامعة العلوم الإسلامية — كراتشي',fajrAngle:18,ishaAngle:18},
  isna:{id:'isna',label:'ISNA — أمريكا الشمالية',fajrAngle:15,ishaAngle:15},
  singapore:{id:'singapore',label:'سنغافورة / ماليزيا / إندونيسيا',fajrAngle:20,ishaAngle:18},
  kuwait:{id:'kuwait',label:'الكويت',fajrAngle:18,ishaAngle:17.5},
  qatar:{id:'qatar',label:'قطر',fajrAngle:18,ishaInterval:90}
};
function clone(x){return JSON.parse(JSON.stringify(x));}
function wrap24(h){return ((Number(h)%24)+24)%24;}
function hourAngle(lat,dec,alt){var f=lat*D2R,d=dec*D2R;var c=(Math.sin(alt*D2R)-Math.sin(f)*Math.sin(d))/(Math.cos(f)*Math.cos(d));return Math.abs(c)>1?null:Math.acos(c)*R2D/15;}
function asrHours(lat,dec,factor){var f=lat*D2R,d=dec*D2R;var alt=Math.atan(1/(Number(factor||1)+Math.tan(Math.abs(f-d))))*R2D;return hourAngle(lat,dec,alt);}
function nightLength(rise,set){var daylight=wrap24(Number(set)-Number(rise));return 24-daylight;}
function highLatPortion(rule,angle,lat){if(rule==='middleNight')return .5;if(rule==='seventhNight')return 1/7;if(rule==='twilightAngle')return Math.min(.5,Math.max(0,Number(angle||18)/60));return Math.abs(Number(lat))>=48?1/7:Math.min(.5,Math.max(0,Number(angle||18)/60));}
function hijriMonth(date){try{return Number(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{month:'numeric'}).format(date));}catch(_){return 0;}}
function recommend(lat,lon){lat=Number(lat);lon=Number(lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return 'mwl';
  if(lat>=22&&lat<=32.2&&lon>=24&&lon<=37.5)return 'egyptian';
  if(lat>=16&&lat<=33&&lon>=34&&lon<=56)return 'ummAlQura';
  if(lat>=23&&lat<=37.5&&lon>=60&&lon<=78.5)return 'karachi';
  if(lat>=-11.5&&lat<=8&&lon>=95&&lon<=141.5)return 'singapore';
  if(lat>=28&&lat<=31&&lon>=46&&lon<=49)return 'kuwait';
  if(lat>=24&&lat<=27&&lon>=50&&lon<=52)return 'qatar';
  if(lat>=15&&lat<=72&&lon>=-170&&lon<=-50)return 'isna';
  return 'mwl';
}
function resolve(method,lat,lon){var id=method==='auto'?recommend(lat,lon):method;return METHODS[id]?clone(METHODS[id]):clone(METHODS.mwl);}
function calculate(ev,lat,options,date){if(!ev||!Number.isFinite(Number(lat)))return null;options=options||{};date=date instanceof Date?date:new Date(date||Date.now());var method=resolve(options.method||'auto',lat,options.lon);var r=Number(ev.rH),s=Number(ev.sH),n=Number(ev.nH),dec=Number(ev.dec);if(![r,s,n,dec].every(Number.isFinite))return null;
  var Hf=hourAngle(Number(lat),dec,-Number(method.fajrAngle));var Hi=method.ishaAngle!=null?hourAngle(Number(lat),dec,-Number(method.ishaAngle)):null;var asrFactor=options.asr==='hanafi'?2:1;var Ha=asrHours(Number(lat),dec,asrFactor);var night=nightLength(r,s);var highRule=options.highLatitude||'auto';
  var fajr=Hf==null?wrap24(r-highLatPortion(highRule,method.fajrAngle,lat)*night):wrap24(n-Hf);
  var maghrib=wrap24(s);
  var isha;if(method.ishaInterval!=null){var mins=(hijriMonth(date)===9&&method.ramadanIshaInterval)?method.ramadanIshaInterval:method.ishaInterval;isha=wrap24(maghrib+mins/60);}else{isha=Hi==null?wrap24(s+highLatPortion(highRule,method.ishaAngle,lat)*night):wrap24(n+Hi);}
  var pr=[{n:'الفجر',h:fajr},{n:'الشروق',h:wrap24(r)},{n:'الظهر',h:wrap24(n)},{n:'العصر',h:wrap24(Ha==null?n+3.5:n+Ha)},{n:'المغرب',h:maghrib},{n:'العشاء',h:isha}];
  return {method:method,methodId:method.id,asr:options.asr==='hanafi'?'hanafi':'standard',highLatitude:highRule,prayers:pr,adjustments:{dhuhr:0,maghrib:0}};
}
root.QiblaPrayerMethods=Object.freeze({methods:Object.freeze(clone(METHODS)),recommend:recommend,resolve:resolve,calculate:calculate});
})(typeof globalThis!=='undefined'?globalThis:window);
