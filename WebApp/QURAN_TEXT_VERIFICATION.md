# QiblaAstro — Quran Exact Text Verification Report

**Status: PASS**  
**Verification date: 2026-08-09**

هذا التقرير هو دليل الإصدار الخاص بسلامة corpus القرآن العربي المستخدم في شاشة القرآن في QiblaAstro.

## النطاق

تمت مقارنة الحقل العربي `text` لكل آية في ملفات المشروع `quran/1.json` حتى `quran/114.json` مع مرجع ثابت الإصدار، بالإضافة إلى هوية السور، النوع، عدد الآيات، أرقام الآيات وترتيبها.

لا يشمل اعتماد النص العربي حقل `transliteration`؛ فهو بيانات منفصلة وليس النص القرآني المعروض للمستخدم.

## المرجع المثبت

`quran-cloud@1.0.0/dist/quran.json`

URL المستخدم أثناء التشغيل:

`https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist/quran.json`

سلسلة المصدر موثقة في `QURAN_SOURCES.md`. الحزمة تعلن أن النص العثماني العربي مأخوذ من QuranEnc / The Noble Qur'an Encyclopedia.

## نتيجة التحقق

- `SURAHS_COMPARED=114`
- `AYAT_COMPARED=6236`
- `TEXT_MISMATCHES=0`
- `METADATA_MISMATCHES=0`
- `TRANSLITERATION_CHECK=OUT_OF_RELEASE_SCOPE`
- `QURAN EXACT TEXT CHECK: PASS`
- `QURAN PROVENANCE CHECK: PASS`

## البصمات SHA-256

المرجع الذي تم تنزيله أثناء الاختبار:

`REFERENCE_DOWNLOAD_SHA256=d8a8adff387f60ce3ff7dbe3238dd9b27120bfe29d8fcb07ad2e89cad37cefd4`

النص القرآني canonical المحلي بصيغة `surah|ayah|text`:

`LOCAL_QURAN_TEXT_SHA256=7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`

النص canonical المستخرج من المرجع نفسه:

`REFERENCE_QURAN_TEXT_SHA256=7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`

تساوي البصمتين الأخيرتين مع `TEXT_MISMATCHES=0` يثبت أن نصوص الآيات الـ6236 في corpus المحلي مطابقة حرفيًا للنص الموجود في المرجع المثبت وقت التحقق.

## دليل GitHub Actions للتطابق الحرفي

- Validation PR: `#17 — Validate final Quran corpus exact text`
- Successful workflow run ID: `31290653695`
- Successful job ID: `93187066094`
- Validation head commit: `1fb8402fcaea5990b59f26c041a7780795775c0f`
- Verified gate merged into `quran-stable` as:
  `cc043eb8840b093946bf839e7464756c818b9f56`

كما أُعيد تشغيل بوابة المنشأ لاحقًا على PR التحقق المستقل وأعطت مرة أخرى:

- `SURAHS_COMPARED=114`
- `AYAT_COMPARED=6236`
- `TEXT_MISMATCHES=0`
- `METADATA_MISMATCHES=0`
- `QURAN EXACT TEXT CHECK: PASS`
- Run ID: `31290896671`

## تحقق مستقل ثانٍ — Quran for Android

إضافة إلى التطابق الحرفي مع مرجع الإصدار، تم إجراء مقارنة مستقلة مع قاعدة حفص العثمانية المستخدمة في Quran for Android:

`quran.ar.uthmani.v2.db`

النتيجة على جدول `arabic_text`:

- الصفوف: `6236`.
- exact Unicode: `5297 / 6236`.
- تطابق تسلسل الحروف القرآنية بعد إزالة علامات الضبط/التطويل والمسافات الطباعية فقط: `6236 / 6236`.
- اختلافات حقيقية في الحروف القرآنية: `0`.
- مفاتيح آيات مفقودة: `0`.
- `QURAN ANDROID LETTER-LEVEL VERIFICATION: PASS`.

GitHub Actions:

- Validation PR المؤقت: `#16` — أُغلق بدون دمج.
- Run ID: `31290896689`.
- Job ID: `93187718161`.

الاختلاف بين `5297` و`6236` في التطابق الحرفي مع Quran for Android هو اختلاف **ترميز عثماني/Unicode** مثل موضع التطويل وبعض العلامات الطباعية، وليس اختلافًا في حروف القرآن. لذلك لا تُستخدم هذه المقارنة لاستبدال علامات corpus الحالي يدويًا.

للتفاصيل الكاملة راجع:

`QURAN_INDEPENDENT_VERIFICATION.md`

## الفاحصات

`scripts/verify-quran-cloud-origin.mjs`

يفشل إذا حدث أي اختلاف في النص العربي أو هوية/ترتيب/عدد الآيات أو إذا لم تتطابق بصمة SHA-256 النهائية.

`scripts/verify-quran-android-db.py`

ينفذ المقارنة المستقلة مع قاعدة Quran for Android ويفصل بين exact Unicode وبين تسلسل الحروف القرآنية.

يوجد كذلك:

`scripts/verify-quran-text.mjs`

للفحص البنيوي ولمطابقة مراجع نصية أخرى عند الحاجة.

## ضوابط بعد التحقق

- لا توجد أي خطوة إصلاح يدوي للآيات ضمن عملية التحقق.
- لا يجوز تعديل `quran/*.json` أثناء النقل أو بهدف البحث/التصميم.
- أي تعديل لاحق على corpus يلغي قيمة هذه البصمة حتى تتم إعادة المطابقة الكاملة.
- النص المعروض محمي من الترجمة الآلية بواسطة `translate="no"` و`google=notranslate`.
- اختلاف Unicode بين مصدرين موثوقين لا يُحل بنسخ علامات من أحدهما إلى الآخر آيةً آيةً؛ يجب الحفاظ على corpus كوحدة إصدار متسقة.
- هذا تقرير تطابق تقني متعدد المصادر، ولا يدّعي إنشاء شهادة شرعية مستقلة جديدة من لجنة مصحف.

**قاعدة الإصدار: إذا لم تعد البصمة المحلية مساوية للبصمة المسجلة أو ظهر اختلاف واحد في بوابة المصدر، يُرفض النقل/الإصدار حتى تتم المراجعة.**
