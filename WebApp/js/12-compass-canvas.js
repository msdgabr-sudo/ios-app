// ══════════════════════════════════════════════════════════════════════════════
// [JS-17] DIRECTION GRID
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  DIRECTION GRID
// ════════════════════════════════════════════════
function buildDG(id,baz,bvis,blbl,bico){
  const qC=Math.round(((QT%360)+360)/45)%8;
  const bC=bvis?Math.round(((baz%360)+360)/45)%8:-1;
  const degs=[0,45,90,135,180,225,270,315];
  const el=gel(id);if(!el)return;
  el.innerHTML=D8.map((nm,i)=>{
    const isQ=i===qC,isB=i===bC&&!isQ;
    return`<div class="dc${isQ?' hl':isB?' hlm':''}"><div class="d-icon">${isQ?'🕋':isB?bico:DI[i]}</div><div class="d-name">${nm}</div><div class="d-deg">${degs[i]}°</div><div class="d-note">${isQ?'القبلة':isB?blbl:''}</div></div>`;
  }).join('');
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-18] MOON PHASE CANVAS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  MOON PHASE CANVAS
// ════════════════════════════════════════════════
function drawPhase(ill,elong){
  const c=gel('phaseCvs');if(!c)return;
  const x=c.getContext('2d'),W=88,CX=44,CY=44,R=34;
  x.clearRect(0,0,W,W);
  x.beginPath();x.arc(CX,CY,R,0,Math.PI*2);x.fillStyle='#06080E';x.fill();
  x.strokeStyle='#1E2E44';x.lineWidth=1.5;x.stroke();
  x.save();x.beginPath();x.arc(CX,CY,R,0,Math.PI*2);x.clip();
  const wan=elong>180,frac=wan?2*ill-1:1-2*ill,tx=CX+R*frac*(wan?-1:1);
  const lg=x.createRadialGradient(CX,CY,0,CX,CY,R);
  lg.addColorStop(0,'#D8E8FF');lg.addColorStop(.6,'#8AAEF0');lg.addColorStop(1,'#3A5898');
  x.beginPath();x.moveTo(tx,CY-R);
  if(!wan){x.bezierCurveTo(CX,CY-R,CX,CY+R,tx,CY+R);x.bezierCurveTo(CX+R,CY+R,CX+R,CY-R,tx,CY-R);}
  else{x.bezierCurveTo(CX,CY-R,CX,CY+R,tx,CY+R);x.bezierCurveTo(CX-R,CY+R,CX-R,CY-R,tx,CY-R);}
  x.fillStyle=lg;x.fill();x.restore();
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-24] MAIN COMPASS CANVAS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  MAIN COMPASS CANVAS
// ════════════════════════════════════════════════
const CVS=gel('cvs'),CTX=CVS?CVS.getContext('2d'):null;
const CW=660,CCX=330,CCY=330,CR=290;
let tick=0;

function PX(r,a){const rd=(a-90)*D2R;return[CCX+r*Math.cos(rd),CCY+r*Math.sin(rd)];}

