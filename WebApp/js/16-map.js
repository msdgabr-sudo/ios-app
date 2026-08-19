// ══════════════════════════════════════════════════════════════════════════════
// [JS-25] MAP CANVAS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  MAP CANVAS — Qibla ray from Giza to Mecca
// ════════════════════════════════════════════════
function drawMap(){
  const c=gel('mapCvs');if(!c)return;
  const x=c.getContext('2d'),W=360,H=260;
  x.clearRect(0,0,W,H);
  x.fillStyle='#040810';x.fillRect(0,0,W,H);

  // Grid lines (lat/lon)
  x.strokeStyle='rgba(26,44,68,.35)';x.lineWidth=.6;
  for(let i=0;i<W;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}
  for(let i=0;i<H;i+=26){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke();}

  // Map bounds: lon 28-44E, lat 18-35N — covers Giza→Mecca
  const lnMin=28,lnMax=44,ltMin=18,ltMax=35;
  function proj(lat,lon){
    return[(lon-lnMin)/(lnMax-lnMin)*W, H-(lat-ltMin)/(ltMax-ltMin)*H];
  }

  // Red Sea rough outline (simplified polygon)
  const redSea=[[28.5,32],[29,33],[30,33.5],[31,34],[31.5,35],[32,36],[32.5,37],[33,38.5],[33,40],[32,41],[31,42],[30,42.5],[29,43],[28,43],[27,42],[27.5,41],[28,40],[28,39],[27.5,38],[27,37],[27.5,36],[28,35],[28,34],[28,32]];
  x.beginPath();
  redSea.forEach(([la,lo],i)=>{const[px,py]=proj(la,lo);i?x.lineTo(px,py):x.moveTo(px,py);});
  x.closePath();x.fillStyle='rgba(30,60,100,.4)';x.fill();
  x.strokeStyle='rgba(40,80,140,.3)';x.lineWidth=1;x.stroke();

  // Saudi Arabia rough border
  x.strokeStyle='rgba(80,60,20,.3)';x.lineWidth=.8;

  // Giza position
  const[gx,gy]=proj(30.03,30.96);
  // Mecca position
  const[mx,my]=proj(21.42,39.83);

  // Great circle arc (bezier approximation)
  const cpLat=(30.03+21.42)/2+3,cpLon=(30.96+39.83)/2;
  const[cpx,cpy]=proj(cpLat,cpLon);
  const grad=x.createLinearGradient(gx,gy,mx,my);
  grad.addColorStop(0,'rgba(200,164,74,.9)');
  grad.addColorStop(.5,'rgba(236,207,122,.7)');
  grad.addColorStop(1,'rgba(200,164,74,.4)');
  x.beginPath();x.moveTo(gx,gy);
  x.quadraticCurveTo(cpx,cpy,mx,my);
  x.strokeStyle=grad;x.lineWidth=2.5;x.setLineDash([6,4]);x.stroke();x.setLineDash([]);

  // Giza dot
  const gg=x.createRadialGradient(gx,gy,2,gx,gy,10);
  gg.addColorStop(0,'rgba(200,164,74,.9)');gg.addColorStop(1,'rgba(200,164,74,0)');
  x.beginPath();x.arc(gx,gy,10,0,Math.PI*2);x.fillStyle=gg;x.fill();
  x.beginPath();x.arc(gx,gy,5,0,Math.PI*2);x.fillStyle='#C8A44A';x.fill();
  x.font='bold 9px "JetBrains Mono",monospace';x.fillStyle='rgba(200,164,74,.85)';x.textAlign='right';x.textBaseline='middle';
  x.fillText('الجيزة',gx-8,gy);

  // Mecca dot
  const mg=x.createRadialGradient(mx,my,2,mx,my,12);
  mg.addColorStop(0,'rgba(64,184,112,.9)');mg.addColorStop(1,'rgba(64,184,112,0)');
  x.beginPath();x.arc(mx,my,12,0,Math.PI*2);x.fillStyle=mg;x.fill();
  x.beginPath();x.arc(mx,my,5,0,Math.PI*2);x.fillStyle='#40B870';x.fill();
  x.font='11px serif';x.textAlign='center';x.textBaseline='bottom';
  x.fillText('🕋',mx,my-6);
  x.font='bold 9px "JetBrains Mono",monospace';x.fillStyle='rgba(64,184,112,.85)';x.textAlign='left';x.textBaseline='middle';
  x.fillText('مكة',mx+8,my);

  // Bearing arrow at Giza
  const bearRad=(QT-90)*D2R;
  const arLen=28;
  const ax=gx+arLen*Math.cos(bearRad),ay=gy+arLen*Math.sin(bearRad);
  x.beginPath();x.moveTo(gx,gy);x.lineTo(ax,ay);x.strokeStyle='rgba(200,164,74,.6)';x.lineWidth=2;x.stroke();

  // Labels
  x.font='8px "JetBrains Mono",monospace';x.fillStyle='rgba(90,112,144,.6)';
  x.textAlign='left';x.textBaseline='top';x.fillText('المملكة العربية السعودية',proj(26,35.5)[0],proj(26,35.5)[1]);
  x.fillText('مصر',proj(27,29)[0],proj(27,29)[1]);

  // Scale
  x.fillStyle='rgba(60,90,130,.6)';x.textAlign='right';x.textBaseline='bottom';
  x.fillText('المسافة: 1,296 كم',W-4,H-4);
}

