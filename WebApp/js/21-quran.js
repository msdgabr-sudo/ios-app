// ══════════════════════════════════════════════════════════════════════════════
// [JS-31] DYNAMIC BACKGROUND SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  DYNAMIC BACKGROUND SYSTEM
//  Each tab gets its own atmospheric background
//  rendered on a fixed canvas behind everything
// ════════════════════════════════════════════════
const bgCvs={width:390,height:844};



const bgCtx={clearRect:()=>{},fillRect:()=>{},beginPath:()=>{},arc:()=>{},fill:()=>{},stroke:()=>{},save:()=>{},restore:()=>{},translate:()=>{},rotate:()=>{},createRadialGradient:()=>({addColorStop:()=>{}}),createLinearGradient:()=>({addColorStop:()=>{}}),setLineDash:()=>{},closePath:()=>{},moveTo:()=>{},lineTo:()=>{},fillText:()=>{},strokeText:()=>{},ellipse:()=>{},scale:()=>{},clip:()=>{},quadraticCurveTo:()=>{},bezierCurveTo:()=>{},drawImage:()=>{}};
let bgTick = 0;
let currentTab = 'compass';
let stars = Array.from({length:120},()=>({
  x: Math.random(), y: Math.random(),
  r: Math.random()*1.5+0.3,
  blink: Math.random()*Math.PI*2,
  speed: Math.random()*.02+.005
}));
let shootingStars = [];
let cloudOffset = 0;

function resizeBg(){
  bgCvs.width  = window.innerWidth;
  bgCvs.height = window.innerHeight;
}

resizeBg();

// Override GT to track current tab
const _GT = GT;
window.GT = function(id){
  currentTab = id;
  _GT(id);
  // update body class for CSS theming
  document.body.className = 'tab-'+id;
};

