# QiblaAstro Quran Sources & Verification

هذا الملف جزء من ضوابط سلامة شاشة القرآن في QiblaAstro، ويجب نقله مع الشاشة وعدم حذفه.

## حالة الاعتماد الحالية — PASS

بتاريخ **2026-08-09** تم تنفيذ تحقق آلي كامل للنص العربي الموجود في `quran/*.json` على جميع السور والآيات.

نتيجة التحقق:

- السور المقارنة: **114 / 114**.
- الآيات المقارنة: **6236 / 6236**.
- اختلافات النص العربي: **0**.
- اختلافات هوية السور/النوع/عدد الآيات/أرقام الآيات وترتيبها: **0**.
- `LOCAL_QURAN_TEXT_SHA256`:
  `7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`
- `REFERENCE_QURAN_TEXT_SHA256`:
  `7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`
- SHA-256 لملف المرجع الذي نُزّل أثناء الاختبار:
  `d8a8adff387f60ce3ff7dbe3238dd9b27120bfe29d8fcb07ad2e89cad37cefd4`
- نتيجة الأداة:
  `QURAN EXACT TEXT CHECK: PASS`
  `QURAN PROVENANCE CHECK: PASS`

دليل التنفيذ موجود في GitHub Actions:

- Validation PR: **#17 — Validate final Quran corpus exact text**.
- Workflow run ID: **31290653695**.
- Job ID: **93187066094**.
- التحقق الناجح دُمج إلى `quran-stable` في commit:
  `cc043eb8840b093946bf839e7464756c818b9f56`

هذا إثبات تقني قوي على أن corpus العربي المحلي مطابق **حرفيًا** للمرجع المثبت المستخدم في الاختبار. وهو ليس ادعاءً بوجود شهادة مستقلة جديدة من لجنة مصحف؛ بل توثيق لسلسلة المصدر وتطابق بيانات الإصدار وعدم تعديلها داخل QiblaAstro.

## المرجع المثبت المستخدم في المطابقة الكاملة

المرجع المستخدم في الفحص الآلي:

`https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist/quran.json`

الإصدار مثبت صراحة على **quran-cloud@1.0.0** حتى لا يتغير المرجع بصمت بين تشغيل وآخر.

تعلن حزمة quran-cloud أن النص العثماني العربي مصدره **The Noble Qur'an Encyclopedia / QuranEnc**، بينما بيانات transliteration منفصلة وليست جزءًا من بوابة اعتماد النص العربي في QiblaAstro.

### QuranEnc / The Noble Qur'an Encyclopedia

- https://quranenc.com/
- https://quranenc.com/en/home/about

يُستخدم هنا كجزء من سلسلة المنشأ الموثقة للنص العربي الذي غُلّف في quran-cloud.

## مراجع مستقلة للمراجعة

### Quran Foundation / Quran.com

يُستخدم كمرجع مستقل مهم لبنية القرآن ومفاتيح الآيات وأنواع النص العثماني وبيانات الصفحات والأجزاء:

- https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/quran-verses-by-script/

لا توضع مفاتيح API أو أسرار OAuth داخل المتصفح أو المستودع.

### Tanzil Quran Text

مرجع مستقل معروف للنص القرآني Unicode والنص العثماني:

- https://tanzil.net/
- https://tanzil.net/docs/Uthmani
- https://tanzil.net/docs/download
- https://tanzil.net/docs/text_license

قد تختلف بعض تفاصيل Unicode/علامات الضبط بين تمثيلات عثمانية مختلفة؛ لذلك لا تُخلط حزم النصوص يدويًا ولا تُستبدل علامة بعلامة بالحدس.

## أدوات التحقق داخل المشروع

### 1. الفحص البنيوي / المرجعي العام

`scripts/verify-quran-text.mjs`

يتحقق من:

- وجود 114 سورة.
- العدد الصحيح لآيات كل سورة.
- تسلسل أرقام الآيات.
- المجموع 6236 آية.
- ويمكنه تنفيذ Exact Match عند تزويده بمرجع `surah|ayah|text`.

