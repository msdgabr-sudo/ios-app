(()=>{'use strict';
const D=window.QIBLAASTRO_AZKAR_DATA;
if(!D||!Array.isArray(D.audioPhrases))return;
const BASE='../assets/audio/azkar-alerts/';
const AUDIO={
  'سبحان الله':BASE+'سبحان الله (377).mp3',
  'الحمد لله':BASE+'الْحَمْدُ للهِ.mp3',
  'الله أكبر':BASE+'اللهُ أَكْبَرُ.mp3',
  'لا إله إلا الله':BASE+'لَا إِلٰهَ إِلَّا ال.mp3',
  'أستغفر الله':BASE+'أَسْتَغْفِرُ اللهَ.mp3',
  'أستغفر الله العظيم':BASE+'أَسْتَغْفِرُ اللهَ ا.mp3',
  'سبحان الله وبحمده':BASE+'سبحان الله وبحمده (377).mp3',
  'لا حول ولا قوة إلا بالله':BASE+'لَا حَوْلَ وَلَا قُو.mp3',
  'حسبي الله':BASE+'حَسْبِيَ اللهُ.mp3',
  'اللهم صل وسلم على نبينا محمد':BASE+'اللَّهُمَّ صَلِّ وَس.mp3'
};
D.audioPhrases=D.audioPhrases.map(function(p){
  const text=typeof p==='string'?p:(p&&p.text)||'';
  const existing=(p&&typeof p==='object'&&p.audio)||null;
  return {text:text,audio:Object.prototype.hasOwnProperty.call(AUDIO,text)?AUDIO[text]:(existing||null)};
});
})();
