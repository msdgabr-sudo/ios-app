// ══════════════════════════════════════════════════════════════════════════════
// [JS-3] AZKAR ENGINE — محرك الأذكار
// ══════════════════════════════════════════════════════════════════════════════

// ══ Azkar Engine ══

var _zkCur='zs-sabah';
function zkSwitch(btn,sec){
  _zkCur=sec;
  ['zs-sabah','zs-masa','zs-nawm','zs-fajr','zs-salah','zs-masjid','zs-safar','zs-duaa'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.display=(id===sec?'block':'none');
  });
  document.querySelectorAll('.zk-tab').forEach(function(t){t.classList.remove('on');});
  if(btn){btn.classList.add('on');setTimeout(function(){btn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});},50);}
  zkProg(sec);
  var pg=document.getElementById('page-azkar');
  if(pg)pg.scrollTop=0;

  // خلفية حسب القسم
  if(pg){
    pg.classList.remove('bg-morning','bg-evening');
    if(sec==='zs-sabah') pg.classList.add('bg-morning');
    else if(sec==='zs-masa') pg.classList.add('bg-evening');
  }
}
function zkProg(sec){
  var el=document.getElementById(sec);if(!el)return;
  var tot=el.querySelectorAll('.zk').length;
  var dn=el.querySelectorAll('.zk.done').length;
  var pct=tot?Math.round(dn/tot*100):0;
  var pf=document.getElementById('zk-pf');if(pf)pf.style.width=pct+'%';
  var pt=document.getElementById('zk-pt');
  if(pt)pt.textContent=dn>0?(dn+' / '+tot+' — '+pct+'%'):'('+tot+' ذكراً)';
}
function zkTap(btn,total){
  if(btn.classList.contains('done-btn')){
    // إذا اكتمل هذا الذكر — أعد العداد عند الضغط مرة أخرى
    btn.classList.remove('done-btn');
    btn.closest('.zk').classList.remove('done');
    var t=btn.getAttribute('data-t')||'1';
    btn.textContent=(t==='1'?'تم ✓':t+' / '+t);
    zkProg(_zkCur);
    return;
  }
  var txt=btn.textContent.trim();
  var m=txt.match(/(\d+)\s*\/\s*(\d+)/);
  if(m){
    var rem=parseInt(m[1])-1;
    if(rem<=0){ zkDone(btn); }
    else{ btn.textContent=rem+' / '+parseInt(m[2]); try{navigator.vibrate(15);}catch(e){} }
  } else { zkDone(btn); }
}
function zkDone(btn){
  btn.textContent='✓ اكتمل';
  btn.classList.add('done-btn','flash');
  btn.closest('.zk').classList.add('done');
  setTimeout(function(){btn.classList.remove('flash');},350);
  try{navigator.vibrate([30,20,30]);}catch(e){}
  zkProg(_zkCur);

  // تحقق: هل اكتملت كل الأذكار؟
  var sec=document.getElementById(_zkCur);
  if(!sec) return;
  var tot=sec.querySelectorAll('.zk').length;
  var dn=sec.querySelectorAll('.zk.done').length;

  if(dn>=tot && tot>0){
    // اكتمل الكل — انتظر ثانية ثم أعد من الأول
    setTimeout(function(){
      // تأثير بصري قبل الإعادة
      var pt=document.getElementById('zk-pt');
      if(pt){
        pt.textContent='🎉 أحسنت! إعادة...';
        pt.style.color='var(--gold)';
      }
      setTimeout(function(){
        zkReset(_zkCur);
        if(pt) pt.style.color='';
        try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
      }, 1200);
    }, 600);
  }

  var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
  var _dn=document.querySelectorAll('.zk.done').length;
  var _dc=_dn<=1?3:_dn<=5?6:_dn<=10?10:15;
  try{zkDrops(_dc,_isMor);}catch(e){}
  var _sec=document.getElementById(_zkCur);
  if(_sec){
    var _tot=_sec.querySelectorAll('.zk').length;
    var _dnn=_sec.querySelectorAll('.zk.done').length;
    if(_dnn>=_tot&&_tot>0){
      setTimeout(function(){
        try{zkDrops(25,_isMor);}catch(e){}
        setTimeout(function(){
          try{zkCompletionMsg();}catch(e){}
          setTimeout(function(){zkReset(_zkCur);},1800);
        },500);
      },400);
    }
  }
}
function zkReset(sec){
  var el=document.getElementById(sec);if(!el)return;
  el.querySelectorAll('.zk').forEach(function(c){c.classList.remove('done');});
  el.querySelectorAll('.zk-btn').forEach(function(b){
    b.classList.remove('done-btn');
    var t=b.getAttribute('data-t');
    if(t)b.textContent=(t==='1'?'تم ✓':t+' / '+t);
  });
  zkProg(sec);
}
function azTab(btn,divId){
  var mp={'az-sabah':'zs-sabah','az-masa':'zs-masa','az-nawm':'zs-nawm','az-fajr':'zs-fajr','az-salah':'zs-salah','az-duaa':'zs-duaa'};
  var tp={'az-sabah':'zt-s','az-masa':'zt-m','az-nawm':'zt-n','az-fajr':'zt-f','az-salah':'zt-sl','az-duaa':'zt-d'};
  var b=document.getElementById(tp[divId]);zkSwitch(b,mp[divId]||divId);
}





'use strict';
