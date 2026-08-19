// ══════════════════════════════════════════════════════════════════════════════
// [JS-20] SHADOW DIAL
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  SHADOW DIAL
// ════════════════════════════════════════════════
function drawShadow(saz,salt,vis){
  const c=gel('shadowCvs');if(!c)return;
  const x=c.getContext('2d'),W=360,H=175,GX=180,GY=138,R=65;
  x.clearRect(0,0,W,H);x.fillStyle='#040608';x.fillRect(0,0,W,H);
  // Ground
  const gg=x.createLinearGradient(0,GY,W,GY);gg.addColorStop(0,'rgba(50,90,50,0)');gg.addColorStop(.5,'rgba(50,90,50,.25)');gg.addColorStop(1,'rgba(50,90,50,0)');x.fillStyle=gg;x.fillRect(0,GY,W,2);
  // Circle
  x.beginPath();x.arc(GX,GY,R,0,Math.PI*2);x.strokeStyle='#1A2C44';x.lineWidth=1.5;x.stroke();
  // Cardinals
  x.font='11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';
  [['N',0,'#3A7ACD'],['E',90,'#4A6A80'],['S',180,'#4A6A80'],['W',270,'#4A6A80']].forEach(([l,d,cl])=>{
    const r=(d-90)*D2R;x.fillStyle=cl;x.fillText(l,GX+(R+13)*Math.cos(r),GY+(R+13)*Math.sin(r));
  });
  // Peg
  x.beginPath();x.moveTo(GX,GY);x.lineTo(GX,GY-45);x.strokeStyle='rgba(170,150,90,.6)';x.lineWidth=3;x.lineCap='round';x.stroke();
  if(vis&&salt>2){
    const shAz=(saz+180)%360,shR=(shAz-90)*D2R;
    const sLen=Math.min(R-8,50*(1-salt/90)+12);
    const sg=x.createLinearGradient(GX,GY,GX+sLen*Math.cos(shR),GY+sLen*Math.sin(shR));
    sg.addColorStop(0,'rgba(150,130,75,.65)');sg.addColorStop(1,'rgba(50,40,16,.1)');
    x.beginPath();x.moveTo(GX,GY);x.lineTo(GX+sLen*Math.cos(shR),GY+sLen*Math.sin(shR));
    x.strokeStyle=sg;x.lineWidth=9;x.lineCap='round';x.stroke();
    const sr=(saz-90)*D2R;
    x.beginPath();x.moveTo(GX,GY);x.lineTo(GX+22*Math.cos(sr),GY+22*Math.sin(sr));
    x.strokeStyle='rgba(240,200,60,.4)';x.lineWidth=2;x.lineCap='round';x.stroke();
    x.font='12px serif';x.fillStyle='rgba(240,200,60,.6)';x.textAlign='center';x.textBaseline='middle';
    x.fillText('☀',GX+31*Math.cos(sr),GY+31*Math.sin(sr));
  } else {
    x.font='12px "Noto Naskh Arabic",serif';x.fillStyle='#3A5A7A';x.textAlign='center';x.textBaseline='middle';
    x.fillText(vis?'الشمس منخفضة جداً':'الشمس تحت الأفق',GX,GY);
  }
  const qr=(QT-90)*D2R;
  x.beginPath();x.moveTo(GX,GY);x.lineTo(GX+R*.72*Math.cos(qr),GY+R*.72*Math.sin(qr));
  x.strokeStyle='rgba(200,164,74,.28)';x.lineWidth=2;x.setLineDash([4,3]);x.stroke();x.setLineDash([]);
  x.font='9px serif';x.fillStyle='rgba(200,164,74,.52)';x.textAlign='center';x.textBaseline='middle';
  x.fillText('🕋',GX+R*.84*Math.cos(qr),GY+R*.84*Math.sin(qr));
}

