// ══════════════════════════════════════════════════════════════════════════════
// [JS-26] DEVIATION CALCULATOR CANVAS
// ══════════════════════════════════════════════════════════════════════════════

function deviationBaseDistanceKm(){
  const earthR=6371.0088;
  const f1=LAT*D2R,f2=KLAT*D2R;
  const df=(KLAT-LAT)*D2R,dl=(KLON-LON)*D2R;
  const a=Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
  return earthR*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}

function drawDeviation(angleDeg){
  const c=gel('devCvs');if(!c)return;
  const x=c.getContext('2d'),W=c.width||360,H=c.height||130;
  x.clearRect(0,0,W,H);x.fillStyle='#040810';x.fillRect(0,0,W,H);
  const R=deviationBaseDistanceKm();
  const km=Math.round(2*R*Math.sin(Math.abs(angleDeg)/2*D2R));
  const CX=60,CY=H/2,len=W-80;
  const devRad=angleDeg*D2R;
  const kx=W-40,ky=CY;
  x.font='14px serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🕋',kx,ky);
  x.beginPath();x.moveTo(CX,CY);x.lineTo(kx-10,ky);
  x.strokeStyle='rgba(200,164,74,.5)';x.lineWidth=1.5;x.stroke();
  const ex1=CX+len*Math.cos(devRad),ey1=CY-len*Math.sin(devRad);
  const ex2=CX+len*Math.cos(-devRad),ey2=CY-len*Math.sin(-devRad);
  x.beginPath();x.moveTo(CX,CY);x.lineTo(ex1,ey1);
  x.strokeStyle='rgba(192,48,64,.7)';x.lineWidth=2;x.stroke();
  x.beginPath();x.moveTo(CX,CY);x.lineTo(ex2,ey2);
  x.strokeStyle='rgba(192,48,64,.7)';x.lineWidth=2;x.stroke();
  x.beginPath();x.arc(CX,CY,len*.4,-devRad,devRad);
  x.strokeStyle='rgba(192,48,64,.25)';x.lineWidth=14;x.stroke();
  x.font='bold 11px "JetBrains Mono",monospace';
  x.fillStyle='rgba(192,48,64,.9)';x.textAlign='left';x.textBaseline='middle';
  x.fillText('±'+angleDeg.toFixed(1)+'°',CX+len*.4+5,CY);
  x.fillStyle='rgba(236,100,80,.95)';x.textAlign='center';x.textBaseline='bottom';
  x.fillText(km<1?'دقيق جداً':km+' كم',CX,CY-18);
  x.beginPath();x.arc(CX,CY,6,0,Math.PI*2);x.fillStyle='#C8A44A';x.fill();
  x.font='8px "JetBrains Mono",monospace';
  x.fillStyle='rgba(200,164,74,.8)';x.textAlign='left';x.textBaseline='bottom';
  x.fillText('موقعك',CX+8,CY+2);
  set('dev-deg',angleDeg.toFixed(1)+'°');
  set('dev-km',km<1?'دقيق جداً ✅':km+' كم');
  set('dev-txt','خطأ '+angleDeg.toFixed(1)+'° = '+(km<1?'دقيق جداً':km+' كم انحراف'));
}

