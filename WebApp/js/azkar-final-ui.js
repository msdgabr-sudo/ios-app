(()=>{'use strict';
function cleanAudioUI(){
  const state=document.getElementById('azAudioState');
  const summary=document.getElementById('azAudioSummary');
  const preview=document.getElementById('azPreviewBtn');
  if(state&&/بانتظار التسجيل البشري/.test(state.textContent||'')) state.textContent='متوقف';
  if(summary&&/التسجيل البشري|غير مضاف/.test(summary.textContent||'')) summary.textContent='الصوت غير متاح حاليًا';
  if(preview){
    const available=!preview.disabled;
    const wanted='<span aria-hidden="true">◖))</span>';
    if(preview.innerHTML!==wanted) preview.innerHTML=wanted;
    const label=available?'استماع إلى الذكر المختار':'الصوت غير متاح حاليًا';
    if(preview.getAttribute('aria-label')!==label) preview.setAttribute('aria-label',label);
    const title=available?'استماع':'الصوت غير متاح حاليًا';
    if(preview.title!==title) preview.title=title;
  }
}
function init(){
  cleanAudioUI();
  const panel=document.getElementById('azAudio');
  if(panel&&window.MutationObserver){new MutationObserver(cleanAudioUI).observe(panel,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled']});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
