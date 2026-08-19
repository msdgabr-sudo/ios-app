/* QiblaAstro — supplemental English phrases for safe screens only.
 * Digital compass and astronomical verification remain excluded by english-rollout.js.
 * Presentation text only; no calculations, engines, GNSS logic, camera or verification changes.
 */
(function(root){
'use strict';
root.MIZAN_EN_SAFE2_PHRASES=Object.freeze({
  /* Home remaining captions */
  'الاستماع':'Listen',
  'للقرآن المجيد':'to the Holy Quran',
  'منظومة الملاحة':'Navigation system',

  /* Astronomy remaining labels and explanations */
  'شمال شرقي':'Northeast',
  'شمال غربي':'Northwest',
  'جنوب شرقي':'Southeast',
  'جنوب غربي':'Southwest',
  'غير ظاهرة الآن':'Not visible now',
  'مناسب فلكياً للاستدلال':'Suitable for astronomical orientation',
  'مناسب فلكيا للاستدلال':'Suitable for astronomical orientation',
  'الشمس تحت الأفق':'The Sun is below the horizon',
  'الشمس فوق الأفق':'The Sun is above the horizon',
  'الشمس غير مناسبة حالياً للاستدلال بالظل.':'The Sun is not currently suitable for shadow-based orientation.',
  'الشمس غير مناسبة حاليا للاستدلال بالظل.':'The Sun is not currently suitable for shadow-based orientation.',
  'الموضع الحالي بين قطاعات المنازل':'Current position among the lunar-mansion sectors',
  'الطرف':'Al-Tarf',
  'نجم الشمال يحدد اتجاه الشمال تقريبياً. ومن موقعك تقع القبلة بالنسبة إليه بنحو':'Polaris indicates approximate north. From your location, the Qibla lies relative to it at about',
  'نجم الشمال يحدد اتجاه الشمال تقريبًا. ومن موقعك تقع القبلة بالنسبة إليه بنحو':'Polaris indicates approximate north. From your location, the Qibla lies relative to it at about',
  'استخدم البحارة قديماً الرصد السماوي وأدوات مثل السدس لقياس الزاوية بين جرم سماوي والأفق. ومع معرفة الوقت والجداول الفلكية أمكن استنتاج الموقع. أما الملاحة الحديثة فتستفيد من منظومات GNSS ومصادر ملاحية أخرى بحسب متطلبات الاعتمادية.':'Historically, sailors used celestial observations and tools such as the sextant to measure the angle between a celestial body and the horizon. With time and astronomical tables, position could be determined. Modern navigation instead uses GNSS and other navigation sources according to reliability requirements.',
  'السماء':'The sky',
  'الشمس والنجوم مراجع طبيعية':'The Sun and stars are natural references',
  'السدس':'Sextant',
  'قياس زاوية الجرم مع الأفق':'Measure the body’s angle above the horizon',
  'الملاحة الحديثة':'Modern navigation',
  'دمج مصادر متعددة عند الحاجة':'Combine multiple sources when needed',
  'لا يوجد مرجع سماوي مناسب الآن. الشمس والظل والقمر ليست في حالة عملية مناسبة للاستدلال البصري الآن. نعرض البيانات فقط حتى يتوفر مرجع مناسب.':'No suitable celestial reference is available now. The Sun, shadow and Moon are not currently in a practical state for visual orientation, so only the data are shown until a suitable reference becomes available.',
  'توهوكو M9.1 — زلزال اليابان 2011':'2011 Tohoku earthquake — M9.1',
  'سد الثلاث الوديان — الصين':'Three Gorges Dam — China',
  'تذبذب تشاندلر — دوري طبيعي (433 يوماً)':'Chandler wobble — natural cycle (433 days)',
  'تذبذب تشاندلر — دوري طبيعي (433 يومًا)':'Chandler wobble — natural cycle (433 days)',
  'مصحح تلقائياً في هذا التطبيق':'Automatically corrected in this app',
  'مصحح تلقائيًا في هذا التطبيق':'Automatically corrected in this app',
  'تأثير على القبلة':'Effect on Qibla',
  'يستحيل قياسه':'immeasurable in practice',
  'صفر عملياً':'effectively zero',
  'صفر عمليًا':'effectively zero',
  'موقع الشمس (نهاراً)':'Sun position (daytime)',
  'موقع الشمس (نهارًا)':'Sun position (daytime)',
  'نجم القطب بولاريس (ليلاً)':'Polaris (nighttime)',
  'نجم القطب بولاريس (ليلًا)':'Polaris (nighttime)',
  'موقع القمر (ليلاً)':'Moon position (nighttime)',
  'موقع القمر (ليلًا)':'Moon position (nighttime)',
  'بوصلة + تصحيح':'Compass + correction',
  'بوصلة هاتف غير معايرة':'Uncalibrated phone compass',

  /* Quran Khatma remaining UI */
  'موعد الختم المتوقع':'Expected completion date',
  'صفحة':'pages',
  'صفحات':'pages',
  'يومياً':'per day',
  'يوميًا':'per day',
  'المدة المتوقعة':'Estimated duration',
  'نحو':'about',
  'شهر':'months',
  'يوماً':'days',
  'يومًا':'days',
  'وردك المخطط اليوم':'Today’s planned reading',
  'يتغير موعد الختم تلقائياً مع تقدمك الفعلي.':'The completion date updates automatically with your actual progress.',
  'يتغير موعد الختم تلقائيًا مع تقدمك الفعلي.':'The completion date updates automatically with your actual progress.',

  /* GNSS / geophysical explanatory UI */
  'تأثير على القبلة:':'Effect on Qibla:',
  'مقارنة دقة طرق تحديد اتجاه القبلة':'Qibla direction method accuracy comparison',
  'الأحداث الجيوفيزيائية وتأثيرها الفعلي':'Geophysical events and their actual effect'
});

root.MIZAN_EN_SAFE2_DYNAMIC=Object.freeze([
  ['^إضاءة\\s*([0-9٠-٩.]+)%\\s*[·•]\\s*استطالة\\s*([0-9٠-٩.]+)°$','Illumination $1% · elongation $2°'],
  ['^الارتفاع\\s*([+-]?[0-9٠-٩.]+)°\\s*[·•]\\s*Azimuth\\s*([0-9٠-٩.]+)°$','Altitude $1° · Azimuth $2°'],
  ['^([0-9٠-٩.]+)°\\s*شمال شرقي$','$1° Northeast'],
  ['^([0-9٠-٩.]+)°\\s*شمال غربي$','$1° Northwest'],
  ['^([0-9٠-٩.]+)°\\s*جنوب شرقي$','$1° Southeast'],
  ['^([0-9٠-٩.]+)°\\s*جنوب غربي$','$1° Southwest'],
  ['^على خطة\\s+(.+?)\\s+صفحة يومي(?:اً|ًا):\\s*المدة المتوقعة\\s+(.+)$','With a plan of $1 pages per day: estimated duration $2'],
  ['^وردك المخطط اليوم\\s+(.+?)\\s+صفحة\\.?\\s*يتغير موعد الختم تلقائي(?:اً|ًا) مع تقدمك الفعلي\\.?$','Today’s planned reading is $1 pages. The completion date updates automatically with your actual progress.'],
  ['^تأثير على القبلة:\\s*(.+)$','Effect on Qibla: $1'],
  ['^نجم الشمال يحدد اتجاه الشمال تقريب(?:ياً|ًا)\\. ومن موقعك تقع القبلة بالنسبة إليه بنحو\\s*(.+)$','Polaris indicates approximate north. From your location, the Qibla lies relative to it at about $1']
]);
})(typeof globalThis!=='undefined'?globalThis:window);
