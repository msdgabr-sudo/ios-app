/*
 * Mizan / QiblaAstro — English rollout safe UI batch.
 * Scope: Home + Serenity + GNSS + Astronomy + Prayer + Adhkar + Quran + Settings.
 * Explicitly excludes digital compass and astronomical verification.
 * No calculations, GNSS engine, astronomy engine, camera, verification, Quran text or dhikr source text.
 */
(function(root){
'use strict';

root.MIZAN_EN_BATCH1_PHRASES=Object.freeze({
  /* Home */
  'الارتفاع':'Altitude',
  'السمت':'Azimuth',
  'تحت الأفق':'Below the horizon',
  'فوق الأفق':'Above the horizon',
  'دقة الموقع':'Location accuracy',
  'موقعك الحالي':'Current location',
  'منظومة الملاحة ±3م':'Navigation system ±3 m',
  'الاستماع للقرآن المجيد':'Listen to the Holy Quran',
  '114 سورة':'114 Surahs',

  /* Serenity */
  'استمع إلى القرآن الكريم':'Listen to the Holy Quran',
  'مكتبتي':'My Library',
  'خطوات اختيار التلاوة':'Recitation selection steps',
  'اختر القارئ':'Choose reciter',
  'القارئ المفضل':'Preferred reciter',
  'اختر الرواية':'Choose edition',
  'الرواية أو نوع التلاوة':'Edition or recitation type',
  'اختر السورة':'Choose Surah',
  'السورة للاستماع':'Surah to listen to',
  'القارئ':'Reciter',
  'جاري تحميل القرّاء…':'Loading reciters…',
  'بعد اختيار القارئ':'After choosing reciter',
  'السورة':'Surah',
  'بعد اختيار الرواية':'After choosing edition',
  'الاستماع يحتاج اتصالًا بالإنترنت.':'Listening requires an internet connection.',
  'مشغل القرآن الكريم':'Quran player',
  'يُتلى الآن':'Now playing',
  'اختر سورة للاستماع':'Choose a Surah to listen to',
  'إضافة إلى المفضلة':'Add to favorites',
  'إزالة من المفضلة':'Remove from favorites',
  'السورة السابقة':'Previous Surah',
  'تشغيل أو إيقاف':'Play or pause',
  'السورة التالية':'Next Surah',
  'مؤقت النوم':'Sleep timer',
  'مؤقت':'Timer',
  'تغيير القارئ':'Change reciter',
  'تغيير الرواية':'Change edition',
  'تغيير السورة':'Change Surah',
  'قائمة السور':'Surah list',
  'التلاوات عبر MP3Quran.net':'Recitations via MP3Quran.net',
  'الخطوة الأولى':'Step one',
  'الخطوة الثانية':'Step two',
  'الخطوة الثالثة':'Step three',
  'ابحث باسم القارئ':'Search by reciter name',
  'اختر الرواية أو نوع التلاوة':'Choose edition or recitation type',
  'ابحث عن سورة':'Search for a Surah',
  'محفوظ على هذا الجهاز':'Saved on this device',
  'المفضلة':'Favorites',
  'استمعت مؤخرًا':'Recently played',
  'استماع هادئ قبل النوم':'Calm listening before sleep',
  '15 دقيقة':'15 minutes',
  '30 دقيقة':'30 minutes',
  '45 دقيقة':'45 minutes',
  '60 دقيقة':'60 minutes',
  'إيقاف عند نهاية السورة':'Stop at end of Surah',
  'إلغاء المؤقت':'Cancel timer',
  'يتم الاتصال بمكتبة التلاوات…':'Connecting to recitation library…',
  'تعذر تحميل القرّاء.':'Could not load reciters.',
  'إعادة المحاولة':'Try again',
  'تلاوة القرآن الكريم':'Quran recitation',
  'لا توجد نتائج':'No results',
  'لا توجد سورة مطابقة':'No matching Surah',
  'لا توجد عناصر محفوظة بعد':'No saved items yet',
  'نهاية السورة':'End of Surah',

  /* GNSS */
  'موقعك الحالي — متعدد الأنظمة':'Your current position — multi-system',
  'الموقع الحالي':'Current location',
  'مصدر الموقع':'Location source',
  'القبلة من موقعك الحالي':'Qibla from your current location',
  'محسوبة من إحداثياتك الفعلية':'Calculated from your actual coordinates',
  'تحديث GPS':'Update GPS',
  'موقع IP':'IP location',
  'الجهاز':'Device',
  'قمر':'satellites',
  'جنوب شرق':'Southeast',
  'جنوب غرب':'Southwest',
  'شمال شرق':'Northeast',
  'شمال غرب':'Northwest',
  'تأثير على القبلة':'effect on Qibla',

  /* Astronomy */
  'فلكي':'Astronomy',
  'الليل':'Night',
  'تحت الأفق الآن':'Below the horizon now',
  'فوق الأفق الآن':'Above the horizon now',
  'القمر تحت الأفق الآن.':'The Moon is below the horizon now.',
  'القمر فوق الأفق الآن.':'The Moon is above the horizon now.',
  'محاق':'New Moon',
  'هلال متزايد':'Waxing Crescent',
  'التربيع الأول':'First Quarter',
  'أحدب متزايد':'Waxing Gibbous',
  'بدر':'Full Moon',
  'أحدب متناقص':'Waning Gibbous',
  'التربيع الأخير':'Last Quarter',
  'هلال متناقص':'Waning Crescent',
  'إضاءة':'Illumination',
  'الاستطالة':'Elongation',
  'الارتفاع الظاهري':'Apparent altitude',
  'الشروق':'Rise',
  'الغروب':'Sunset',
  'الحالة':'State',
  'شمال':'North',
  'شرق':'East',
  'جنوب':'South',
  'غرب':'West',
  'المنزلة العربية المحسوبة':'Calculated Arabic lunar mansion',
  'المنزلة العربية الشمسية المحسوبة':'Calculated Arabic solar mansion',
  'تقسيم فلكي حسابي تعليمي بأسماء المنازل العربية، بلا تنبؤات أو أحكام.':'An educational astronomical calculation using traditional Arabic mansion names, without predictions or judgments.',

  /* Adhkar navigation/category UI only */
  'أذكار الصباح':'Morning Adhkar',
  'أذكار المساء':'Evening Adhkar',
  'أذكار النوم':'Before Sleep',
  'أذكار الاستيقاظ':'Upon Waking',
  'أذكار بعد الصلاة':'After Prayer Adhkar',
  'أذكار السفر':'Travel Adhkar',
  'الأدعية':'Supplications',
  'ورد هادئ من الأذكار والأدعية':'A calm daily collection of adhkar and supplications',
  'تذكير هادئ':'Gentle reminder',
  'اختر ذكرًا قصيرًا، ثم اختر كل كم دقيقة تريد سماعه مرة واحدة.':'Choose a short dhikr, then choose how often it should play once.',
  'الفاصل الزمني':'Interval',
  'بدء التنبيه':'Start reminder',
  'اختر الذكر والفاصل الزمني':'Choose the dhikr and interval',
  'ذكر':'dhikr',
  'أذكار':'adhkar',

  /* Prayer */
  'الصلاة القادمة':'Next prayer',
  'المتبقي':'Remaining',
  'مواقيت الصلاة':'Prayer Times',
  'الفجر':'Fajr',
  'الشروق':'Sunrise',
  'الظهر':'Dhuhr',
  'العصر':'Asr',
  'المغرب':'Maghrib',
  'العشاء':'Isha',
  'الصلاة التالية':'Next prayer',
  'اليوم':'Today',
  'اضغط على الجرس لتخصيص تنبيه كل صلاة':'Tap the bell to customize each prayer alert',
  'إعدادات المواقيت والتفاصيل':'Prayer settings and details',
  'إعدادات الأذان':'Adhan settings',

  /* Settings / common UI */
  'الإعدادات':'Settings',
  'اللغة':'Language',
  'اختر لغة التطبيق':'Choose app language',
  'الرئيسية':'Home',
  'رجوع للرئيسية':'Back to Home',

  /* Quran presentation labels only; Quran text itself stays protected */
  'القرآن الكريم':'The Holy Quran',
  'السور':'Surahs',
  'الفهرس':'Index',
  'العلامات':'Bookmarks',
  'البحث':'Search',
  'مصحف للقراءة والمتابعة':'Quran for reading and progress',
  'قراءة عثمانية · بحث في الآيات · ختمة وعلامات مرجعية':'Uthmani text · verse search · Khatma and bookmarks',
  'الأجزاء الثلاثون':'The thirty Juz',
  'انتقال مباشر إلى بداية الجزء':'Jump directly to the beginning of a Juz',
  'ابحث في القرآن':'Search the Quran',
  'اكتب ما تتذكره من الآية…':'Type what you remember from the verse…',
  'حفظ الموضع':'Save position',
  'تم حفظ موضع القراءة':'Reading position saved'
});

root.MIZAN_EN_BATCH1_DYNAMIC=Object.freeze([
  ['^الارتفاع\\s+(.+?)\\s*·\\s*السمت\\s+(.+)$','Altitude $1 · Azimuth $2'],
  ['^الارتفاع\\s+(.+)$','Altitude $1'],
  ['^السمت\\s+(.+)$','Azimuth $1'],
  ['^([0-9]+) قارئًا متاحًا$','$1 reciters available'],
  ['^([0-9]+) خيارات تلاوة ورواية$','$1 recitation/edition options'],
  ['^([0-9]+) تلاوة متاحة$','$1 recitation available'],
  ['^([0-9]+) خيارات متاحة$','$1 options available'],
  ['^([0-9]+) سورة متاحة$','$1 Surahs available'],
  ['^سورة (.+)$','Surah $1'],
  ['^عند (.+)$','at $1'],
  ['^([0-9]+) د$','$1 min'],
  ['^دقة الموقع\\s*±?\\s*([0-9.]+)\\s*م$','Location accuracy ±$1 m'],
  ['^~?([0-9.]+)\\s*م$','~$1 m'],
  ['^([0-9]+)\\s*قمر$','$1 satellites'],
  ['^GPS\\s*±?\\s*([0-9.]+)\\s*م$','GPS ±$1 m'],
  ['^إضاءة\\s*([0-9.]+)%\\s*·\\s*الاستطالة\\s*([0-9.]+)°$','Illumination $1% · elongation $2°'],
  ['^([0-9]+)\\s*أذكار$','$1 adhkar'],
  ['^([0-9]+)\\s*ذكر$','$1 dhikr']
]);

function formatHomeDates(doc){
  try{
    if(!doc||!doc.documentElement||doc.documentElement.getAttribute('data-mizan-lang')!=='en')return;
    var now=new Date(),greg=doc.getElementById('qaGreg'),hijri=doc.getElementById('qaHijri');
    if(greg){
      var gv=new Intl.DateTimeFormat('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(now);
      if(greg.textContent!==gv)greg.textContent=gv;
    }
    if(hijri){
      var hv=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{year:'numeric',month:'long',day:'numeric'}).format(now);
      if(hijri.textContent!==hv)hijri.textContent=hv;
    }
  }catch(_){ }
}
function bindHomeDates(doc){
  if(!doc||doc.__mizanEnBatch1HomeDates)return;
  doc.__mizanEnBatch1HomeDates=true;
  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(function(){scheduled=false;formatHomeDates(doc);},0);}
  ['qaGreg','qaHijri'].forEach(function(id){var e=doc.getElementById(id);if(e)new MutationObserver(schedule).observe(e,{subtree:true,childList:true,characterData:true});});
}
function apply(doc){formatHomeDates(doc);bindHomeDates(doc);}
root.MizanEnBatch1=Object.freeze({apply:apply});
})(typeof globalThis!=='undefined'?globalThis:window);
