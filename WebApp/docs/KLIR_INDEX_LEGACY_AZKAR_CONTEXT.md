# KLIR INDEX LEGACY AZKAR CONTEXT


## TOKEN: function zkCloseComplete | POS=203078

nearest_script_start=62519 nearest_script_end=222902

```
nst origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(function(){
  var sx=0,sy=0,tracking=false;
  var zone=document.getElementById('page-azkar');
  if(!zone)return;
  zone.addEventListener('touchstart',function(e){
    if(!e.touches||!e.touches[0])return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  zone.addEventListener('touchend',function(e){
    if(!tracking)return;tracking=false;
    if(!e.changedTouches||!e.changedTouches[0])return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
      if(dx>0)zkSwipePrev(_zkCur);else zkSwipeNext(_zkCur);
    }
  },{passive:true});
})();

window.zkShowIndex = zkShowIndex;
  window.zkShowCompletion = zkShowCompletion;
  window.zkCloseComplete = zkCloseComplete;
  window._zkIdxGet = function(){ return _zkIdx; };

  window.azShowCategories = function(){
    var cat=document.getElementById('az-categories-screen');
    var read=document.getElementById('az-reading-screen');
    if(cat)cat.classList.remove('az-hidden');
    if(read)read.classList.add('az-hidden');
  };
  window.azOpenCategory = function(sec,label){
    var cat=document.getElementById('az-categories-screen');
    var read=document.getElementById('az-reading-screen');
    if(cat)cat.classList.add('az-hidden');
    if(read)read.classList.remove('az-hidden');
    var t=document.getElementById('az-reading-title');
    if(t)t.textContent=label;
    zkSwitch(null,sec);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAzkar);
  else initAzkar();

  // Azkar init hook 
```


## TOKEN: var _zkIdx | POS=201865

nearest_script_start=62519 nearest_script_end=222902

```
 = Math.random() > 0.4;
      p.style.background = gold ? `radial-gradient(circle,rgba(200,164,74,${0.15+Math.random()*0.15}),transparent)` : `radial-gradient(circle,rgba(220,230,255,${0.1+Math.random()*0.15}),transparent)`;
      container.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 2000);
    }
  }

  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'az-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  const origZkSwitch = window.zkSwitch;
  window.zkSwitch = function(btn, sec) {
    const result = origZkSwitch.call(this, btn, sec);
    updateAzkarBackground(sec);
    document.querySelectorAll('.az-card').forEach((c, i) => {
      c.style.animation = 'none'; c.offsetHeight; c.style.animation = ''; c.style.animationDelay = (i * 0.05) + 's';
    });
    return result;
  };

  const origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(function(){
  var sx=0,sy=0,tracking=false;
  var zone=document.getElementById('page-azkar');
  if(!zone)return;
  zone.addEventListener('touchstart',function(e){
    if(!e.touches||!e.touches[0])return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  zone.addEventListener('touchend',function(e){
    if(!tracking)return;tracking=false;
    if(!e.c
```


## TOKEN: const origZkTap | POS=201476

nearest_script_start=62519 nearest_script_end=222902

```
lement('div');
      p.className = 'az-particle';
      const ox = (Math.random() - 0.5) * 100;
      const oy = (Math.random() - 0.5) * 40;
      const sz = 2 + Math.random() * 4;
      const dl = Math.random() * 0.3;
      p.style.cssText = `left:${x+ox}px;top:${y+oy}px;width:${sz}px;height:${sz}px;animation-delay:${dl}s;animation-duration:${0.8+Math.random()*0.6}s;`;
      const gold = Math.random() > 0.4;
      p.style.background = gold ? `radial-gradient(circle,rgba(200,164,74,${0.15+Math.random()*0.15}),transparent)` : `radial-gradient(circle,rgba(220,230,255,${0.1+Math.random()*0.15}),transparent)`;
      container.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 2000);
    }
  }

  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'az-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  const origZkSwitch = window.zkSwitch;
  window.zkSwitch = function(btn, sec) {
    const result = origZkSwitch.call(this, btn, sec);
    updateAzkarBackground(sec);
    document.querySelectorAll('.az-card').forEach((c, i) => {
      c.style.animation = 'none'; c.offsetHeight; c.style.animation = ''; c.style.animationDelay = (i * 0.05) + 's';
    });
    return result;
  };

  const origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(fu
```


## TOKEN: function initAzkar | POS=201813

nearest_script_start=62519 nearest_script_end=222902

