// ══════════════════════════════════════════════════════════════════════════════
// [JS-8] SHARE & COPY
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  SHARE & COPY
// ════════════════════════════════════════════════
function shareApp(){
  const txt=`🕌 QiblaAstro — بوصلة القبلة الفلكية\nالقبلة من موقعك: ${QT.toFixed(2)}° (جنوب شرق)\n© Mohamed Sayed Gabr Behairy`;
  if(navigator.share){navigator.share({title:'QiblaAstro',text:txt}).catch(()=>{});}
  else{navigator.clipboard?.writeText(txt).then(()=>{const f=gel('share-feedback');if(f){f.textContent='✓ تم النسخ';setTimeout(()=>f.textContent='',2500);}});}
}
function copyQibla(){
  const txt=`اتجاه القبلة من الجيزة:\n• حقيقي: ${QT.toFixed(2)}°\n• مغناطيسي: ${QM.toFixed(2)}°\n• القبلة تقع جنوب شرق\n© QiblaAstro — Mohamed Sayed Gabr Behairy`;
  navigator.clipboard?.writeText(txt).then(()=>{const f=gel('share-feedback');if(f){f.textContent='✓ تم نسخ اتجاه القبلة';setTimeout(()=>f.textContent='',2500);}});
}

