/* Mizan / QiblaAstro — dynamic UI status phrases only. */
(function(root){
'use strict';
root.MIZAN_STATUS_PHRASES=Object.freeze({
  en:Object.freeze({
    /* Quran UI statuses; Quran verses remain protected */
    'جاري تحميل السورة…':'Loading Surah…','تعذر تحميل السورة من ملفات القرآن المحلية.':'Could not load the Surah from local Quran files.',
    'تعذر تحميل السورة':'Could not load Surah','بداية المصحف':'Beginning of the Quran','نهاية المصحف':'End of the Quran','علاماتي':'My bookmarks','علامة':'bookmark','علامة مرجعية محفوظة':'Saved bookmark','حذف العلامة':'Delete bookmark',
    'جاري إعداد فهرس البحث المحلي لأول مرة…':'Preparing the local search index for the first time…','جاري إعداد الفهرس…':'Preparing index…','الفهرس جاهز':'Index ready','اكتب كلمة أو جزءًا من آية.':'Enter a word or part of a verse.','تعذر بناء فهرس البحث.':'Could not build the search index.','تعذر فهم عبارة البحث.':'Could not understand the search query.','لا توجد نتائج مطابقة.':'No matching results.',
    'مكية':'Meccan','مدنية':'Medinan','تمت':'Completed','أتممت صفحات الختمة المسجلة. يمكنك بدء ختمة جديدة.':'You completed the recorded Khatma pages. You can start a new Khatma.','حدد خطتك اليومية، ثم سجّل ما قرأته فعليًا.':'Set your daily plan, then record what you actually read.','يُحسب بعد تجهيز فهرس النص':'Calculated after the text index is prepared',
    /* Adhkar UI statuses; dhikr source text remains protected */
    'ذكر':'Dhikr','أذكار':'Adhkar','مرتان':'Twice','استماع':'Listen','الصوت سيضاف لاحقًا':'Audio will be added later','جاهز':'Ready','بانتظار التسجيل البشري':'Waiting for human recording','الذكر المختار':'Selected dhikr','يعمل الآن':'Running now','إيقاف التنبيه':'Stop reminder','التسجيل البشري غير مضاف بعد':'Human recording has not been added yet'
  }),
  id:Object.freeze({
    'جاري تحميل السورة…':'Memuat Surah…','تعذر تحميل السورة من ملفات القرآن المحلية.':'Tidak dapat memuat Surah dari file Al-Qur’an lokal.',
    'تعذر تحميل السورة':'Tidak dapat memuat Surah','بداية المصحف':'Awal Al-Qur’an','نهاية المصحف':'Akhir Al-Qur’an','علاماتي':'Penanda saya','علامة':'penanda','علامة مرجعية محفوظة':'Penanda tersimpan','حذف العلامة':'Hapus penanda',
    'جاري إعداد فهرس البحث المحلي لأول مرة…':'Menyiapkan indeks pencarian lokal untuk pertama kali…','جاري إعداد الفهرس…':'Menyiapkan indeks…','الفهرس جاهز':'Indeks siap','اكتب كلمة أو جزءًا من آية.':'Masukkan kata atau bagian ayat.','تعذر بناء فهرس البحث.':'Tidak dapat membangun indeks pencarian.','تعذر فهم عبارة البحث.':'Tidak dapat memahami kueri pencarian.','لا توجد نتائج مطابقة.':'Tidak ada hasil yang cocok.',
    'مكية':'Makkiyah','مدنية':'Madaniyah','تمت':'Selesai','أتممت صفحات الختمة المسجلة. يمكنك بدء ختمة جديدة.':'Anda telah menyelesaikan halaman khatam yang tercatat. Anda dapat memulai khatam baru.','حدد خطتك اليومية، ثم سجّل ما قرأته فعليًا.':'Tentukan rencana harian, lalu catat yang benar-benar Anda baca.','يُحسب بعد تجهيز فهرس النص':'Dihitung setelah indeks teks siap',
    'ذكر':'Zikir','أذكار':'Zikir','مرتان':'Dua kali','استماع':'Dengarkan','الصوت سيضاف لاحقًا':'Audio akan ditambahkan nanti','جاهز':'Siap','بانتظار التسجيل البشري':'Menunggu rekaman manusia','الذكر المختار':'Zikir terpilih','يعمل الآن':'Sedang berjalan','إيقاف التنبيه':'Hentikan pengingat','التسجيل البشري غير مضاف بعد':'Rekaman manusia belum ditambahkan'
  }),
  ur:Object.freeze({
    'جاري تحميل السورة…':'سورت لوڈ ہو رہی ہے…','تعذر تحميل السورة من ملفات القرآن المحلية.':'مقامی قرآن فائلوں سے سورت لوڈ نہیں ہو سکی۔',
    'تعذر تحميل السورة':'سورت لوڈ نہیں ہو سکی','بداية المصحف':'قرآن کا آغاز','نهاية المصحف':'قرآن کا اختتام','علاماتي':'میرے بک مارکس','علامة':'بک مارک','علامة مرجعية محفوظة':'محفوظ بک مارک','حذف العلامة':'بک مارک حذف کریں',
    'جاري إعداد فهرس البحث المحلي لأول مرة…':'مقامی تلاش کا اشاریہ پہلی بار تیار ہو رہا ہے…','جاري إعداد الفهرس…':'اشاریہ تیار ہو رہا ہے…','الفهرس جاهز':'اشاریہ تیار ہے','اكتب كلمة أو جزءًا من آية.':'کوئی لفظ یا آیت کا حصہ لکھیں۔','تعذر بناء فهرس البحث.':'تلاش کا اشاریہ تیار نہیں ہو سکا۔','تعذر فهم عبارة البحث.':'تلاش کی عبارت سمجھ نہیں آئی۔','لا توجد نتائج مطابقة.':'کوئی مماثل نتیجہ نہیں۔',
    'مكية':'مکی','مدنية':'مدنی','تمت':'مکمل','أتممت صفحات الختمة المسجلة. يمكنك بدء ختمة جديدة.':'آپ نے درج شدہ ختم کے صفحات مکمل کر لیے ہیں۔ نیا ختم شروع کر سکتے ہیں۔','حدد خطتك اليومية، ثم سجّل ما قرأته فعليًا.':'اپنا روزانہ منصوبہ طے کریں، پھر حقیقتاً پڑھے گئے صفحات درج کریں۔','يُحسب بعد تجهيز فهرس النص':'متن کا اشاریہ تیار ہونے کے بعد حساب ہوگا',
    'ذكر':'ذکر','أذكار':'اذکار','مرتان':'دو بار','استماع':'سنیں','الصوت سيضاف لاحقًا':'آڈیو بعد میں شامل ہوگا','جاهز':'تیار','بانتظار التسجيل البشري':'انسانی ریکارڈنگ کا انتظار','الذكر المختار':'منتخب ذکر','يعمل الآن':'ابھی چل رہا ہے','إيقاف التنبيه':'یاد دہانی روکیں','التسجيل البشري غير مضاف بعد':'انسانی ریکارڈنگ ابھی شامل نہیں ہوئی'
  })
});
})(typeof globalThis!=='undefined'?globalThis:window);
