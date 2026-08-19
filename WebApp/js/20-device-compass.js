// ══════════════════════════════════════════════════════════════════════════════
// [JS-29] MAIN LOOP
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  MAIN LOOP
// ════════════════════════════════════════════════
function loop(){
  // أعد حساب القبلة من الإحداثيات الحالية
  if(typeof calcQibla!=="undefined"){QT=calcQibla(LAT,LON);QM=((QT-MDECL)+360)%360;}

  tick++;
  // Update prayer cache
  
  const now=new Date();
  const dk=now.toDateString();
  if(dk!==eKey){eCache=solarEvts(now);eKey=dk;}
  const evts=eCache;
  const sp=sunPos(now);
  const mp=moonPos(now);
  // Cache for immediate compass redraw on orientation events
  _lastSp = sp;
  _lastMp = mp;
  const sunV=sp.altApp>-1,moonV=mp.altApp>-1;
  const lh=now.getHours()+now.getMinutes()/60+now.getSeconds()/3600;
  const tmStr=now.toLocaleTimeString('ar-EG');

  // TOP BAR
  set('top-time',tmStr);

  // ── DATES (Hijri + Gregorian) ──
  (function updateDates(){
    // Gregorian — always works
    try{
      const gFull = now.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      const gDate = now.toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'});
      const gDay  = now.toLocaleDateString('ar-EG',{weekday:'long'});
      set('date-greg',     gDate);
      set('date-greg-day', gDay);
    }catch(e){
      // Fallback: manual format
      const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      set('date-greg', now.getDate()+' '+months[now.getMonth()]+' '+now.getFullYear());
      set('date-greg-day', days[now.getDay()]);
    }
    // Hijri — try modern Intl, fallback to approximation
    try{
      const hFull = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',
        {weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(now);
      const hDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',
        {year:'numeric',month:'long',day:'numeric'}).format(now);
      const hDay  = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',
        {weekday:'long'}).format(now);
      set('date-hijri',     hDate);
      set('date-hijri-day', hDay);
      set('pr-h', hFull);
    }catch(e1){
      try{
        // Fallback: standard islamic calendar
        const hFull2 = new Intl.DateTimeFormat('ar-SA-u-ca-islamic',
          {year:'numeric',month:'long',day:'numeric'}).format(now);
        const hDay2  = new Intl.DateTimeFormat('ar',{weekday:'long'}).format(now);
        set('date-hijri',     hFull2);
        set('date-hijri-day', hDay2);
        set('pr-h', hFull2);
      }catch(e2){
        // Manual Hijri approximation (accurate ±1 day)
        const jd = Math.floor(now.getTime()/86400000) + 2440588;
        const l = jd - 1948440 + 10632;
        const n = Math.floor((l-1)/10631);
        const ll = l - 10631*n + 354;
        const j = Math.floor((10985-ll)/5316)*Math.floor((50*ll)/17719)
                + Math.floor(ll/5670)*Math.floor((43*ll)/15238);
        const ll2 = ll - Math.floor((30-j)/15)*Math.floor((17719*j)/50)
                 - Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
        const m2 = Math.floor((24*ll2)/709);
        const d2 = ll2 - Math.floor((709*m2)/24);
        const y2 = 30*n + j - 30;
        const hMonths=['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
        const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
        const hStr = d2+' '+hMonths[m2-1]+' '+y2+'هـ';
        set('date-hijri',     hStr);
        set('date-hijri-day', days[now.getDay()]);
        set('pr-h', days[now.getDay()]+' '+hStr);
      }
    }
  })();

  // ── COMPASS PAGE ──
  set('q-deg',QT.toFixed(2)+'°');
  set('q-sub',`حقيقي · مغناطيسي ${QM.toFixed(1)}° · WMM2025`);
  set('s-az',sp.az.toFixed(2)+'°');set('s-dir',d8(sp.az));
  set('s-alt',sp.altApp.toFixed(2)+'°');set('s-alts',sunV?'☀ فوق الأفق':'🌙 تحت الأفق');
  set('m-az',mp.az.toFixed(2)+'°');set('m-dir',d8(mp.az));
  set('m-alt',mp.altApp.toFixed(2)+'°');set('m-alts',moonV?'🌙 فوق الأفق':'● تحت الأفق');
  set('s-dec',sp.dec.toFixed(3)+'°');set('s-decs',sp.dec>=0?'ميل شمالي':'ميل جنوبي');
  set('s-eot',(sp.eot>=0?'+':'')+sp.eot.toFixed(2)+' د');set('s-eots',sp.eot>=0?'الشمس متأخرة':'الشمس مبكرة');
  set('m-ill',(mp.illum*100).toFixed(0)+'%');set('m-ph',phaseName(mp.illum,mp.elong));
  set('s-rf',sp.refr.toFixed(1)+'′');
  set('mag-d',(MDECL>=0?'+':'')+MDECL.toFixed(2)+'°');set('q-mag',QM.toFixed(2)+'°');
  if(evts){
    set('sr',hm(evts.rH));set('sn',hm(evts.nH));set('ss',hm(evts.sH));
    set('tl-r','شروق '+hm(evts.rH));set('tl-s','غروب '+hm(evts.sH));
    const p2=Math.max(0,Math.min(1,(lh-evts.rH)/(evts.sH-evts.rH)));
    const arc=4*p2*(1-p2);const arcH=gel('skyArc')?.offsetHeight||54;
    const sb=gel('sunBall');if(sb){sb.style.left=p2*100+'%';sb.style.bottom=(14+arc*(arcH-22))+'px';sb.className='sky-body sky-sun'+(sunV?'':' below');}
    const maxA=90-Math.abs(LAT-evts.dec);const sf=gel('sunFill');if(sf)sf.style.width=Math.max(0,sp.altApp/maxA*100).toFixed(1)+'%';
    const mrs=moonRS(evts,mp);
    set('mr',hm(mrs.rH));
    const mp2=Math.max(0,Math.min(1,(lh-mrs.rH)/(mrs.sH-mrs.rH)));
    const marc=4*mp2*(1-mp2);
    const mb=gel('moonBall');if(mb){mb.style.left=mp2*100+'%';mb.style.bottom=(14+marc*(arcH-22)*.72)+'px';mb.className='sky-body sky-moon'+(moonV?'':' below');}
    const maxMA=90-Math.abs(LAT-mp.dec);const mf=gel('moonFill');if(mf)mf.style.width=Math.max(0,mp.altApp/maxMA*100).toFixed(1)+'%';
    // PRAYER
    set('pr-r',hm(evts.rH));set('pr-raz','سمت '+evts.azR.toFixed(1)+'°');
    set('pr-s',hm(evts.sH));set('pr-saz','سمت '+evts.azS.toFixed(1)+'°');
    set('pr-n',hm(evts.nH));
  }

  // ── NIGHT PAGE ──
  set('nc-az',mp.az.toFixed(1)+'°');set('nc-d',d8(mp.az));
  set('nc-alt',mp.altApp.toFixed(1)+'°');set('nc-s',moonV?'فوق الأفق ✓':'تحت الأفق');
  set('nc-ill',(mp.illum*100).toFixed(0)+'%');
  const phn=phaseName(mp.illum,mp.elong);set('nc-ph',phn);
  drawPhase(mp.illum,mp.elong);
  set('ph-name',phn);
  set('ph-desc',`إضاءة ${(mp.illum*100).toFixed(0)}% · استطالة ${mp.elong.toFixed(0)}°`);
  const mrs2=evts?moonRS(evts,mp):null;
  set('ph-times',mrs2?`🌙 شروق ${hm(mrs2.rH)} · غروب ${hm(mrs2.sH)}`:'');
  drawPolaris(mp.az,moonV,mp.altApp);
  set('pol-status',sp.altApp<-6?'السماء مظلمة — ابحث عنه الآن ⭐':'انتظر الظلام الكامل (~1 ساعة بعد الغروب)');
  buildMethods(mp.altApp,mp.illum,sp.altApp);
  buildDG('dgN',mp.az,moonV,'القمر','🌙');
  set('night-dg-h',`القمر: ${d8(mp.az)} (${mp.az.toFixed(0)}°) · بولاريس: شمال دائماً`);
  // Night Qibla instruction
  const diffM=((QT-mp.az)+360)%360,degM=Math.min(diffM,360-diffM).toFixed(0);
  const sideM=diffM<180?'يسار القمر':'يمين القمر';
  let qi=``;
  if(sp.altApp<-6)qi+=`<strong style="color:var(--pole)">① بولاريس:</strong> ابحث عنه شمالاً على ارتفاع 30°.<br>القبلة = <strong>${QT.toFixed(1)}°</strong> منه (انحرف يميناً).<br><br>`;
  if(moonV&&mp.altApp>5)qi+=`<strong style="color:var(--moon)">② القمر:</strong> سمته الآن ${mp.az.toFixed(0)}°<br>القبلة على بُعد <strong>${degM}°</strong> إلى <strong>${sideM}</strong>.<br>${diffM<180?`→ واجه القمر ثم انحرف ${degM}° يساراً.`:`→ واجه القمر ثم انحرف ${(360-diffM).toFixed(0)}° يميناً.`}<br><br>`;
  if(!moonV&&sp.altApp>=-6)qi+=`<em style="color:var(--txt3)">القمر تحت الأفق الآن.</em><br><br>`;
  qi+=`<strong style="color:var(--qmag)">③ البوصلة المُصحَّحة:</strong> اضبطها على <strong>${QM.toFixed(1)}°</strong><br>(تعويض انحراف +${MDECL.toFixed(2)}° مغناطيسي)`;
  seti('qn-instr',qi);

  // ── CALIBRATE PAGE ──
  set('cal-az',sp.az.toFixed(1)+'°');set('cal-dir',d8(sp.az));
  const diff=((QT-sp.az)+360)%360,deg=Math.min(diff,360-diff).toFixed(0);
  set('cal-diff',deg+'°');set('cal-side',sunV?diff<180?'يسار الشمس':'يمين الشمس':'الشمس تحت الأفق');
  buildDG('dgD',sp.az,sunV,'الشمس','☀️');
  drawShadow(sp.az,sp.altApp,sunV);
  const shAz=(sp.az+180)%360;
  set('shad-txt',sunV?`ظل العصا الآن → ${d8(shAz)} (${shAz.toFixed(0)}°) — الشمال في جهة ${d8((shAz+90)%360)}`:'الشمس تحت الأفق — استخدم صفحة 🌙 الليل');
  // Noon proximity alert + dynamic Qibla
  if(evts){
    set('noon-time-cal',hm(evts.nH));set('noon-time-cal2',hm(evts.nH));
    const minsToNoon=(lh-evts.nH)*60; // negative = before noon
    const absMin=Math.abs(minsToNoon);
    if(absMin<1.5){
      seti('cal-qi',`<span style="font-size:1rem">⭐</span> <strong style="color:var(--sun)">الظهر الشمسي الحقيقي الآن!</strong><br>
        ظل أي شيء عمودي أمامك يشير إلى <strong style="color:var(--pole)">الشمال الجغرافي الحقيقي</strong> بدقة مطلقة.<br>
        انحرف من نهاية الظل <strong style="color:var(--gold)">${QT.toFixed(1)}°</strong> يميناً = القبلة.`);
    } else if(absMin<10&&minsToNoon<0){
      seti('cal-qi',`<strong style="color:var(--sun)">🕛 الظهر بعد ${absMin.toFixed(0)} دقيقة</strong><br>
        الظل يقترب من أقصر نقطة — راقبه وستحصل على الشمال بدقة مطلقة.`);
    } else if(absMin<10&&minsToNoon>0){
      seti('cal-qi',`<strong style="color:var(--sun)">🕛 مضى على الظهر ${absMin.toFixed(0)} دقيقة</strong><br>
        الظل كان شمالاً منذ قليل — لا يزال شبه شمالي بدقة جيدة.`);
    } else if(!sunV){
      seti('cal-qi',`<span style="color:var(--moon)">الشمس تحت الأفق الآن.<br>انتقل إلى 🌙 الليل للمعايرة بالقمر ونجم القطب.</span>`);
    } else if(sp.altApp<5){
      seti('cal-qi',`<span style="color:var(--warn)">⚠ الشمس قريبة من الأفق (${sp.altApp.toFixed(1)}°) — الظل طويل جداً وأقل دقة.<br>أفضل وقت للمعايرة: بين الضحى والعصر.</span>`);
    } else if(diff<180){
      seti('cal-qi',`واجه الشمس (<strong style="color:var(--sun)">${sp.az.toFixed(0)}°</strong>)،<br>القبلة على <strong style="color:var(--gold-l)">يسارك بـ${deg}°</strong><br><em style="color:var(--txt3)">→ كتفك الأيمن للشمس = القبلة أمامك</em>`);
    } else {
      seti('cal-qi',`واجه الشمس (<strong style="color:var(--sun)">${sp.az.toFixed(0)}°</strong>)،<br>القبلة على <strong style="color:var(--gold-l)">يمينك بـ${(360-diff).toFixed(0)}°</strong><br><em style="color:var(--txt3)">→ كتفك الأيسر للشمس = القبلة أمامك</em>`);
    }
  }

  // ── PRAYER PAGE ──
  updatePrayers(now,evts);
  try{set('pr-h',new Intl.DateTimeFormat('ar-SA-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'}).format(now));}catch(e){}

  // ── GNSS PAGE ──
  drawPolarDrift(now);
  set('gnss-qibla', QT.toFixed(2)+'° ← '+d8(QT));


  // ── SETTINGS PAGE ──
  set('cfg-qt',QT.toFixed(2)+'°');set('cfg-qm',QM.toFixed(2)+'°');
  set('cfg-md',(MDECL>=0?'+':'')+MDECL.toFixed(2)+'°');

  // ── CALIBRATE extras ──
  if(evts){
    set('noon-time-cal', hm(evts.nH));
    set('noon-time-cal2', hm(evts.nH));
  }
  // Error distance table (built once)
  if(!gel('err-table').children.length){
    const rows=[
      {lbl:'VSOP87 (شمس)',    deg:.1,  col:'var(--ok)'},
      {lbl:'ELP2000 (قمر)',   deg:.5,  col:'var(--moon)'},
      {lbl:'بولاريس',          deg:.02, col:'var(--pole)'},
      {lbl:'بوصلة + WMM2025', deg:2,   col:'var(--gold)'},
      {lbl:'بوصلة هاتف عادية',deg:5,   col:'var(--warn)'},
      {lbl:'بوصلة غير معايرة',deg:15,  col:'var(--err)'},
      {lbl:'تخمين عام',        deg:30,  col:'var(--err)'},
    ];
    const D=1300;
    gel('err-table').innerHTML=rows.map(r=>{
      const km=(2*D*Math.sin(r.deg/2*D2R)).toFixed(1);
      const pct=Math.min(100,(r.deg/30)*100);
      return`<div style="display:flex;align-items:center;gap:8px;padding:5px 7px;border-radius:7px;background:var(--ink2);">
        <div style="width:8px;height:8px;border-radius:50%;background:${r.col};flex-shrink:0"></div>
        <div style="flex:1;font-size:.7rem;color:var(--txt)">${r.lbl}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:.65rem;color:${r.col};width:36px;text-align:left">${r.deg}°</div>
        <div style="width:80px;height:5px;background:var(--ink3);border-radius:3px;overflow:hidden;flex-shrink:0">
          <div style="width:${pct}%;height:100%;background:${r.col};border-radius:3px"></div>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:.65rem;color:${r.col};width:55px;text-align:left">${km} كم</div>
      </div>`;
    }).join('');
  }

  // ── Device compass needle (if active) ──
  set('mag-decl-inline', MDECL.toFixed(2));
  if(deviceHeading !== null){
    const qDiff = ((QT - deviceHeading) + 360) % 360;
    const needleEl = gel('qibla-needle');
    const headEl   = gel('qibla-head');
    if(needleEl){
      const angle = qDiff; // rotate needle to point at qibla
      const cx=90, cy=90, r=70;
      const rad = (angle-90)*D2R;
      const x2 = cx+r*Math.cos(rad), y2 = cy+r*Math.sin(rad);
      const xh = cx+(r+10)*Math.cos(rad), yh = cy+(r+10)*Math.sin(rad);
      needleEl.setAttribute('x2', x2.toFixed(1));
      needleEl.setAttribute('y2', y2.toFixed(1));
      if(headEl){
        const a1r=(angle-96)*D2R, a2r=(angle-84)*D2R;
        headEl.setAttribute('points',
          `${xh.toFixed(1)},${yh.toFixed(1)} ${(cx+(r-4)*Math.cos(a1r)).toFixed(1)},${(cy+(r-4)*Math.sin(a1r)).toFixed(1)} ${(cx+(r-4)*Math.cos(a2r)).toFixed(1)},${(cy+(r-4)*Math.sin(a2r)).toFixed(1)}`);
      }
    }
  }

  // ── BACKGROUND & MAP ──
  drawMap();
  // drawDeviation تُستدعى من slider فقط

  // ── SKY BACKGROUND ──
  updateSkyBackground(sp, now);

  // ── HOME SCREEN ──
  try{updateHome(sp,mp,evts,now,pCache);}catch(e){}

  // ── CANVAS ──
  drawCompass(sp.az,sp.altApp,mp.az,mp.altApp,evts);

  // Home screen update
  

  // Adhan
  try{_checkAdhan(now,pCache);}catch(e){}

  // Compass boxes
  try{updateCompassBoxes();}catch(e){}
  // Cal offset display
  try{var cod=document.getElementById('cal-offset-display');if(cod)cod.textContent=(calOffset>=0?'+':'')+calOffset.toFixed(0)+'°';}catch(e){}

  setTimeout(loop,1000);
}