function drawBackground(now, sp, mp){
  const W = bgCvs.width, H = bgCvs.height;
  bgCtx.clearRect(0,0,W,H);
  bgTick++;
  cloudOffset = (cloudOffset + 0.2) % W;

  const lh = now.getHours() + now.getMinutes()/60;
  const nightness = sp ? Math.max(0, Math.min(1, (-sp.altApp + 10) / 20)) : 1;
  const sunsetness = sp ? Math.max(0, Math.min(1, 1 - Math.abs(sp.altApp) / 15)) * (1-nightness) : 0;

  switch(currentTab){

    case 'compass': {
      // ═══════════════════════════════════════════════
      //  DYNAMIC SKY — Physically accurate colors
      //  Based on actual sun altitude (sp.altApp)
      //  Night → Dusk/Dawn → Golden hour → Day Blue
      // ═══════════════════════════════════════════════
      const alt = sp ? sp.altApp : 30;
      const lhNow = now.getHours() + now.getMinutes()/60;

      if(alt < -6){
        // ── Deep night ───────────────────────────────
        const g = bgCtx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'#010210');
        g.addColorStop(0.5,'#020416');
        g.addColorStop(1,'#050812');
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        // Milky Way subtle band
        const mw=bgCtx.createLinearGradient(W*.1,H*.1,W*.9,H*.6);
        mw.addColorStop(0,'rgba(80,100,180,.04)');
        mw.addColorStop(.5,'rgba(120,140,220,.07)');
        mw.addColorStop(1,'rgba(60,80,160,.03)');
        bgCtx.fillStyle=mw; bgCtx.fillRect(0,0,W,H);
        drawStars(W,H,1.0,now);
        if(mp&&mp.altApp>0){drawMoonInSky(W*.75,H*.16,mp.illum,mp.elong);}
        // Moon glow
        if(mp&&mp.altApp>5){
          const mg=bgCtx.createRadialGradient(W*.75,H*.16,10,W*.75,H*.16,160);
          mg.addColorStop(0,`rgba(180,210,255,${mp.illum*.18})`);
          mg.addColorStop(1,'rgba(180,210,255,0)');
          bgCtx.fillStyle=mg; bgCtx.fillRect(0,0,W,H);
        }
      }
      else if(alt < -0.8){
        // ── Civil twilight / Dusk / Dawn ─────────────
        const t = (alt+6)/5.2; // 0=night, 1=horizon
        const isMorn = lhNow < 13;
        const g = bgCtx.createLinearGradient(0,0,0,H);
        if(isMorn){
          // Pre-dawn → cool purples fading to orange
          g.addColorStop(0,`hsl(240,${40+t*10}%,${5+t*8}%)`);
          g.addColorStop(0.4,`hsl(260,${35+t*15}%,${8+t*12}%)`);
          g.addColorStop(0.7,`hsl(${20+t*10},${50+t*20}%,${10+t*15}%)`);
          g.addColorStop(1,`hsl(30,${60+t*10}%,${14+t*10}%)`);
        } else {
          // Post-sunset → warm magenta to deep violet
          g.addColorStop(0,`hsl(250,${45+t*10}%,${6+t*6}%)`);
          g.addColorStop(0.35,`hsl(${280-t*30},${40+t*20}%,${10+t*10}%)`);
          g.addColorStop(0.65,`hsl(${20+t*5},${55+t*15}%,${12+t*14}%)`);
          g.addColorStop(1,`hsl(30,${55+t*5}%,${16+t*8}%)`);
        }
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        // Horizon glow
        const hg=bgCtx.createRadialGradient(W*.5,H,30,W*.5,H,H*.7);
        hg.addColorStop(0,`rgba(255,150,60,${t*.18})`);
        hg.addColorStop(0.4,`rgba(220,80,40,${t*.10})`);
        hg.addColorStop(1,'rgba(200,60,30,0)');
        bgCtx.fillStyle=hg; bgCtx.fillRect(0,0,W,H);
        drawStars(W,H,1.0-t*.8,now);
        if(mp&&mp.altApp>0){drawMoonInSky(W*.75,H*.15,mp.illum,mp.elong);}
      }
      else if(alt < 6){
        // ── Sunrise / Sunset golden hour ─────────────
        const t = alt/6; // 0=horizon, 1=golden
        const isMorn = lhNow < 13;
        const g = bgCtx.createLinearGradient(0,0,0,H);
        if(isMorn){
          g.addColorStop(0,`hsl(220,${50+t*10}%,${15+t*20}%)`);
          g.addColorStop(0.3,`hsl(30,${60+t*10}%,${20+t*15}%)`);
          g.addColorStop(0.6,`hsl(25,${70+t*5}%,${28+t*12}%)`);
          g.addColorStop(1,`hsl(40,${60}%,${35+t*10}%)`);
        } else {
          // SUNSET — deep oranges and magentas
          g.addColorStop(0,`hsl(230,${45+t*10}%,${12+t*15}%)`);
          g.addColorStop(0.25,`hsl(300,${40+t*15}%,${18+t*8}%)`);
          g.addColorStop(0.55,`hsl(${15+t*5},${75-t*5}%,${25+t*8}%)`);
          g.addColorStop(0.8,`hsl(35,${80}%,${35+t*5}%)`);
          g.addColorStop(1,`hsl(45,${70}%,${45}%)`);
        }
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        // Sun disc near horizon
        const sunY=H*(0.82-t*.3);
        const sg=bgCtx.createRadialGradient(W*.5,sunY,6,W*.5,sunY,W*.55);
        sg.addColorStop(0,'rgba(255,230,100,.55)');
        sg.addColorStop(0.08,'rgba(255,180,50,.35)');
        sg.addColorStop(0.25,'rgba(255,100,30,.15)');
        sg.addColorStop(0.5,'rgba(220,60,20,.06)');
        sg.addColorStop(1,'rgba(200,40,10,0)');
        bgCtx.fillStyle=sg; bgCtx.fillRect(0,0,W,H);
        // Light clouds tinted orange/pink
        drawClouds(W,H,0.07);
        // Cloud tint overlay
        const ct=bgCtx.createLinearGradient(0,H*.4,0,H);
        ct.addColorStop(0,'rgba(255,140,60,.04)');
        ct.addColorStop(1,'rgba(255,100,40,.10)');
        bgCtx.fillStyle=ct; bgCtx.fillRect(0,0,W,H);
      }
      else if(alt < 20){
        // ── Morning/Evening blue with warm tones ─────
        const t=(alt-6)/14;
        const g=bgCtx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,`hsl(${215-t*5},${55+t*20}%,${22+t*20}%)`);
        g.addColorStop(0.5,`hsl(${205-t*5},${50+t*18}%,${30+t*18}%)`);
        g.addColorStop(1,`hsl(${200},${45+t*10}%,${38+t*10}%)`);
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        drawClouds(W,H,0.055);
        const sg2=bgCtx.createRadialGradient(W*.4,H*.1,5,W*.4,H*.1,W*.4);
        sg2.addColorStop(0,'rgba(255,240,180,.10)');
        sg2.addColorStop(1,'rgba(255,220,120,0)');
        bgCtx.fillStyle=sg2; bgCtx.fillRect(0,0,W,H);
      }
      else {
        // ── Midday — vivid clear blue sky ────────────
        const t=Math.min(1,(alt-20)/50);
        const g=bgCtx.createLinearGradient(0,0,0,H);
        // Deep cerulean at zenith → lighter at horizon
        g.addColorStop(0,`hsl(${218-t*8},${70+t*15}%,${30+t*18}%)`);
        g.addColorStop(0.4,`hsl(${210-t*5},${65+t*12}%,${42+t*15}%)`);
        g.addColorStop(0.75,`hsl(${205},${60+t*10}%,${52+t*10}%)`);
        g.addColorStop(1,`hsl(${200},${55}%,${62+t*5}%)`);
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        // White cumulus clouds
        drawClouds(W,H,0.08);
        // Sun glare at midday
        if(t>0.4){
          const sg3=bgCtx.createRadialGradient(W*.45,H*.08,4,W*.45,H*.08,W*.35);
          sg3.addColorStop(0,'rgba(255,255,220,.18)');
          sg3.addColorStop(0.15,'rgba(255,248,200,.08)');
          sg3.addColorStop(1,'rgba(255,240,180,0)');
          bgCtx.fillStyle=sg3; bgCtx.fillRect(0,0,W,H);
        }
      }
      break;
    }

    case 'night': {
      // ── Deep night — rich star field ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#010310'); g.addColorStop(.5,'#020618'); g.addColorStop(1,'#040810');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      // Nebula clouds
      drawNebula(W,H);
      // Dense stars
      drawStars(W,H,1.0,now);
      // Shooting star occasionally
      if(Math.random()<.003) shootingStars.push({x:Math.random()*W,y:0,vx:(Math.random()-.5)*3,vy:Math.random()*4+2,life:1});
      shootingStars = shootingStars.filter(s=>{
        s.x+=s.vx; s.y+=s.vy; s.life-=.025;
        if(s.life>0 && s.y<H){
          bgCtx.beginPath();
          bgCtx.moveTo(s.x,s.y);
          bgCtx.lineTo(s.x-s.vx*6,s.y-s.vy*6);
          const sg=bgCtx.createLinearGradient(s.x,s.y,s.x-s.vx*6,s.y-s.vy*6);
          sg.addColorStop(0,`rgba(255,255,255,${s.life})`);
          sg.addColorStop(1,'rgba(255,255,255,0)');
          bgCtx.strokeStyle=sg; bgCtx.lineWidth=1.5; bgCtx.stroke();
          return true;
        }
        return false;
      });
      // Moon if visible
      if(mp && mp.altApp > 0) drawMoonInSky(W,H*.15,mp.illum,mp.elong);
      break;
    }

    case 'cal': {
      // ── Golden sunrise/day calibration ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      const alt2 = sp ? Math.max(-5,Math.min(90,sp.altApp)) : 45;
      if(alt2 < 0){
        // Night calibration — moonlit
        g.addColorStop(0,'#030510'); g.addColorStop(1,'#080C18');
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        drawStars(W,H,.8,now);
        if(mp && mp.altApp>0) drawMoonInSky(W,H*.12,mp.illum,mp.elong);
      } else {
        // Day — warm golden tones
        const warmth = Math.max(0,Math.min(1,1-alt2/90));
        g.addColorStop(0,`hsl(220,${40+warmth*20}%,${10+alt2*.15}%)`);
        g.addColorStop(.5,`hsl(${30+alt2},${50+warmth*30}%,${15+alt2*.18}%)`);
        g.addColorStop(1,`hsl(${20+alt2*0.3},${60}%,${18+alt2*.2}%)`);
        bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
        drawClouds(W,H,0.05);
        // Sun disc
        if(sp && sp.altApp>0){
          const sunY = H*(0.05 + 0.45*(1-alt2/90));
          const sunX = W*(0.25 + .5*Math.sin((lh-12)*.15));
          drawSunInSky(sunX,sunY,alt2);
        }
      }
      break;
    }

    case 'prayer': {
      // ── Spiritual — green/teal mosque atmosphere ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#020810'); g.addColorStop(.4,'#041418'); g.addColorStop(1,'#061010');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      // Green aurora effect
      for(let i=0;i<3;i++){
        const ax=W*(0.2+i*.3), ay=H*.3;
        const ag=bgCtx.createRadialGradient(ax,ay,20,ax,ay,180);
        ag.addColorStop(0,`rgba(0,${80+i*30},${60+i*20},.04)`);
        ag.addColorStop(1,'rgba(0,80,60,0)');
        bgCtx.fillStyle=ag; bgCtx.fillRect(0,0,W,H);
      }
      // Stars
      drawStars(W,H,.6,now);
      // Moon crescent
      if(mp) drawMoonInSky(W*.8,H*.12,mp.illum,mp.elong);
      // Silhouette city/mosque horizon
      drawMosqueSilhouette(W,H);
      break;
    }

    case 'gnss': {
      // ── Space / satellite view ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#000005'); g.addColorStop(.5,'#000210'); g.addColorStop(1,'#000108');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      drawStars(W,H,1.0,now);
      // Satellite orbits
      drawOrbitLines(W,H);
      // Earth glow at bottom
      const eg=bgCtx.createRadialGradient(W*.5,H+20,10,W*.5,H+20,H*.8);
      eg.addColorStop(0,'rgba(20,80,200,.08)');
      eg.addColorStop(1,'rgba(20,80,200,0)');
      bgCtx.fillStyle=eg; bgCtx.fillRect(0,0,W,H);
      break;
    }

    case 'map': {
      // ── Earth view from above ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#020408'); g.addColorStop(1,'#040810');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      drawStars(W,H,.4,now);
      break;
    }

    case 'settings': {
      // ── Geometric Islamic pattern background ──
      const g = bgCtx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#040810'); g.addColorStop(1,'#06080A');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      drawIslamicPattern(W,H);
      break;
    }

    case 'help': {
      // ── Parchment / book atmosphere ──
      const g = bgCtx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#050610'); g.addColorStop(1,'#040508');
      bgCtx.fillStyle=g; bgCtx.fillRect(0,0,W,H);
      drawStars(W,H,.25,now);
      break;
    }
  }
}