function drawCompass(saz,salt,maz,malt,evts){
  if(!CTX)return;
  CTX.clearRect(0,0,CW,CW);

  // ── REAL COMPASS LOGIC ────────────────────────────
  // compassRotation = -deviceHeading
  // Rotates the WHOLE canvas so phone-forward = screen-top
  // Qibla arrow drawn at fixed angle QT → naturally shows direction
  const useDevice = deviceHeading!==null && compassAvailable;
  const rot = useDevice ? -deviceHeading*D2R : 0;

  // ── BG: سماء صيفية صافية ─────────────────────────
  const bg=CTX.createRadialGradient(CCX,CCY*0.4,0,CCX,CCY,CR);
  bg.addColorStop(0,'#1E5AAA');
  bg.addColorStop(0.4,'#1A4E96');
  bg.addColorStop(0.75,'#163E7A');
  bg.addColorStop(1,'#0D2850');
  CTX.beginPath();CTX.arc(CCX,CCY,CR,0,Math.PI*2);CTX.fillStyle=bg;CTX.fill();
  // سحب بيضاء طبيعية
  (function(){
    function cloud(cx,cy,sz,op){
      CTX.save();CTX.globalAlpha=op;CTX.fillStyle='rgba(255,255,255,.9)';
      var pts=[[0,0,sz*.7],[sz*.5,sz*.1,sz*.5],[sz,0,sz*.6],[sz*.5,-sz*.2,sz*.4]];
      for(var p=0;p<pts.length;p++){
        CTX.beginPath();CTX.arc(cx+pts[p][0],cy+pts[p][1],pts[p][2],0,Math.PI*2);CTX.fill();
      }
      CTX.restore();
    }
    cloud(CCX*0.55,CCY*0.35,24,0.10);
    cloud(CCX*1.1, CCY*0.30,20,0.08);
    cloud(CCX*0.80,CCY*0.55,16,0.07);
  })();
  const hl=CTX.createRadialGradient(CCX,CCY,CR-3,CCX,CCY,CR+18);
  hl.addColorStop(0,'rgba(200,164,74,.05)');hl.addColorStop(1,'rgba(200,164,74,0)');
  CTX.beginPath();CTX.arc(CCX,CCY,CR+18,0,Math.PI*2);CTX.fillStyle=hl;CTX.fill();

  // ════════════════════════════════════════════════
  //  ROTATING LAYER — everything rotates with phone
  // ════════════════════════════════════════════════
  CTX.save();
  CTX.translate(CCX,CCY);
  CTX.rotate(rot);
  CTX.translate(-CCX,-CCY);

  // Inner rings
  [1,.68,.38].forEach(f=>{
    CTX.beginPath();CTX.arc(CCX,CCY,CR*f,0,Math.PI*2);
    CTX.strokeStyle=`rgba(30,46,68,${f===1?.85:.3})`;CTX.lineWidth=f===1?2:1;CTX.stroke();
  });

  // 1-360° tick marks
  for(let deg=0;deg<360;deg++){
    const rad=(deg-90)*D2R,cos=Math.cos(rad),sin=Math.sin(rad);
    const is90=deg%90===0,is45=deg%45===0&&!is90,is10=deg%10===0&&!is45&&!is90,is5=deg%5===0&&!is10&&!is45&&!is90;
    const tI=is90?CR-32:is45?CR-22:is10?CR-16:is5?CR-11:CR-7;
    CTX.beginPath();CTX.moveTo(CCX+CR*cos,CCY+CR*sin);CTX.lineTo(CCX+tI*cos,CCY+tI*sin);
    CTX.strokeStyle=is90?'rgba(58,106,170,.9)':is45?'rgba(30,56,100,.8)':is10?'rgba(20,40,70,.7)':is5?'rgba(14,28,50,.55)':'rgba(10,20,38,.35)';
    CTX.lineWidth=is90?2.8:is45?1.8:is10?1.2:is5?.9:.5;CTX.stroke();
    if(deg%10===0&&deg!==0&&deg%45!==0&&deg%90!==0){
      const lr=CR-44,lx=CCX+lr*cos,ly=CCY+lr*sin;
      CTX.save();CTX.translate(lx,ly);CTX.rotate(rad+Math.PI/2);
      var isMain30=(deg%90!==0&&deg%30===0);
      CTX.font=(isMain30?'bold 11px':'8px')+' "JetBrains Mono",monospace';
      CTX.fillStyle=isMain30?'rgba(200,220,255,.85)':'rgba(80,110,160,.55)';
      CTX.textAlign='center';CTX.textBaseline='middle';
      CTX.fillText(deg,0,0);CTX.restore();
    }
    if(deg%5===0&&deg%10!==0){
      const dr=CR-43;CTX.beginPath();CTX.arc(CCX+dr*cos,CCY+dr*sin,1.2,0,Math.PI*2);
      CTX.fillStyle='rgba(40,70,110,.4)';CTX.fill();
    }
  }

  // Cardinals
  CTX.textAlign='center';CTX.textBaseline='middle';
  [['N',0,'#5A9AFF','bold 22px "JetBrains Mono",monospace'],
   ['E',90,'#6888AA','bold 16px "JetBrains Mono",monospace'],
   ['S',180,'#6888AA','bold 16px "JetBrains Mono",monospace'],
   ['W',270,'#6888AA','bold 16px "JetBrains Mono",monospace']].forEach(([l,d,c,f])=>{
    const r2=(d-90)*D2R,lr=CR-56,lx=CCX+lr*Math.cos(r2),ly=CCY+lr*Math.sin(r2);
    CTX.save();CTX.translate(lx,ly);CTX.rotate(r2+Math.PI/2);
    CTX.font=f;CTX.fillStyle=c;CTX.fillText(l,0,0);CTX.restore();
  });
  [['NE',45],['SE',135],['SW',225],['NW',315]].forEach(([l,d])=>{
    const r2=(d-90)*D2R,lr=CR-54,lx=CCX+lr*Math.cos(r2),ly=CCY+lr*Math.sin(r2);
    CTX.save();CTX.translate(lx,ly);CTX.rotate(r2+Math.PI/2);
    CTX.font='bold 11px "JetBrains Mono",monospace';CTX.fillStyle='rgba(80,120,180,.80)';CTX.fillText(l,0,0);CTX.restore();
  });
  {
    const r2=(0-90)*D2R,lr=CR-44,lx=CCX+lr*Math.cos(r2),ly=CCY+lr*Math.sin(r2);
    CTX.save();CTX.translate(lx,ly);CTX.rotate(r2+Math.PI/2);
    CTX.font='bold 8px "JetBrains Mono",monospace';CTX.fillStyle='rgba(74,138,224,.65)';CTX.fillText('0°/360°',0,0);CTX.restore();
  }

  // Polaris star (true north)
  const[plx,ply]=PX(CR-14,0);
  CTX.beginPath();CTX.arc(plx,ply,5,0,Math.PI*2);CTX.fillStyle='rgba(96,240,240,.65)';CTX.fill();
  CTX.font='7px "JetBrains Mono",monospace';CTX.fillStyle='rgba(96,240,240,.52)';CTX.textAlign='center';CTX.textBaseline='middle';
  const[ptx,pty]=PX(CR-53,0);CTX.fillText('بولاريس',ptx,pty);

  // Solar arc
  if(evts){
    CTX.beginPath();let first2=true;
    for(let i=0;i<=60;i++){
      const t2=i/60,hh=evts.rH+t2*(evts.sH-evts.rH);
      const d2=new Date();d2.setHours(Math.floor(hh),Math.round((hh%1)*60),0,0);
      const sp2=sunPos(d2);const rr=Math.max(38,(CR-28)*(1-Math.max(0,sp2.altApp)/90*.42));
      const[sx2,sy2]=PX(rr,sp2.az);
      if(first2){CTX.moveTo(sx2,sy2);first2=false;}else CTX.lineTo(sx2,sy2);
    }
    CTX.strokeStyle='rgba(240,200,60,.08)';CTX.lineWidth=1.5;CTX.setLineDash([4,6]);CTX.stroke();CTX.setLineDash([]);
    const[rx,ry]=PX(CR-16,evts.azR);CTX.beginPath();CTX.arc(rx,ry,6,0,Math.PI*2);CTX.fillStyle='#F07030';CTX.fill();
    const[sx3,sy3]=PX(CR-16,evts.azS);CTX.beginPath();CTX.arc(sx3,sy3,6,0,Math.PI*2);CTX.fillStyle='#8A1828';CTX.fill();
  }

  // Sun dot
  if(salt>-2){
    const[ex,ey]=PX(CR-18,saz);
    const sg=CTX.createLinearGradient(CCX,CCY,ex,ey);sg.addColorStop(0,'rgba(240,200,60,0)');sg.addColorStop(1,'rgba(240,200,60,.12)');
    CTX.beginPath();CTX.moveTo(CCX,CCY);CTX.lineTo(ex,ey);CTX.strokeStyle=sg;CTX.lineWidth=17;CTX.stroke();
    const df=Math.max(.2,1-salt/90*.44);const[sxd,syd]=PX((CR-16)*df,saz);
    const sg2=CTX.createRadialGradient(sxd,syd,2,sxd,syd,16);sg2.addColorStop(0,'rgba(255,255,200,.7)');sg2.addColorStop(.4,'rgba(240,200,60,.6)');sg2.addColorStop(1,'rgba(240,130,30,0)');
    CTX.beginPath();CTX.arc(sxd,syd,16,0,Math.PI*2);CTX.fillStyle=sg2;CTX.fill();
    CTX.beginPath();CTX.arc(sxd,syd,8,0,Math.PI*2);CTX.fillStyle='#F0D040';CTX.fill();
  }

  // Moon dot
  if(malt>-2){
    const[mex,mey]=PX(CR-18,maz);
    const mg=CTX.createLinearGradient(CCX,CCY,mex,mey);mg.addColorStop(0,'rgba(138,174,240,0)');mg.addColorStop(1,'rgba(138,174,240,.10)');
    CTX.beginPath();CTX.moveTo(CCX,CCY);CTX.lineTo(mex,mey);CTX.strokeStyle=mg;CTX.lineWidth=12;CTX.stroke();
    const mdf=Math.max(.2,1-malt/90*.44);const[mxd,myd]=PX((CR-16)*mdf,maz);
    const mg2=CTX.createRadialGradient(mxd,myd,2,mxd,myd,13);mg2.addColorStop(0,'rgba(220,235,255,.75)');mg2.addColorStop(.5,'rgba(138,174,240,.55)');mg2.addColorStop(1,'rgba(60,100,180,0)');
    CTX.beginPath();CTX.arc(mxd,myd,13,0,Math.PI*2);CTX.fillStyle=mg2;CTX.fill();
    CTX.beginPath();CTX.arc(mxd,myd,6,0,Math.PI*2);CTX.fillStyle='#8AAEF0';CTX.fill();
  }

  // Magnetic north indicator
  CTX.beginPath();CTX.arc(CCX,CCY,CR-9,(0-90)*D2R,(MDECL-90)*D2R,MDECL<0);
  CTX.strokeStyle='rgba(80,168,240,.2)';CTX.lineWidth=5;CTX.setLineDash([4,4]);CTX.stroke();CTX.setLineDash([]);
  CTX.save();CTX.translate(CCX,CCY);CTX.rotate((MDECL-90)*D2R);
  CTX.beginPath();CTX.moveTo(0,0);CTX.lineTo(CR-20,0);CTX.strokeStyle='rgba(80,168,240,.32)';CTX.lineWidth=2;CTX.setLineDash([5,4]);CTX.lineCap='round';CTX.stroke();CTX.setLineDash([]);
  CTX.beginPath();CTX.moveTo(CR-20,0);CTX.lineTo(CR-28,-5);CTX.lineTo(CR-28,5);CTX.closePath();CTX.fillStyle='rgba(80,168,240,.48)';CTX.fill();CTX.restore();

  // Qibla beam + marker
  const[qx,qy]=PX(CR-18,QT);
  const qg=CTX.createLinearGradient(CCX,CCY,qx,qy);qg.addColorStop(0,'rgba(200,164,74,0)');qg.addColorStop(1,'rgba(200,164,74,.22)');
  CTX.beginPath();CTX.moveTo(CCX,CCY);CTX.lineTo(qx,qy);CTX.strokeStyle=qg;CTX.lineWidth=13;CTX.stroke();
  const qmg=CTX.createRadialGradient(qx,qy,2,qx,qy,13);qmg.addColorStop(0,'rgba(236,207,122,.9)');qmg.addColorStop(1,'rgba(200,164,74,0)');
  CTX.beginPath();CTX.arc(qx,qy,13,0,Math.PI*2);CTX.fillStyle=qmg;CTX.fill();
  CTX.beginPath();CTX.arc(qx,qy,6,0,Math.PI*2);CTX.fillStyle='#C8A44A';CTX.fill();
  CTX.strokeStyle='rgba(255,255,255,.7)';CTX.lineWidth=1.5;CTX.stroke();

  // Qibla magnetic dot
  const[mqx,mqy]=PX(CR-16,QM);
  CTX.beginPath();CTX.arc(mqx,mqy,5,0,Math.PI*2);CTX.strokeStyle='rgba(96,208,128,.48)';CTX.lineWidth=2;CTX.stroke();

  // ── QIBLA ARROW (drawn inside rotation — points to Mecca) ──
  drawArrow();

  // ── CENTER DOT ───────────────────────────────────────
  CTX.beginPath();CTX.arc(CCX,CCY,8,0,Math.PI*2);CTX.fillStyle='#C8A44A';CTX.fill();
  CTX.strokeStyle='rgba(255,255,255,.8)';CTX.lineWidth=2;CTX.stroke();

  // ── KAABA ────────────────────────────────────────────
  const[kx,ky]=PX(CR-48,QT);
  drawKaabaIcon(kx,ky,42);

  // ── AUTHOR NAME ARC ──────────────────────────────────
  const authorName='Mohamed Sayed Gabr Behairy';
  CTX.font='bold 9px "JetBrains Mono",monospace';
  CTX.fillStyle='rgba(200,164,74,.28)';CTX.textAlign='center';CTX.textBaseline='middle';
  const nameR=CR*.685,nStart=Math.PI*.62,nTotal=Math.PI*.76,nLen=authorName.length;
  for(let i=0;i<nLen;i++){
    const ca=nStart+i*nTotal/nLen,cx2=CCX+nameR*Math.cos(ca),cy2=CCY+nameR*Math.sin(ca);
    CTX.save();CTX.translate(cx2,cy2);CTX.rotate(ca+Math.PI/2);CTX.fillText(authorName[i],0,0);CTX.restore();
  }
  CTX.font='8px "JetBrains Mono",monospace';CTX.fillStyle='rgba(200,164,74,.22)';
  CTX.textAlign='center';CTX.textBaseline='middle';CTX.fillText('© 2026',CCX,CCY+CR*.55);

  // ════════════════════════════════════════════════
  //  END ROTATING LAYER
  // ════════════════════════════════════════════════
  CTX.restore();

  // ── CELESTIAL OVERLAY (طبقة الأجرام السماوية الإضافية) ──
  // يُستدعى فقط إذا كان المحرك محمّلًا — لا يؤثر على الرسم الحالي
  if (typeof window.CelestialOverlay !== 'undefined' && window.CelestialOverlay.renderCelestialOverlay) {
    window.CelestialOverlay.renderCelestialOverlay(CTX, {
      centerX: CCX,
      centerY: CCY,
      discRadius: CR
    });
  }

  // ── FIXED: Phone direction indicator ─────────────────
  // Shows where the PHONE is pointing (red triangle at top-center)
  // This does NOT rotate — it always points UP = phone forward
  if(useDevice){
    // Quality ring around compass
    const qRingColor = compassAccuracy===null?'rgba(200,164,74,.4)':
                       compassAccuracy<=5?'rgba(64,184,112,.6)':
                       compassAccuracy<=15?'rgba(200,164,74,.5)':'rgba(192,48,64,.5)';
    CTX.beginPath();CTX.arc(CCX,CCY,CR+6,0,Math.PI*2);
    CTX.strokeStyle=qRingColor;CTX.lineWidth=3;CTX.setLineDash([8,6]);CTX.stroke();CTX.setLineDash([]);
  }
}

