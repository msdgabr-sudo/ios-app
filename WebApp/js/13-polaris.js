// ══════════════════════════════════════════════════════════════════════════════
// [JS-19] POLARIS FINDER CANVAS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  POLARIS FINDER CANVAS
// ════════════════════════════════════════════════
let ptick=0;
function drawPolaris(maz,mvis,malt){
  const c=gel('polarisCvs');if(!c)return;
  const x=c.getContext('2d'),W=128,CX=64,CY=64,R=56;
  x.clearRect(0,0,W,W);
  const bg=x.createRadialGradient(CX,CY,0,CX,CY,R);
  bg.addColorStop(0,'#08091A');bg.addColorStop(1,'#020408');
  x.beginPath();x.arc(CX,CY,R,0,Math.PI*2);x.fillStyle=bg;x.fill();
  x.strokeStyle='#1A2A40';x.lineWidth=1.5;x.stroke();
  // Altitude rings
  [30,60].forEach(a=>{const r=R*(1-a/90);x.beginPath();x.arc(CX,CY,r,0,Math.PI*2);x.strokeStyle='rgba(26,44,68,.4)';x.lineWidth=.8;x.stroke();x.font='7px monospace';x.fillStyle='rgba(60,90,128,.6)';x.textAlign='left';x.fillText(a+'°',CX+r+2,CY);});
  // N cardinal
  x.font='bold 11px "JetBrains Mono",monospace';x.fillStyle='#3A7ACD';x.textAlign='center';x.textBaseline='middle';
  x.fillText('N',CX,CY-R+12);
  // Polaris glow
  const pR=R*(1-LAT/90),pX=CX,pY=CY-pR;
  const pg=x.createRadialGradient(pX,pY,2,pX,pY,11);
  pg.addColorStop(0,'rgba(96,240,240,.95)');pg.addColorStop(1,'rgba(96,240,240,0)');
  x.beginPath();x.arc(pX,pY,11,0,Math.PI*2);x.fillStyle=pg;x.fill();
  x.beginPath();x.arc(pX,pY,4,0,Math.PI*2);x.fillStyle='#60F0F0';x.fill();
  x.font='7px "JetBrains Mono",monospace';x.fillStyle='rgba(96,240,240,.75)';x.fillText('★',pX,pY-12);
  // Rotating Dipper
  ptick++;
  const da=ptick*.008;
  [[50,42,46,22],[46,22,42,30],[38,32,36,44]].forEach(([r1,a1,r2,a2])=>{
    const rd1=(a1+da*R2D-90)*D2R,rd2=(a2+da*R2D-90)*D2R;
    const x1=pX+r1*Math.cos(rd1),y1=pY+r1*Math.sin(rd1),x2=pX+r2*Math.cos(rd2),y2=pY+r2*Math.sin(rd2);
    x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.strokeStyle='rgba(180,160,100,.32)';x.lineWidth=1;x.stroke();
    [[x1,y1],[x2,y2]].forEach(([px2,py2])=>{x.beginPath();x.arc(px2,py2,2.5,0,Math.PI*2);x.fillStyle='rgba(200,180,120,.4)';x.fill();});
  });
  // Guide line to polaris
  const d1r=(44+da*R2D-90)*D2R;
  x.beginPath();x.moveTo(pX+46*Math.cos(d1r),pY+46*Math.sin(d1r));x.lineTo(pX,pY);
  x.strokeStyle='rgba(96,240,240,.15)';x.lineWidth=1.2;x.setLineDash([3,3]);x.stroke();x.setLineDash([]);
  // Moon if visible
  if(mvis&&malt>2){
    const mR=R*(1-malt/90),mRad=(maz-90)*D2R;
    const mx=CX+mR*Math.cos(mRad),my=CY+mR*Math.sin(mRad);
    const mg=x.createRadialGradient(mx,my,2,mx,my,8);
    mg.addColorStop(0,'rgba(138,174,240,.8)');mg.addColorStop(1,'rgba(138,174,240,0)');
    x.beginPath();x.arc(mx,my,8,0,Math.PI*2);x.fillStyle=mg;x.fill();
    x.beginPath();x.arc(mx,my,4,0,Math.PI*2);x.fillStyle='#8AAEF0';x.fill();
  }
  // Qibla direction
  const qr=(QT-90)*D2R;
  x.font='9px serif';x.fillStyle='rgba(200,164,74,.5)';x.textAlign='center';x.textBaseline='middle';
  x.fillText('🕋',CX+R*.72*Math.cos(qr),CY+R*.72*Math.sin(qr));
}