// ── Background helper functions ─────────────────────────────

function drawStars(W,H,opacity,now){
  const t = now.getTime()/1000;
  stars.forEach(s=>{
    const blink = 0.6 + 0.4*Math.sin(s.blink + t*s.speed);
    const a = opacity * blink * Math.min(1, s.r/0.8);
    bgCtx.beginPath();
    bgCtx.arc(s.x*W, s.y*H*0.7, s.r, 0, Math.PI*2);
    bgCtx.fillStyle = `rgba(255,255,255,${a*.8})`;
    bgCtx.fill();
  });
}

function drawNebula(W,H){
  const nebs=[
    {x:.2,y:.3,rx:W*.4,ry:H*.2,c:'rgba(40,20,100,.06)'},
    {x:.7,y:.2,rx:W*.3,ry:H*.15,c:'rgba(20,40,120,.05)'},
    {x:.5,y:.5,rx:W*.35,ry:H*.25,c:'rgba(60,20,80,.04)'},
  ];
  nebs.forEach(n=>{
    const g=bgCtx.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,Math.max(n.rx,n.ry));
    g.addColorStop(0,n.c); g.addColorStop(1,'rgba(0,0,0,0)');
    bgCtx.beginPath();
    bgCtx.ellipse(n.x*W,n.y*H,n.rx,n.ry,0,0,Math.PI*2);
    bgCtx.fillStyle=g; bgCtx.fill();
  });
}

