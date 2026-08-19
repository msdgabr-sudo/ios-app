# QiblaAstro — Independent Quran Corpus Verification

**Status: PASS**  
**Verification date: 2026-08-09**

هذا التقرير طبقة تحقق **مستقلة** عن بوابة التطابق الحرفي الأساسية الموجودة في `QURAN_TEXT_VERIFICATION.md`.

## لماذا يوجد فحصان؟

لدينا مستويان مختلفان ولا يجوز خلطهما:

1. **Exact source verification**: يثبت أن corpus داخل QiblaAstro لم يتغير حرفيًا عن المرجع المثبت للإصدار `quran-cloud@1.0.0`، وهو ما نجح بـ `6236/6236` و`TEXT_MISMATCHES=0`.
2. **Independent Quranic-letter verification**: يقارن corpus بمصدر مستقل مستخدم فعليًا في تطبيق Quran for Android، حتى نتأكد أن اختلافات ترميز Unicode لا تخفي اختلافًا في حروف القرآن نفسها.

## المرجع المستقل

قاعدة حفص العثمانية المستخدمة في Quran for Android:

`quran.ar.uthmani.v2.db`

المسار الذي يتبعه التطبيق الرسمي لتنزيلها:

`https://android.quran.com/data/databases/quran.ar.uthmani.v2.db.zip`

تم التأكد من اسم القاعدة ومسار الخادم من مستودع Quran for Android المفتوح المصدر (`quran/quran_android`).

## نتيجة المقارنة

تم تشغيل:

`scripts/verify-quran-android-db.py`

على جميع الآيات، ومقارنة corpus المحلي بجدول `arabic_text` في قاعدة Quran for Android.

النتيجة:

- صفوف المرجع: **6236**.
- مفاتيح مفقودة: **0**.
- تطابق Unicode حرفيًا كما هو: **5297 / 6236**.
- تطابق تسلسل الحروف القرآنية بعد إزالة علامات الضبط/التطويل والمسافات الطباعية فقط: **6236 / 6236**.
- اختلافات حقيقية في الحروف القرآنية: **0**.

الناتج المسجل:

`QURAN ANDROID LETTER-LEVEL VERIFICATION: PASS (Unicode/marks review still required)`

### ماذا تعني 5297/6236؟

لا تعني وجود 939 آية مختلفة في القرآن. الاختلافات المرصودة في `arabic_text` هي اختلافات تمثيل عثماني/Unicode مثل موضع التطويل `ـ`، بعض علامات الضبط، أو مسافات Unicode طباعية، بينما تسلسل الحروف القرآنية بعد إزالة هذه الطبقة الطباعية يطابق **كل 6236 آية**.

لذلك **لا يجوز** استخدام هذه المقارنة لتعديل ملفات القرآن آيةً آيةً أو استبدال العلامات يدويًا. QiblaAstro يحافظ على corpus الحالي كوحدة واحدة لأنه اجتاز بوابة التطابق الحرفي مع مصدره المثبت.

## دليل GitHub Actions

Validation PR المؤقت: **#16 — Validate Quran corpus against Quran for Android DB**  
الفرع المؤقت: `validation/quran-android-db-20260809`  
Final validation head: `8ea0c566b0550558cf570493c9bde172470cff1c`

النتائج النهائية على نفس دورة التحقق:

- Quran for Android independent letter-level check: **PASS**
  - Run ID: `31290896689`
  - Job ID: `93187718161`
- Quran corpus provenance check: **PASS**
  - Run ID: `31290896671`
- Quran structure verification: **PASS**
  - Run ID: `31290896692`

## قاعدة الاعتماد

اعتماد corpus في QiblaAstro قائم على اجتماع الأدلة التالية:

- 114 سورة و6236 آية ببنية سليمة.
- تطابق حرفي كامل مع المرجع المثبت للإصدار: `TEXT_MISMATCHES=0`.
- SHA-256 canonical المحلي يساوي SHA-256 المرجع:
  `7b2b07124666739062f6992d914f2dc14fda010780aba524467cc56972d5bb0d`.
- مقارنة مستقلة مع Quran for Android: `6236/6236` في الحروف القرآنية و`0` اختلافات حرفية حقيقية.

هذا **توثيق تحقق تقني قوي ومتعدد المصادر**، وليس ادعاءً بأن QiblaAstro أصدر شهادة شرعية مستقلة جديدة للنص.

## ممنوعات

- ممنوع «تصحيح» اختلافات Unicode يدويًا.
- ممنوع دمج نصوص من مصدرين داخل corpus واحد.
- ممنوع تعديل `quran/*.json` بهدف تحسين الشكل أو البحث.
- أي تعديل لاحق على corpus يلزم إعادة الفحوص الكاملة قبل الإصدار.
