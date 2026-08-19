/* Mizan / QiblaAstro — extended non-Arabic UI phrases.
 * Arabic remains the unchanged source UI. UI text only; no religious source text or engine logic.
 */
(function(root){
'use strict';
root.MIZAN_EXTRA_PHRASES=Object.freeze({
  en:Object.freeze({
    /* Common / prayer names */
    'رجوع':'Back','إغلاق':'Close','إعداد':'Setting','حفظ':'Save','تأكيد':'Confirm','إلغاء':'Cancel','التالي':'Next','السابق':'Previous',
    'الفجر':'Fajr','الشروق':'Sunrise','الظهر':'Dhuhr','العصر':'Asr','المغرب':'Maghrib','العشاء':'Isha',
    'الموقع والتاريخ':'Location and date','مسار مواقيت اليوم':'Today’s prayer timeline','إعدادات الأذان':'Adhan settings','موقعك الحالي':'Current location',

    /* Compass UI fragments */
    'أمسك هاتفك':'Hold your phone','أفقياً كالطاولة':'horizontally like a table','حرّكه ببطء شكل':'Move it slowly in a','رقم 8':'figure 8','في الهواء (3 مرات)':'in the air (3 times)','اضغط':'Tap',
    'إعادة المعايرة':'Recalibrate','تصحيح يدوي للانحراف':'Manual deviation correction','إذا كانت البوصلة منحرفة قليلاً':'If the compass is slightly offset',
    'إعادة ضبط + تصحيح الانحراف':'Reset + deviation correction','تحديد الموقع الجغرافي':'Detect geographic location','حرّك الشريط لترى أثر الخطأ على الهدف':'Move the slider to see how the error affects the target',
    'دقيق جداً':'Very accurate','داخل جدار الكعبة — يقين مطلق':'Within the Kaaba wall — absolute certainty','داخل حدود المسجد الحرام':'Within the Sacred Mosque boundary','خارج نطاق المسجد الحرام':'Outside the Sacred Mosque boundary',

    /* Prayer screen */
    'اضغط على الجرس لتخصيص تنبيه كل صلاة':'Tap the bell to customize each prayer alert','صيغة الفجر':'Fajr format','تنبيه قبل الصلاة':'Alert before prayer','بدون تنبيه مسبق':'No advance alert',
    'الأذان لجميع الصلوات':'Adhan for all prayers','الأذان الأساسي':'Default Adhan','الأذان مفعّل':'Adhan enabled','تجربة الأذان':'Test Adhan','اختبار صلاحية الصوت':'Audio readiness test',
    'نتأكد أولًا أن الهاتف يسمح للتطبيق بإخراج الصوت':'First we check that the phone allows the app to play audio','إعدادات المواقيت والتفاصيل':'Prayer time settings and details','طريقة الحساب':'Calculation method',

    /* Quran interface only */
    'أقسام القرآن':'Quran sections','١١٤ سورة':'114 Surahs','الأجزاء الثلاثون':'The thirty Juz','انتقال مباشر إلى بداية الجزء':'Jump directly to the beginning of a Juz',
    'المطابقة تتجاهل التشكيل والفروق الكتابية الشائعة لأغراض البحث فقط؛ النص القرآني المعروض لا يتغير.':'Search matching ignores diacritics and common spelling variations only; the displayed Quran text never changes.',
    'ابدأ خطة ختمتك وحدد عدد الصفحات التي تريد قراءتها يوميًا.':'Start your Khatma plan and choose how many pages you want to read each day.','٤ صفحات':'4 pages',
    'إذا قرأت أكثر من خطتك يتغير موعد الختمة تلقائيًا.':'If you read more than your plan, the expected completion date adjusts automatically.',
    'تقدير الحروف في قراءة اليوم':'Estimated letters in today’s reading','تقدير تقني تقريبي للتحفيز فقط، وليس حسابًا للثواب.':'A rough technical estimate for motivation only, not a calculation of reward.',
    'إضافة علامة مرجعية':'Add bookmark','العودة للفهرس':'Back to index','إظهار أو إخفاء شريط القراءة':'Show or hide reading toolbar','تصغير خط القرآن':'Decrease Quran font size','تكبير خط القرآن':'Increase Quran font size','حفظ موضع القراءة':'Save reading position',

    /* Adhkar interface only */
    'العودة إلى أقسام الأذكار':'Back to Adhkar sections','عدد التكرارات المتبقية':'Remaining repetitions','العودة إلى شاشة الأذكار':'Back to Adhkar screen','الذكر':'Dhikr','استماع إلى الذكر المختار':'Listen to selected dhikr',
    'اختر ذكرًا قصيرًا ليُسمع مرة واحدة كل فترة تحددها':'Choose a short dhikr to play once at the interval you set','اختر ذكرًا قصيرًا، ثم اختر كل كم دقيقة تريد سماعه مرة واحدة.':'Choose a short dhikr, then choose how often it should play once.',
    'الفاصل الزمني':'Interval','بدء التنبيه':'Start reminder','اختر الذكر والفاصل الزمني':'Choose the dhikr and interval','تذكير هادئ':'Gentle reminder',

    /* Falaki interface */
    'شكل القمر يمثل الطور ونسبة الإضاءة، وليس اتجاه ميل الجزء المضيء في السماء.':'The Moon graphic represents phase and illumination, not the tilt direction of the illuminated portion in the sky.',
    'عند إمكان رؤية نجم الشمال يمكن الاستدلال به على اتجاه الشمال، ثم معرفة اتجاه القبلة بالنسبة إليه وفق موقعك الجغرافي.':'When Polaris is visible, it can indicate north; the Qibla direction can then be related to it according to your location.',
    'فوق الأفق':'Above the horizon','تحت الأفق':'Below the horizon','مرئي':'Visible','غير مرئي':'Not visible','نهار':'Day','ليل':'Night'
  }),
  id:Object.freeze({
    'رجوع':'Kembali','إغلاق':'Tutup','إعداد':'Pengaturan','حفظ':'Simpan','تأكيد':'Konfirmasi','إلغاء':'Batal','التالي':'Berikutnya','السابق':'Sebelumnya',
    'الفجر':'Subuh','الشروق':'Matahari terbit','الظهر':'Zuhur','العصر':'Asar','المغرب':'Magrib','العشاء':'Isya',
    'الموقع والتاريخ':'Lokasi dan tanggal','مسار مواقيت اليوم':'Linimasa salat hari ini','إعدادات الأذان':'Pengaturan Azan','موقعك الحالي':'Lokasi saat ini',
    'أمسك هاتفك':'Pegang ponsel Anda','أفقياً كالطاولة':'mendatar seperti meja','حرّكه ببطء شكل':'Gerakkan perlahan membentuk','رقم 8':'angka 8','في الهواء (3 مرات)':'di udara (3 kali)','اضغط':'Ketuk',
    'إعادة المعايرة':'Kalibrasi ulang','تصحيح يدوي للانحراف':'Koreksi penyimpangan manual','إذا كانت البوصلة منحرفة قليلاً':'Jika kompas sedikit menyimpang',
    'إعادة ضبط + تصحيح الانحراف':'Atur ulang + koreksi penyimpangan','تحديد الموقع الجغرافي':'Tentukan lokasi geografis','حرّك الشريط لترى أثر الخطأ على الهدف':'Geser pengatur untuk melihat dampak kesalahan pada target',
    'دقيق جداً':'Sangat akurat','داخل جدار الكعبة — يقين مطلق':'Di dalam dinding Ka’bah — kepastian mutlak','داخل حدود المسجد الحرام':'Di dalam batas Masjidil Haram','خارج نطاق المسجد الحرام':'Di luar batas Masjidil Haram',
    'اضغط على الجرس لتخصيص تنبيه كل صلاة':'Ketuk lonceng untuk menyesuaikan pengingat setiap salat','صيغة الفجر':'Format Subuh','تنبيه قبل الصلاة':'Pengingat sebelum salat','بدون تنبيه مسبق':'Tanpa pengingat awal',
    'الأذان لجميع الصلوات':'Azan untuk semua salat','الأذان الأساسي':'Azan default','الأذان مفعّل':'Azan aktif','تجربة الأذان':'Uji Azan','اختبار صلاحية الصوت':'Uji kesiapan audio',
    'نتأكد أولًا أن الهاتف يسمح للتطبيق بإخراج الصوت':'Kami memastikan terlebih dahulu bahwa ponsel mengizinkan aplikasi memutar audio','إعدادات المواقيت والتفاصيل':'Pengaturan waktu dan detail','طريقة الحساب':'Metode perhitungan',
    'أقسام القرآن':'Bagian Al-Qur’an','١١٤ سورة':'114 Surah','الأجزاء الثلاثون':'Tiga puluh Juz','انتقال مباشر إلى بداية الجزء':'Langsung ke awal Juz',
    'المطابقة تتجاهل التشكيل والفروق الكتابية الشائعة لأغراض البحث فقط؛ النص القرآني المعروض لا يتغير.':'Pencarian mengabaikan harakat dan variasi ejaan umum hanya untuk pencocokan; teks Al-Qur’an yang ditampilkan tidak berubah.',
    'ابدأ خطة ختمتك وحدد عدد الصفحات التي تريد قراءتها يوميًا.':'Mulai rencana khatam dan tentukan jumlah halaman yang ingin dibaca setiap hari.','٤ صفحات':'4 halaman',
    'إذا قرأت أكثر من خطتك يتغير موعد الختمة تلقائيًا.':'Jika Anda membaca lebih dari rencana, perkiraan tanggal khatam akan menyesuaikan otomatis.',
    'تقدير الحروف في قراءة اليوم':'Perkiraan huruf dalam bacaan hari ini','تقدير تقني تقريبي للتحفيز فقط، وليس حسابًا للثواب.':'Perkiraan teknis untuk motivasi saja, bukan perhitungan pahala.',
    'إضافة علامة مرجعية':'Tambah penanda','العودة للفهرس':'Kembali ke indeks','إظهار أو إخفاء شريط القراءة':'Tampilkan atau sembunyikan bilah baca','تصغير خط القرآن':'Perkecil ukuran teks Al-Qur’an','تكبير خط القرآن':'Perbesar ukuran teks Al-Qur’an','حفظ موضع القراءة':'Simpan posisi bacaan',
    'العودة إلى أقسام الأذكار':'Kembali ke bagian Zikir','عدد التكرارات المتبقية':'Sisa pengulangan','العودة إلى شاشة الأذكار':'Kembali ke layar Zikir','الذكر':'Zikir','استماع إلى الذكر المختار':'Dengarkan zikir yang dipilih',
    'اختر ذكرًا قصيرًا ليُسمع مرة واحدة كل فترة تحددها':'Pilih zikir singkat untuk diputar sekali pada interval yang Anda tentukan','اختر ذكرًا قصيرًا، ثم اختر كل كم دقيقة تريد سماعه مرة واحدة.':'Pilih zikir singkat, lalu tentukan setiap berapa menit diputar sekali.',
    'الفاصل الزمني':'Interval','بدء التنبيه':'Mulai pengingat','اختر الذكر والفاصل الزمني':'Pilih zikir dan interval','تذكير هادئ':'Pengingat lembut',
    'شكل القمر يمثل الطور ونسبة الإضاءة، وليس اتجاه ميل الجزء المضيء في السماء.':'Grafik Bulan menunjukkan fase dan persentase iluminasi, bukan arah kemiringan bagian yang bercahaya di langit.',
    'عند إمكان رؤية نجم الشمال يمكن الاستدلال به على اتجاه الشمال، ثم معرفة اتجاه القبلة بالنسبة إليه وفق موقعك الجغرافي.':'Saat Polaris terlihat, bintang itu dapat menunjukkan utara; arah Kiblat kemudian dapat ditentukan relatif terhadapnya sesuai lokasi Anda.',
    'فوق الأفق':'Di atas horizon','تحت الأفق':'Di bawah horizon','مرئي':'Terlihat','غير مرئي':'Tidak terlihat','نهار':'Siang','ليل':'Malam'
  }),
  ur:Object.freeze({
    'رجوع':'واپس','إغلاق':'بند کریں','إعداد':'ترتیب','حفظ':'محفوظ کریں','تأكيد':'تصدیق','إلغاء':'منسوخ کریں','التالي':'اگلا','السابق':'پچھلا',
    'الفجر':'فجر','الشروق':'طلوعِ آفتاب','الظهر':'ظہر','العصر':'عصر','المغرب':'مغرب','العشاء':'عشاء',
    'الموقع والتاريخ':'مقام اور تاریخ','مسار مواقيت اليوم':'آج کی نمازوں کا وقتی خاکہ','إعدادات الأذان':'اذان کی ترتیبات','موقعك الحالي':'موجودہ مقام',
    'أمسك هاتفك':'اپنا فون پکڑیں','أفقياً كالطاولة':'میز کی طرح افقی','حرّكه ببطء شكل':'اسے آہستہ آہستہ','رقم 8':'8 کی شکل میں','في الهواء (3 مرات)':'ہوا میں حرکت دیں (3 بار)','اضغط':'دبائیں',
    'إعادة المعايرة':'دوبارہ کیلیبریٹ کریں','تصحيح يدوي للانحراف':'انحراف کی دستی تصحیح','إذا كانت البوصلة منحرفة قليلاً':'اگر قطب نما معمولی سا منحرف ہو',
    'إعادة ضبط + تصحيح الانحراف':'ری سیٹ + انحراف کی درستی','تحديد الموقع الجغرافي':'جغرافیائی مقام معلوم کریں','حرّك الشريط لترى أثر الخطأ على الهدف':'سلائیڈر حرکت دے کر ہدف پر خطا کا اثر دیکھیں',
    'دقيق جداً':'بہت درست','داخل جدار الكعبة — يقين مطلق':'کعبہ کی دیوار کے اندر — کامل یقین','داخل حدود المسجد الحرام':'مسجد الحرام کی حدود کے اندر','خارج نطاق المسجد الحرام':'مسجد الحرام کی حدود سے باہر',
    'اضغط على الجرس لتخصيص تنبيه كل صلاة':'ہر نماز کی یاد دہانی کے لیے گھنٹی دبائیں','صيغة الفجر':'فجر فارمیٹ','تنبيه قبل الصلاة':'نماز سے پہلے یاد دہانی','بدون تنبيه مسبق':'پیشگی یاد دہانی نہیں',
    'الأذان لجميع الصلوات':'تمام نمازوں کے لیے اذان','الأذان الأساسي':'بنیادی اذان','الأذان مفعّل':'اذان فعال ہے','تجربة الأذان':'اذان آزمائیں','اختبار صلاحية الصوت':'آڈیو تیاری کا ٹیسٹ',
    'نتأكد أولًا أن الهاتف يسمح للتطبيق بإخراج الصوت':'پہلے ہم یقینی بناتے ہیں کہ فون ایپ کو آواز چلانے کی اجازت دیتا ہے','إعدادات المواقيت والتفاصيل':'اوقات اور تفصیلات کی ترتیبات','طريقة الحساب':'حساب کا طریقہ',
    'أقسام القرآن':'قرآن کے حصے','١١٤ سورة':'114 سورتیں','الأجزاء الثلاثون':'تیس پارے','انتقال مباشر إلى بداية الجزء':'پارے کے آغاز پر براہ راست جائیں',
    'المطابقة تتجاهل التشكيل والفروق الكتابية الشائعة لأغراض البحث فقط؛ النص القرآني المعروض لا يتغير.':'تلاش کے لیے حرکات اور عام املا کے فرق نظر انداز کیے جاتے ہیں؛ دکھایا جانے والا قرآنی متن تبدیل نہیں ہوتا۔',
    'ابدأ خطة ختمتك وحدد عدد الصفحات التي تريد قراءتها يوميًا.':'اپنے ختم کا منصوبہ شروع کریں اور روزانہ پڑھنے کے صفحات طے کریں۔','٤ صفحات':'4 صفحات',
    'إذا قرأت أكثر من خطتك يتغير موعد الختمة تلقائيًا.':'اگر آپ منصوبے سے زیادہ پڑھیں تو متوقع ختم کی تاریخ خودکار طور پر بدل جائے گی۔',
    'تقدير الحروف في قراءة اليوم':'آج کی تلاوت کے حروف کا تخمینہ','تقدير تقني تقريبي للتحفيز فقط، وليس حسابًا للثواب.':'یہ صرف ترغیب کے لیے ایک تقریبی تکنیکی تخمینہ ہے، ثواب کا حساب نہیں۔',
    'إضافة علامة مرجعية':'بک مارک شامل کریں','العودة للفهرس':'فہرست پر واپس','إظهار أو إخفاء شريط القراءة':'مطالعہ بار دکھائیں یا چھپائیں','تصغير خط القرآن':'قرآن کے متن کا سائز کم کریں','تكبير خط القرآن':'قرآن کے متن کا سائز بڑھائیں','حفظ موضع القراءة':'مطالعہ کی جگہ محفوظ کریں',
    'العودة إلى أقسام الأذكار':'اذکار کے حصوں پر واپس','عدد التكرارات المتبقية':'باقی تکرار','العودة إلى شاشة الأذكار':'اذکار کی اسکرین پر واپس','الذكر':'ذکر','استماع إلى الذكر المختار':'منتخب ذکر سنیں',
    'اختر ذكرًا قصيرًا ليُسمع مرة واحدة كل فترة تحددها':'ایک مختصر ذکر منتخب کریں جو مقررہ وقفے پر ایک بار سنایا جائے','اختر ذكرًا قصيرًا، ثم اختر كل كم دقيقة تريد سماعه مرة واحدة.':'ایک مختصر ذکر منتخب کریں، پھر طے کریں کہ کتنے منٹ بعد ایک بار سننا ہے۔',
    'الفاصل الزمني':'وقفہ','بدء التنبيه':'یاد دہانی شروع کریں','اختر الذكر والفاصل الزمني':'ذکر اور وقفہ منتخب کریں','تذكير هادئ':'پرسکون یاد دہانی',
    'شكل القمر يمثل الطور ونسبة الإضاءة، وليس اتجاه ميل الجزء المضيء في السماء.':'چاند کی شکل مرحلہ اور روشنی کا تناسب دکھاتی ہے، روشن حصے کے جھکاؤ کی سمت نہیں۔',
    'عند إمكان رؤية نجم الشمال يمكن الاستدلال به على اتجاه الشمال، ثم معرفة اتجاه القبلة بالنسبة إليه وفق موقعك الجغرافي.':'اگر قطبی ستارہ نظر آئے تو اس سے شمال معلوم کیا جا سکتا ہے، پھر اپنے مقام کے مطابق اس کے نسبت سے قبلہ معلوم کیا جا سکتا ہے۔',
    'فوق الأفق':'افق کے اوپر','تحت الأفق':'افق کے نیچے','مرئي':'نظر آ رہا ہے','غير مرئي':'نظر نہیں آ رہا','نهار':'دن','ليل':'رات'
  })
});
})(typeof globalThis!=='undefined'?globalThis:window);