function drawClouds(W,H,opacity){
  const t = Date.now()/1000;
  const clouds=[{x:0.1,y:0.15,s:1.2},{x:0.4,y:0.08,s:.9},{x:0.7,y:.18,s:1.1},{x:.9,y:.1,s:.8}];
  clouds.forEach((cl,i)=>{
    const cx=((cl.x*W + cloudOffset*(.3+i*.1)) % (W+200)) - 100;
    const cy=cl.y*H;
    const g=bgCtx.createRadialGradient(cx,cy,5,cx,cy,80*cl.s);
    g.addColorStop(0,`rgba(255,255,255,${opacity})`);
    g.addColorStop(1,'rgba(255,255,255,0)');
    bgCtx.fillStyle=g; bgCtx.fillRect(cx-80,cy-40,160,80);
  });
}

function drawSunInSky(x,y,alt){
  const r=Math.max(14,24-alt*.1);
  const g=bgCtx.createRadialGradient(x,y,r*.3,x,y,r*6);
  g.addColorStop(0,'rgba(255,250,200,.18)');
  g.addColorStop(.5,'rgba(255,200,80,.08)');
  g.addColorStop(1,'rgba(255,150,40,0)');
  bgCtx.fillStyle=g; bgCtx.fillRect(x-r*6,y-r*6,r*12,r*12);
  bgCtx.beginPath(); bgCtx.arc(x,y,r,0,Math.PI*2);
  bgCtx.fillStyle='rgba(255,240,180,.22)'; bgCtx.fill();
}

