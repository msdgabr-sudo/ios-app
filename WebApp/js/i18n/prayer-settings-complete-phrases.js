/* QiblaAstro — dynamic prayer settings localization completion.
 * Presentation translation only. Does not alter prayer calculations or locations.
 */
(function(root){
'use strict';
var METHOD_LABELS={
 en:{mwl:'Muslim World League (MWL)',egyptian:'Egyptian General Authority of Survey',ummAlQura:'Umm al-Qura — Makkah',karachi:'University of Islamic Sciences — Karachi',isna:'ISNA — North America',singapore:'Singapore / Malaysia / Indonesia',kuwait:'Kuwait',qatar:'Qatar'},
 fr:{mwl:'Ligue islamique mondiale (MWL)',egyptian:'Autorité égyptienne générale de topographie',ummAlQura:'Umm al-Qura — La Mecque',karachi:'Université des sciences islamiques — Karachi',isna:'ISNA — Amérique du Nord',singapore:'Singapour / Malaisie / Indonésie',kuwait:'Koweït',qatar:'Qatar'},
 id:{mwl:'Liga Muslim Dunia (MWL)',egyptian:'Otoritas Survei Umum Mesir',ummAlQura:'Umm al-Qura — Makkah',karachi:'Universitas Ilmu Islam — Karachi',isna:'ISNA — Amerika Utara',singapore:'Singapura / Malaysia / Indonesia',kuwait:'Kuwait',qatar:'Qatar'},
 ur:{mwl:'عالمی مسلم لیگ (MWL)',egyptian:'مصری جنرل اتھارٹی آف سروے',ummAlQura:'ام القریٰ — مکہ',karachi:'جامعۃ العلوم الاسلامیہ — کراچی',isna:'ISNA — شمالی امریکہ',singapore:'سنگاپور / ملائیشیا / انڈونیشیا',kuwait:'کویت',qatar:'قطر'}
};
function methodIdByArabic(core){
  try{var ms=root.QiblaPrayerMethods&&root.QiblaPrayerMethods.methods||{};var keys=Object.keys(ms);for(var i=0;i<keys.length;i++)if(ms[keys[i]]&&ms[keys[i]].label===core)return keys[i];}catch(_){}
  return '';
}
function cityLabel(core,lang){
  try{var cities=root.QiblaPrayerLocation&&root.QiblaPrayerLocation.cities||[];for(var i=0;i<cities.length;i++){var c=cities[i],ar=c.nameAr+'، '+c.countryAr;if(core===ar)return c.nameEn+', '+c.countryEn;}}catch(_){}
  return null;
}
function translate(core,lang){
  core=String(core||'').trim();if(!core||lang==='ar')return null;
  var prefix='';
  if(core.indexOf('تلقائي · ')===0){prefix=lang==='en'?'Automatic · ':lang==='fr'?'Automatique · ':lang==='id'?'Otomatis · ':'خودکار · ';core=core.slice('تلقائي · '.length);}
  else if(core.indexOf('يدوي · ')===0){prefix=lang==='en'?'Manual · ':lang==='fr'?'Manuel · ':lang==='id'?'Manual · ':'دستی · ';core=core.slice('يدوي · '.length);}
  var id=methodIdByArabic(core);if(id&&METHOD_LABELS[lang]&&METHOD_LABELS[lang][id])return prefix+METHOD_LABELS[lang][id];
  var city=cityLabel(core,lang);if(city)return prefix+city;
  return null;
}
root.MIZAN_PRAYER_SETTINGS_DYNAMIC_TRANSLATE=translate;
try{root.dispatchEvent(new CustomEvent('mizan:prayer-settings-complete-phrases-ready'));}catch(_){}
})(typeof globalThis!=='undefined'?globalThis:window);
