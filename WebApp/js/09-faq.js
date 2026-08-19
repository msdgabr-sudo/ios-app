// ══════════════════════════════════════════════════════════════════════════════
// [JS-9] FAQ BUILDER
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  FAQ BUILDER
// ════════════════════════════════════════════════
function buildFAQ(){
  const el=gel('faq-list');if(!el)return;
  const faqs=[
    {q:'لماذا لا أستخدم بوصلة الهاتف فقط؟',a:'بوصلة الهاتف تعتمد على الحقل المغناطيسي الذي يتأثر بكل معدن أو جهاز قريب، وقد تنحرف 5-30°. خطأ 5° = 113 كم انحراف عن الكعبة. هذا التطبيق يستخدم الأجرام السماوية كمرجع مطلق لا يتأثر.'},
    {q:'ما هو الظهر الشمسي الحقيقي ولماذا يختلف عن 12:00؟',a:'الظهر الشمسي = لحظة وصول الشمس لأعلى نقطة. يتقدم أو يتأخر عن 12:00 بسبب معادلة الزمن (±16 دقيقة) وموقعك داخل المنطقة الزمنية. من الجيزة يكون عادة بين 12:00 و 12:30.'},
    {q:'كيف أجد القبلة في الظلام الكامل؟',a:'① نجم القطب (بولاريس) شمالاً دائماً على ارتفاع 30° من الجيزة → ② القمر إذا كان مرئياً → ③ اتجاه الجدران والمبنى → ④ البوصلة المصحَّحة (−4.75°). التطبيق يرشدك خطوة بخطوة.'},
    {q:'هل أثّر زلزال اليابان 2011 على اتجاه القبلة؟',a:'لا. تحرّك محور الكتلة 17 سم فقط (وليس محور الدوران الجغرافي). التأثير على القبلة = 0.000001° — يستحيل قياسه. راجع صفحة GNSS للتفاصيل العلمية الكاملة.'},
    {q:'لماذا توجد قيمتان للقبلة (حقيقي ومغناطيسي)؟',a:'القبلة الحقيقية (136.2°) = من الشمال الجغرافي. المغناطيسية (131.5°) = ما تقرأه على البوصلة بعد تصحيح الانحراف WMM2025 (+4.75° شرقي في الجيزة).'},
    {q:'ما دقة التطبيق؟',a:'الشمس VSOP87: ±0.01° (~0.2 كم). القمر ELP2000: ±0.1° (~2.3 كم). نجم القطب: ±0.02° (~0.4 كم). الانحراف المغناطيسي WMM2025: ±0.5°. هذه من أدق الخوارزميات المتاحة في تطبيقات الهاتف.'},
  ];
  el.innerHTML=faqs.map((f,i)=>`
    <div style="background:var(--panel);border:1px solid var(--rim);border-radius:var(--radius-sm);overflow:hidden;">
      <div onclick="toggleFAQ(${i})" style="padding:11px 13px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
        <div style="font-size:.78rem;font-weight:600;color:var(--txt);flex:1;">${f.q}</div>
        <div id="faq-icon-${i}" style="color:var(--gold);font-size:.9rem;margin-right:6px;flex-shrink:0;transition:transform .2s;">▸</div>
      </div>
      <div id="faq-body-${i}" style="display:none;padding:0 13px 12px;font-size:.72rem;color:var(--txt2);line-height:1.8;">${f.a}</div>
    </div>`).join('');
}
function toggleFAQ(i){
  const body=gel(`faq-body-${i}`),icon=gel(`faq-icon-${i}`);
  if(!body)return;
  const open=body.style.display==='none';
  body.style.display=open?'block':'none';
  if(icon)icon.style.transform=open?'rotate(90deg)':'';
}

