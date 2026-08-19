// ══════════════════════════════════════════════════════════════════════════════
// [JS-21] POLAR DRIFT — Chandler wobble simulation
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  POLAR DRIFT (Chandler wobble simulation)
// ════════════════════════════════════════════════
function drawPolarDrift(now){
  const c=gel('polarDriftCvs');if(!c)return;
  const x=c.getContext('2d'),W=360,H=195,CX=180,CY=97,SC=16;
  x.clearRect(0,0,W,H);x.fillStyle='#030508';x.fillRect(0,0,W,H);
  for(let i=-10;i<=10;i++){
    x.beginPath();x.moveTo(CX+i*SC,0);x.lineTo(CX+i*SC,H);x.strokeStyle=i===0?'rgba(55,90,140,.55)':'rgba(22,38,58,.3)';x.lineWidth=i===0?1.5:.6;x.stroke();
    x.beginPath();x.moveTo(0,CY+i*SC);x.lineTo(W,CY+i*SC);x.strokeStyle=i===0?'rgba(55,90,140,.55)':'rgba(22,38,58,.3)';x.lineWidth=i===0?1.5:.6;x.stroke();
  }
  x.font='7px "JetBrains Mono",monospace';x.fillStyle='rgba(60,90,130,.65)';x.textAlign='center';
  x.fillText('+X (غرب 0°)',CX,H-3);
  // Spiral — Chandler+Annual
  x.beginPath();
  const t0=now.getTime()/1000;
  let firstPt=true,lastX,lastY;
  for(let i=-730;i<=0;i++){
    const t=t0+i*86400;
    const cX=.18*Math.cos(2*Math.PI*t/(433.2*86400)+.8);
    const cY=.18*Math.sin(2*Math.PI*t/(433.2*86400)+.8);
    const aX=.10*Math.cos(2*Math.PI*t/(365.25*86400)+1.2);
    const aY=.10*Math.sin(2*Math.PI*t/(365.25*86400)+1.2);
    const X=CX+(cX+aX)*SC,Y=CY-(cY+aY)*SC;
    if(firstPt){x.moveTo(X,Y);firstPt=false;}else x.lineTo(X,Y);
    if(i===0){lastX=X;lastY=Y;}
  }
  const gr=x.createLinearGradient(CX-3*SC,CY-3*SC,CX+3*SC,CY+3*SC);
  gr.addColorStop(0,'rgba(138,200,255,.12)');gr.addColorStop(1,'rgba(138,200,255,.42)');
  x.strokeStyle=gr;x.lineWidth=1.4;x.stroke();
  // Current pos
  if(lastX!==undefined){
    const gl=x.createRadialGradient(lastX,lastY,2,lastX,lastY,10);
    gl.addColorStop(0,'rgba(128,255,176,.9)');gl.addColorStop(1,'rgba(128,255,176,0)');
    x.beginPath();x.arc(lastX,lastY,10,0,Math.PI*2);x.fillStyle=gl;x.fill();
    x.beginPath();x.arc(lastX,lastY,4,0,Math.PI*2);x.fillStyle='#80FFB0';x.fill();
  }
  x.font='6px "JetBrains Mono",monospace';x.fillStyle='rgba(60,90,120,.7)';x.textAlign='right';
  x.fillText('كل خلية = 1 قوس ثانية (~31م)',W-3,H-3);
  // Update stats
  const t2=t0;
  const curX=.18*Math.cos(2*Math.PI*t2/(433.2*86400)+.8)+.10*Math.cos(2*Math.PI*t2/(365.25*86400)+1.2);
  const curY=.18*Math.sin(2*Math.PI*t2/(433.2*86400)+.8)+.10*Math.sin(2*Math.PI*t2/(365.25*86400)+1.2);
  set('pm-x',(curX>=0?'+':'')+curX.toFixed(3)+'″');
  set('pm-y',(curY>=0?'+':'')+curY.toFixed(3)+'″');
  set('pm-d','~'+(Math.sqrt(curX*curX+curY*curY)*31).toFixed(1)+'م');
}

