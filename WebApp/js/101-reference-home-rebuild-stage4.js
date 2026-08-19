/* QiblaAstro — full reference home rebuild, stage 4
 * Presentation only. Existing calculation engines remain authoritative.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(){
  'use strict';
  function id(x){return document.getElementById(x)}
  function value(x,f){var n=id(x),t=n&&n.textContent?n.textContent.trim():'';return t||f}
  function go(page){try{if(typeof window.GT==='function')window.GT(page)}catch(e){}}
  function sync(){
    var map={
      qa4Bearing:['hm-qibla-deg','---°'],qa4Moon:['hm-moon-ill','--%'],qa4MoonPhase:['hm-moon-ph','متزايد'],
      qa4Sun:['s-alt','--°'],qa4Greg:['hm-date-greg','جاري حساب التاريخ'],qa4Hijri:['hm-date-hijri','جاري حساب التاريخ الهجري'],
      qa4Prayer:['hm-prayer-name','الصلاة القادمة'],qa4PrayerTime:['hm-prayer-time','--:--'],qa4PrayerEta:['hm-prayer-eta',''],qa4Gps:['hm-gps-src','في انتظار GNSS']
    };
    Object.keys(map).forEach(function(k){var n=id(k);if(n)n.textContent=value(map[k][0],map[k][1])});
  }
  function card(icon,title,sub,page,cls){return '<button class="qa4-card '+(cls||'')+'" data-go="'+page+'"><span class="qa4-card-icon">'+icon+'</span><strong>'+title+'</strong><small>'+sub+'</small></button>'}
  function mount(){
    var page=id('page-home'); if(!page||id('qa4-home'))return !!page;
    Array.prototype.forEach.call(page.children,function(c){c.classList.add('qa4-legacy')});
    var root=document.createElement('div');root.id='qa4-home';root.className='qa4-home';
    root.innerHTML='\
      <section class="qa4-hero">\
        <header class="qa4-top"><button aria-label="القائمة" class="qa4-menu"><i></i><i></i><i></i></button><div class="qa4-brand"><b>QiblaAstro</b><span>ULTIMATE</span></div><button aria-label="التنبيهات" class="qa4-bell">♧<em></em></button></header>\
        <div class="qa4-sky">\
          <div class="qa4-side moon"><span class="qa4-moon-orb"></span><b>القمر</b><strong id="qa4Moon">--%</strong><small id="qa4MoonPhase">متزايد</small></div>\
          <button class="qa4-bearing" data-go="compass"><span class="qa4-pointer">▲</span><span>اتجاه القبلة الحقيقي</span><strong id="qa4Bearing">---°</strong><em>دقة عالية جداً ◈</em></button>\
          <div class="qa4-side sun"><span class="qa4-sun-orb">☀</span><b>الشمس</b><strong>مرتفع</strong><small>الارتفاع <i id="qa4Sun">--°</i></small></div>\
          <div class="qa4-arc a1"></div><div class="qa4-arc a2"></div><div class="qa4-earth"></div><div class="qa4-kaaba"><i></i></div>\
        </div>\
        <div class="qa4-info"><div><span>التاريخ الهجري 🌙</span><strong id="qa4Hijri">---</strong></div><div><span>التاريخ الميلادي 📅</span><strong id="qa4Greg">---</strong></div><div class="prayer"><span>الصلاة القادمة <i></i></span><strong id="qa4Prayer">---</strong><em><b id="qa4PrayerTime">--:--</b> <small id="qa4PrayerEta"></small></em></div></div>\
      </section>\
      <section class="qa4-systems">\
        '+card('🛰️','GNSS','منظومة الملاحة GPS ±3m','gnss','system')+'\
        '+card('🧭','البوصلة الفلكية','اتجاه حقيقي ±0.1° دقة','compass','system active')+'\
        '+card('☀️◐','الشمس والقمر','مواقع فلكية لحظية','night','system')+'\
        '+card('⚙️','معايرة الحساسات','البوصلة والميل والاتجاه','calibration','system')+'\
      </section>\
      <section class="qa4-grid">\
        '+card('📖','القرآن الكريم','114 سورة','quran')+'\
        '+card('🕌','مواقيت الصلاة','بدقة عالية','prayer')+'\
        '+card('📿','الأذكار','حصن المسلم','azkar')+'\
        '+card('◉','التحقق من القبلة','فلكي / شمسي','compass','verify')+'\
        '+card('🔭','علم الفلك','تعلم واستكشاف','night')+'\
        '+card('🧭','الخريطة','الموقع والاتجاه','map')+'\
        '+card('⚙️','الإعدادات','تخصيص وتجربة','settings')+'\
        '+card('▦','المزيد','أدوات ومميزات','about')+'\
      </section>\
      <section class="qa4-status"><div><span>🛡️</span><p><b>حالة النظام</b><small>جميع الأنظمة تعمل بكفاءة</small></p></div><div><span>◎</span><p><b>دقة الاتجاه</b><small>±0.1°</small></p></div><div><span>◷</span><p><b>آخر تحديث</b><small id="qa4Gps">منذ 1 دقيقة</small></p></div></section>';
    page.insertBefore(root,page.firstChild);
    root.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
    sync();
    if(typeof MutationObserver!=='undefined'){
      ['hm-qibla-deg','hm-moon-ill','hm-moon-ph','s-alt','hm-date-greg','hm-date-hijri','hm-prayer-name','hm-prayer-time','hm-prayer-eta','hm-gps-src'].forEach(function(x){var n=id(x);if(n)new MutationObserver(sync).observe(n,{childList:true,subtree:true,characterData:true})});
    }
    window.addEventListener('qiblaastro:gnss-update',sync);
    setTimeout(sync,300);setTimeout(sync,1400);return true;
  }
  var n=0;function boot(){if(mount())return;if(++n<30)setTimeout(boot,120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();