function drawMoonInSky(x,y,illum,elong){
  const r=18;
  bgCtx.beginPath(); bgCtx.arc(x,y,r,0,Math.PI*2);
  bgCtx.fillStyle='rgba(180,200,240,.12)'; bgCtx.fill();
  const mg=bgCtx.createRadialGradient(x,y,r,x,y,r*5);
  mg.addColorStop(0,`rgba(200,220,255,${.12*illum})`);
  mg.addColorStop(1,'rgba(200,220,255,0)');
  bgCtx.fillStyle=mg; bgCtx.fillRect(x-r*5,y-r*5,r*10,r*10);
}

function drawMosqueSilhouette(W,H){
  bgCtx.fillStyle='rgba(0,30,20,.35)';
  // Ground
  bgCtx.fillRect(0,H*.82,W,H*.18);
  // Dome
  const cx=W*.5, cy=H*.82;
  bgCtx.beginPath();
  bgCtx.arc(cx,cy,W*.08,Math.PI,0);
  bgCtx.fill();
  // Two minarets
  [-0.18,0.18].forEach(off=>{
    const mx=cx+off*W;
    bgCtx.fillRect(mx-W*.012,cy-H*.12,W*.024,H*.12);
    bgCtx.beginPath(); bgCtx.moveTo(mx,cy-H*.16); bgCtx.lineTo(mx-W*.012,cy-H*.12); bgCtx.lineTo(mx+W*.012,cy-H*.12); bgCtx.fill();
  });
}

function drawOrbitLines(W,H){
  const cx=W*.5, cy=H*.5+50;
  const t = Date.now()/1000;
  [[W*.42,H*.22,0],[W*.34,H*.3,1],[W*.5,H*.26,2],[W*.3,H*.22,3]].forEach(([rx,ry,idx])=>{
    bgCtx.beginPath();
    bgCtx.ellipse(cx,cy+20,rx,ry,idx*.4,0,Math.PI*2);
    bgCtx.strokeStyle='rgba(80,180,255,.07)'; bgCtx.lineWidth=1; bgCtx.stroke();
    // Satellite dot
    const angle = t*(0.3+idx*.1) + idx*1.5;
    const sx=cx+rx*Math.cos(angle), sy=cy+20+ry*Math.sin(angle);
    bgCtx.beginPath(); bgCtx.arc(sx,sy,2.5,0,Math.PI*2);
    bgCtx.fillStyle='rgba(128,220,255,.55)'; bgCtx.fill();
  });
}

function drawIslamicPattern(W,H){
  const size=60, alpha=0.025;
  bgCtx.strokeStyle=`rgba(200,164,74,${alpha})`;
  bgCtx.lineWidth=.8;
  for(let x=-size;x<W+size;x+=size){
    for(let y=-size;y<H+size;y+=size){
      bgCtx.beginPath();
      bgCtx.moveTo(x+size/2,y);
      for(let i=0;i<=8;i++){
        const a=i*Math.PI/4;
        bgCtx.lineTo(x+size/2+size*.45*Math.cos(a), y+size/2+size*.45*Math.sin(a));
        if(i<8) bgCtx.lineTo(x+size/2+size*.22*Math.cos(a+Math.PI/8), y+size/2+size*.22*Math.sin(a+Math.PI/8));
      }
      bgCtx.closePath(); bgCtx.stroke();
    }
  }
}

// ════════════════════════════════════════════════
//  WINTER SKY — Global background
//  Animated: stars, drifting clouds, snowflakes,
//  aurora borealis effect, crescent moon
// ════════════════════════════════════════════════

// [Winter sky replaced by CSS]