```
ration:${0.8+Math.random()*0.6}s;`;
      const gold = Math.random() > 0.4;
      p.style.background = gold ? `radial-gradient(circle,rgba(200,164,74,${0.15+Math.random()*0.15}),transparent)` : `radial-gradient(circle,rgba(220,230,255,${0.1+Math.random()*0.15}),transparent)`;
      container.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 2000);
    }
  }

  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'az-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  const origZkSwitch = window.zkSwitch;
  window.zkSwitch = function(btn, sec) {
    const result = origZkSwitch.call(this, btn, sec);
    updateAzkarBackground(sec);
    document.querySelectorAll('.az-card').forEach((c, i) => {
      c.style.animation = 'none'; c.offsetHeight; c.style.animation = ''; c.style.animationDelay = (i * 0.05) + 's';
    });
    return result;
  };

  const origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(function(){
  var sx=0,sy=0,tracking=false;
  var zone=document.getElementById('page-azkar');
  if(!zone)return;
  zone.addEventListener('touchstart',function(e){
    if(!e.touches||!e.touches[0])return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  zone.addEventListener('touchend',function(e){
```


## TOKEN: zkShowCompletion | POS=202463

nearest_script_start=62519 nearest_script_end=222902

```
h:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  const origZkSwitch = window.zkSwitch;
  window.zkSwitch = function(btn, sec) {
    const result = origZkSwitch.call(this, btn, sec);
    updateAzkarBackground(sec);
    document.querySelectorAll('.az-card').forEach((c, i) => {
      c.style.animation = 'none'; c.offsetHeight; c.style.animation = ''; c.style.animationDelay = (i * 0.05) + 's';
    });
    return result;
  };

  const origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(function(){
  var sx=0,sy=0,tracking=false;
  var zone=document.getElementById('page-azkar');
  if(!zone)return;
  zone.addEventListener('touchstart',function(e){
    if(!e.touches||!e.touches[0])return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  zone.addEventListener('touchend',function(e){
    if(!tracking)return;tracking=false;
    if(!e.changedTouches||!e.changedTouches[0])return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
      if(dx>0)zkSwipePrev(_zkCur);else zkSwipeNext(_zkCur);
    }
  },{passive:true});
})();

window.zkShowIndex = zkShowIndex;
  window.zkShowCompletion = zkShowCompletion;
  window.zkCloseComplete = zkCloseComplete;
  window._zkIdxGet = function(){ return _zkIdx; };

  window.azShowCategories = function(){
    var cat=document.getElementById('az-categories-screen');
    var read=document.getElementById('az-reading-scree
```


## TOKEN: page-azkar .az-card | POS=203391

nearest_script_start=62519 nearest_script_end=222902

```
 btn, total);
  };

  function initAzkar() {
    azShowCategories();
  }

var _zkIdx=0;

function zkSectionCards(sec){
  var el=document.getElementById(sec);
  return el?Array.prototype.slice.call(el.querySelectorAll('.az-card')):[];
}
function zkShowIndex(sec,idx){
  var cards=zkSectionCards(sec);
  if(!cards.length)return;
  if(idx<0)idx=0;
  if(idx>=cards.length)idx=cards.length-1;
  _zkIdx=idx;
  cards.forEach(function(c,i){c.style.display=(i===idx?'':'none');});
}
function zkSwipeNext(sec){
  var cards=zkSectionCards(sec);
  if(_zkIdx<cards.length-1)zkShowIndex(sec,_zkIdx+1);
}
function zkSwipePrev(sec){
  if(_zkIdx>0)zkShowIndex(_zkCur,_zkIdx-1);
}
function zkShowCompletion(sec){
  var names={'zs-sabah':'أذكار الصباح','zs-masa':'أذكار المساء','zs-nawm':'أذكار النوم','zs-fajr':'أذكار الاستيقاظ','zs-salah':'أذكار بعد الصلاة','zs-duaa':'الأدعية'};
  var t=document.getElementById('az-complete-title');
  if(t)t.textContent='تم إكمال '+(names[sec]||'');
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='flex';
  try{navigator.vibrate([100,50,100,50,200]);}catch(e){}
  try{
    var _isMor=document.getElementById('page-azkar')&&document.getElementById('page-azkar').classList.contains('bg-morning');
    zkDrops(25,_isMor);
  }catch(e){}
}
function zkCloseComplete(){
  var el=document.getElementById('az-complete-screen');
  if(el)el.style.display='none';
  zkReset(_zkCur);
  zkShowIndex(_zkCur,0);
}

// اللمس في أي مكان بالبطاقة = عدّ (بدلاً من زر منفصل)
document.addEventListener('click',function(e){
  var card=e.target.closest?e.target.closest('#page-azkar .az-card'):null;
  if(!card||card.classList.contains('done'))return;
  if(e.target.closest('.az-btn'))return;
  var btn=card.querySelector('.az-btn');
  if(btn)zkTap(btn,parseInt(btn.getAttribute('data-t')||'1',10));
});

// السحب يمين/يسار للتنقل (بدون تأثير على العدّ)
(function(){
  var sx=0,sy=0,tracking=false;
  var zone=document.getElementById('page-azkar');
  if(!zone)return;
  zone.addEventListener('touchstart',function(e){
    if(!e.touches||!e.touches[0])return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  zone.addEventListener('touchend',function(e){
    if(!tracking)return;tracking=false;
    if(!e.changedTouches||!e.changedTouches[0])return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
      if(dx>0)zkSwipePrev(_zkCur);else zkSwipeNext(_zkCur);
    }
  },{passive:true});
})();

window.zkShowIndex = zkShowIndex;
  window.zkShowCompletion = zkShowCompletion;
  window.zkCloseComplete = zkCloseComplete;
  window._zkIdxGet = function(){ return _zkIdx; };

  window.azShowCategories = function(){
    var cat=document.getElementById('az-categories-screen');
    var read=document.getElementById('az-reading-screen');
    if(cat)cat.classList.remove('az-hidden');
    if(read)read.classList.add('az-hidden');
  };
  window.azOpenCategory = function(sec,label){
    var cat=document.getElementById('az-categories-screen');
    var read=document.getElementById('az-reading-screen');
    if(cat)cat.classList.add('az-hidden');
    if(read)read.classList.remove('az-hidden');
    var t=document.getElementById('az-reading-title');
    if(t)t.textContent=label;
    zkSwitch(null,sec);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAzkar);
  else initAzkar();

  // Azkar init hook — safely attached without redefining window.GT
  if (window.GT && !window.GT._azkarHookInstalled) {
    var _gtAzkarBase = window.GT;
    window.GT = function(id) {
      var result = _gtAzkarBase(id);
      if (id === 'azkar') setTimeout(initAzkar, 100);
      return result;
    };
    window.GT._azkarHookInsta
```