### 2. بوابة الإصدار المثبتة

`scripts/verify-quran-cloud-origin.mjs`

تقارن corpus العربي الكامل بالمرجع المثبت `quran-cloud@1.0.0` وتفشل عند:

- اختلاف حرف واحد في `text`.
- اختلاف رقم آية أو ترتيبها.
- اختلاف هوية السورة أو نوعها أو عدد آياتها.
- اختلاف SHA-256 للنص canonical بعد المقارنة.

الـ transliteration خارج نطاق اعتماد النص القرآني العربي ولا يُعرض بوصفه نص القرآن.

### GitHub Actions

- `.github/workflows/quran-structure-check.yml`
- `.github/workflows/quran-origin-check.yml`

أي فشل في بوابة النص يعني **رفض الإصدار/النقل** إلى أن يُفهم سبب الاختلاف. ممنوع إصلاح القرآن يدويًا بالتخمين.

## قواعد حماية النص في الواجهة

1. `quran/*.json` هو corpus محمي؛ لا تُعدّل الآيات لأغراض التصميم أو البحث.
2. محرك البحث ينشئ نسخة مشتقة normalized للمطابقة فقط، أما النص المعروض فهو `text` الأصلي.
3. النص القرآني المعروض موسوم `translate="no"` والصفحة تحتوي `google=notranslate` لمنع الترجمة الآلية من العبث بالنص.
4. لا تُضاف البسملة آليًا إلى سورة التوبة.
5. خط العرض الحالي هو **KFGQPC Uthmanic Script HAFS**؛ أي تغيير للنص أو الخط يحتاج اختبار توافق كامل قبل اعتماده.
6. بعد أي نقل أو تعديل لملفات القرآن يجب إعادة تشغيل بوابة المطابقة الكاملة.

## بيانات الأجزاء والصفحات

العرض داخل QiblaAstro **تمرير رأسي مستمر** وليس تقليب صفحات.

يستخدم التطبيق رقم الصفحة القياسي من 604 صفحة لأغراض التنقل والختمة والموقع فقط. بيانات بدايات الصفحات موجودة في:

`js/quran-pages.js`

ومصدرها `PageList` لرواية حفص في مشروع `quran-center/quran-meta`، الذي يتضمن أدوات مقارنة مع Tanzil metadata:

- https://github.com/quran-center/quran-meta/blob/master/src/lists/HafsLists.ts
- https://github.com/quran-center/quran-meta/blob/master/examples/data-check/Hafs/checkTanzil.ts
- https://github.com/quran-center/quran-meta/blob/master/examples/data-check/data/tanzil-data.js

## الحديث الوحيد في «ختمتي»

عن عبد الله بن مسعود رضي الله عنه، قال رسول الله ﷺ:

«مَن قرأ حرفًا من كتابِ اللهِ فله به حسنةٌ، والحسنةُ بعشرِ أمثالِها، لا أقولُ الم حرفٌ، ولكن ألفٌ حرفٌ، ولامٌ حرفٌ، وميمٌ حرفٌ».

رواه الترمذي، رقم **2910**. وقد نُص في المشروع على عدم تحويل تقدير الحروف إلى ادعاء بعدد حسنات مكتسبة؛ تقدير الحروف تقني تقريبي للتحفيز فقط.

مرجع التحقق الحديثي المستخدم أثناء التطوير:

https://dorar.net/h/fsDvOtYT

## بوابة التسليم

نسخة القرآن قابلة للتسليم فقط إذا بقيت الشروط التالية صحيحة:

- `114` سورة و`6236` آية.
- `TEXT_MISMATCHES=0`.
- `METADATA_MISMATCHES=0`.
- SHA-256 للنص المحلي يساوي:
  `7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`
- عدم تعديل `quran/*.json` يدويًا.
- بقاء حماية `notranslate`.
- نجاح الاختبارات الوظيفية بعد النقل.

للدليل المختصر القابل للتدقيق راجع: `QURAN_TEXT_VERIFICATION.md`.
ولتعليمات النقل النهائية راجع: `QURAN_HANDOFF.md`.