// ── Kaaba architectural icon ─────────────────────────────
function drawKaabaIcon(cx, cy, size){
  const s = size;
  CTX.save();CTX.translate(cx,cy);
  const glow=CTX.createRadialGradient(0,0,s*.3,0,0,s*1.6);
  glow.addColorStop(0,'rgba(200,164,74,.28)');glow.addColorStop(.5,'rgba(200,164,74,.10)');glow.addColorStop(1,'rgba(200,164,74,0)');
  CTX.beginPath();CTX.arc(0,0,s*1.6,0,Math.PI*2);CTX.fillStyle=glow;CTX.fill();
  const bodyGrad=CTX.createLinearGradient(-s*.6,-s*.65,s*.6,s*.65);
  bodyGrad.addColorStop(0,'#1A1208');bodyGrad.addColorStop(.4,'#0A0A0A');bodyGrad.addColorStop(1,'#050505');
  CTX.beginPath();CTX.rect(-s*.6,-s*.65,s*1.2,s*1.3);CTX.fillStyle=bodyGrad;CTX.fill();
  const bandY=-s*.65+s*1.3*.4,bandH=s*.22;
  const bandGrad=CTX.createLinearGradient(-s*.6,bandY,s*.6,bandY);
  bandGrad.addColorStop(0,'#8A6020');bandGrad.addColorStop(.2,'#C8A44A');bandGrad.addColorStop(.5,'#ECCF7A');bandGrad.addColorStop(.8,'#C8A44A');bandGrad.addColorStop(1,'#8A6020');
  CTX.fillStyle=bandGrad;CTX.fillRect(-s*.6,bandY,s*1.2,bandH);
  CTX.strokeStyle='rgba(10,6,2,.6)';CTX.lineWidth=.8;
  CTX.beginPath();CTX.moveTo(-s*.5,bandY+bandH*.3);CTX.lineTo(s*.5,bandY+bandH*.3);CTX.stroke();
  CTX.beginPath();CTX.moveTo(-s*.5,bandY+bandH*.7);CTX.lineTo(s*.5,bandY+bandH*.7);CTX.stroke();
  const doorX=s*.05,doorY=bandY+bandH,doorW=s*.32,doorH=s*.42;
  const doorGrad=CTX.createLinearGradient(doorX,doorY,doorX+doorW,doorY+doorH);
  doorGrad.addColorStop(0,'#7A5018');doorGrad.addColorStop(.5,'#C8A44A');doorGrad.addColorStop(1,'#8A6020');
  CTX.fillStyle=doorGrad;
  CTX.beginPath();CTX.roundRect(doorX-doorW/2,doorY,doorW,doorH,[doorW*.3,doorW*.3,0,0]);
  CTX.fill();CTX.strokeStyle='rgba(200,164,74,.7)';CTX.lineWidth=1;CTX.stroke();
  CTX.beginPath();CTX.ellipse(s*.45,s*.25,s*.14,s*.09,-0.3,0,Math.PI*2);
  CTX.fillStyle='#1A0808';CTX.fill();CTX.strokeStyle='rgba(200,164,74,.5)';CTX.lineWidth=.8;CTX.stroke();
  CTX.beginPath();CTX.ellipse(s*.44,s*.24,s*.06,s*.04,-0.3,0,Math.PI*2);
  CTX.fillStyle='rgba(80,40,20,.4)';CTX.fill();
  const roofGrad=CTX.createLinearGradient(-s*.6,-s*.65,s*.6,-s*.65);
  roofGrad.addColorStop(0,'#8A6020');roofGrad.addColorStop(.5,'#ECCF7A');roofGrad.addColorStop(1,'#8A6020');
  CTX.fillStyle=roofGrad;CTX.fillRect(-s*.6,-s*.68,s*1.2,s*.1);
  CTX.strokeStyle='rgba(200,164,74,.55)';CTX.lineWidth=1.2;CTX.strokeRect(-s*.6,-s*.65,s*1.2,s*1.3);
  [-s*.6,s*.47].forEach(px3=>{
    CTX.fillStyle='rgba(200,164,74,.15)';CTX.fillRect(px3,-s*.65,s*.13,s*1.3);
    CTX.strokeStyle='rgba(200,164,74,.35)';CTX.lineWidth=.8;CTX.strokeRect(px3,-s*.65,s*.13,s*1.3);
  });
  CTX.restore();
}
function drawArrow(){
  const pulse=1+.032*Math.sin(tick*.038),len=248*pulse,aRad=(QT-90)*D2R;
  CTX.save();CTX.translate(CCX,CCY);CTX.rotate(aRad);
  // Glow
  const gg=CTX.createLinearGradient(0,0,len,0);gg.addColorStop(0,'rgba(200,164,74,0)');gg.addColorStop(.55,'rgba(200,164,74,.14)');gg.addColorStop(1,'rgba(236,207,122,.45)');
  CTX.beginPath();CTX.moveTo(0,0);CTX.lineTo(len,0);CTX.strokeStyle=gg;CTX.lineWidth=11;CTX.lineCap='round';CTX.stroke();
  // Shaft
  const sg=CTX.createLinearGradient(0,0,len,0);sg.addColorStop(0,'#3A2008');sg.addColorStop(.38,'#C8A44A');sg.addColorStop(1,'#ECCF7A');
  CTX.beginPath();CTX.moveTo(0,0);CTX.lineTo(len-32,0);CTX.strokeStyle=sg;CTX.lineWidth=3.8;CTX.lineCap='round';CTX.stroke();
  // Notches
  CTX.strokeStyle='rgba(200,164,74,.2)';CTX.lineWidth=1;
  [40,80,120,160].forEach(xp=>{if(xp<len-38){CTX.beginPath();CTX.moveTo(xp,-3);CTX.lineTo(xp,3);CTX.stroke();}});
  // Head
  CTX.beginPath();CTX.moveTo(len,0);CTX.lineTo(len-32,-11);CTX.lineTo(len-22,0);CTX.lineTo(len-32,11);CTX.closePath();
  CTX.fillStyle='#ECCF7A';CTX.fill();CTX.strokeStyle='#6A4E1A';CTX.lineWidth=1.2;CTX.stroke();
  // Tail (N indicator)
  CTX.beginPath();CTX.moveTo(0,0);CTX.lineTo(-36,0);CTX.strokeStyle='#1E3A5A';CTX.lineWidth=3;CTX.lineCap='round';CTX.stroke();
  CTX.beginPath();CTX.moveTo(-36,0);CTX.lineTo(-28,-6);CTX.lineTo(-28,6);CTX.closePath();CTX.fillStyle='#1E3A5A';CTX.fill();
  CTX.restore();
}

