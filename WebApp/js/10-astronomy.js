// ══════════════════════════════════════════════════════════════════════════════
// [JS-10] JULIAN DATE
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  JULIAN DATE
// ════════════════════════════════════════════════
const JDF=d=>d.getTime()/86400000+2440587.5;



// ══════════════════════════════════════════════════════════════════════════════
// [JS-11] WMM2025 MAGNETIC DECLINATION
// ══════════════════════════════════════════════════════════════════════════════

// MDECL is unavailable until refreshMdeclFromTrustedGnss() accepts a trusted
// device fix. The WMM2025 runtime adapter is the sole magnetic-field producer.
let MDECL=0;
let MDECL_READY=false;
let MDECL_STATUS='unavailable';
let MDECL_FIELD=null;

function refreshMdeclFromTrustedGnss(date){
  if(!window.QiblaWMM2025Runtime)return false;
  const result=window.QiblaWMM2025Runtime.evaluateTrustedFix({
    trusted:gnssHasTrustedFix===true,
    source:gnssSource,
    latitude:LAT,
    longitude:LON,
    altitudeMeters:gnssAltitudeMeters,
    date:date||new Date()
  });
  MDECL_STATUS=result.status;
  if(!result.publish){
    MDECL_READY=false;
    MDECL_FIELD=null;
    return false;
  }
  MDECL=result.declinationDeg;
  MDECL_FIELD=result;
  MDECL_READY=true;
  return true;
}

// Dynamic Qibla. Its equation is intentionally unchanged.
// Neutral unpublished startup state. QT is calculated only after trusted GNSS.
let QT=0;
let QM=QT;
// ════════════════════════════════════════════════
function calcQibla(){
  const dL=(KLON-LON)*D2R,f1=LAT*D2R,f2=KLAT*D2R;
  const y=Math.sin(dL)*Math.cos(f2),x=Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dL);
  return((Math.atan2(y,x)*R2D)+360)%360;
}





// ══════════════════════════════════════════════════════════════════════════════
// [JS-12] SOLAR POSITION — VSOP87 (Meeus Ch.25)
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  SOLAR POSITION — Meeus Ch.25 VSOP87
// ════════════════════════════════════════════════
function sunPos(date){
  const jd=JDF(date),T=(jd-2451545)/36525;
  let L0=280.46646+36000.76983*T+3.032e-4*T*T;L0=((L0%360)+360)%360;
  let M=357.52911+35999.05029*T-1.537e-4*T*T;M=((M%360)+360)%360;
  const Mr=M*D2R;
  const C=(1.914602-4.817e-3*T-1.4e-5*T*T)*Math.sin(Mr)+(1.9993e-2-1.01e-4*T)*Math.sin(2*Mr)+2.89e-4*Math.sin(3*Mr);
  const om=125.04-1934.136*T;
  const lam=(L0+C-.00569-.00478*Math.sin(om*D2R))*D2R;
  const eps=(23+26/60+21.448/3600-(46.815/3600)*T)*D2R+(2.56e-3*Math.cos(om*D2R))*D2R;
  const ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam))*R2D;
  const dec=Math.asin(Math.sin(eps)*Math.sin(lam))*R2D;
  const e2=1.6708634e-2-4.2037e-5*T,y2=Math.tan(eps/2)**2,L0r=L0*D2R;
  const eot=4*R2D*(y2*Math.sin(2*L0r)-2*e2*Math.sin(Mr)+4*e2*y2*Math.sin(Mr)*Math.cos(2*L0r)-.5*y2*y2*Math.sin(4*L0r)-1.25*e2*e2*Math.sin(2*Mr));
  const JD0=Math.floor(jd-.5)+.5,T0=(JD0-2451545)/36525;
  let G=100.4606184+36000.77004*T0+3.88e-4*T*T;
  G+=360.98564724*(date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600)/24;
  G=((G%360)+360)%360;
  let H=(G+LON)%360-ra;if(H<-180)H+=360;if(H>180)H-=360;
  const Hr=H*D2R,f=LAT*D2R,d2=dec*D2R;
  const sA=Math.sin(f)*Math.sin(d2)+Math.cos(f)*Math.cos(d2)*Math.cos(Hr);
  const alt=Math.asin(Math.max(-1,Math.min(1,sA)))*R2D;
  const cAz=(Math.sin(d2)-Math.sin(f)*sA)/(Math.cos(f)*(Math.cos(alt*D2R)||1e-9));
  let az=Math.acos(Math.max(-1,Math.min(1,cAz)))*R2D;
  if(Math.sin(Hr)>0)az=360-az;
  let rf=0;if(alt>-.575&&alt<=85)rf=1/Math.tan((alt+10.3/(alt+5.11))*D2R);
  return{az,alt,altApp:alt+rf/60,dec,eot,sunLon:L0+C,refr:rf};
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-13] SOLAR EVENTS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  SOLAR EVENTS
// ════════════════════════════════════════════════
function solarEvts(date){
  const d0=new Date(date);d0.setUTCHours(12-UTC_OFF,0,0,0);
  const sp=sunPos(d0);
  const nH=((12-sp.eot/60-(LON-UTC_OFF*15)/15)%24+24)%24;
  const nd=new Date(date);nd.setUTCHours(Math.max(0,nH-UTC_OFF),0,0,0);
  const dec=sunPos(nd).dec;
  const f=LAT*D2R,d2=dec*D2R;
  const cH=(Math.sin(-.8333*D2R)-Math.sin(f)*Math.sin(d2))/(Math.cos(f)*Math.cos(d2));
  if(Math.abs(cH)>1)return null;
  const H0=Math.acos(cH)*R2D/15;
  const rH=((nH-H0)%24+24)%24,sH=((nH+H0)%24+24)%24;
  const azR=Math.acos(Math.max(-1,Math.min(1,Math.sin(d2)/Math.cos(f))))*R2D;
  return{rH,sH,nH,azR,azS:360-azR,dec};
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-14] LUNAR POSITION — ELP2000/82 (Meeus Ch.47)
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  LUNAR POSITION — ELP2000/82 (Meeus Ch.47)
// ════════════════════════════════════════════════
function moonPos(date){
  const jd=JDF(date),T=(jd-2451545)/36525;
  const n=x=>((x%360)+360)%360;
  const Lp=n(218.3164477+481267.88123421*T-.0015786*T*T);
  const D=n(297.8501921+445267.1114034*T-.0018819*T*T);
  const M=n(357.5291092+35999.0502909*T-.0001536*T*T);
  const Mp=n(134.9633964+477198.8675055*T+.0087414*T*T);
  const F=n(93.2720950+483202.0175233*T-.0036539*T*T);
  const Dr=D*D2R,Mr=M*D2R,Mpr=Mp*D2R,Fr=F*D2R;
  const sL=6.288774*Math.sin(Mpr)+1.274027*Math.sin(2*Dr-Mpr)+.658314*Math.sin(2*Dr)
        +.213618*Math.sin(2*Mpr)-.185116*Math.sin(Mr)-.114332*Math.sin(2*Fr)
        +.058793*Math.sin(2*Dr-2*Mpr)+.057066*Math.sin(2*Dr-Mr-Mpr)
        +.053322*Math.sin(2*Dr+Mpr)+.045758*Math.sin(2*Dr-Mr)
        -.040923*Math.sin(Mr-Mpr)-.034720*Math.sin(Dr)-.030383*Math.sin(Mr+Mpr);
  const sB=5.128122*Math.sin(Fr)+.280602*Math.sin(Mpr+Fr)+.277693*Math.sin(Mpr-Fr)
        +.173237*Math.sin(2*Dr-Fr)+.055413*Math.sin(2*Dr-Mpr+Fr)
        +.046272*Math.sin(2*Dr-Mpr-Fr)+.032573*Math.sin(2*Dr+Fr)+.017198*Math.sin(2*Mpr+Fr);
  const lam=(Lp+sL)*D2R,beta=sB*D2R;
  const eps=(23.439291-.013004167*T)*D2R;
  const ra=Math.atan2(Math.sin(lam)*Math.cos(eps)-Math.tan(beta)*Math.sin(eps),Math.cos(lam))*R2D;
  const dec=Math.asin(Math.sin(beta)*Math.cos(eps)+Math.cos(beta)*Math.sin(eps)*Math.sin(lam))*R2D;
  // GMST
  const JD0=Math.floor(jd-.5)+.5,T0=(JD0-2451545)/36525;
  let G=100.4606184+36000.77004*T0+3.88e-4*T*T;
  G+=360.98564724*(date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600)/24;
  G=((G%360)+360)%360;
  let H=(G+LON)%360-ra;if(H<-180)H+=360;if(H>180)H-=360;
  const Hr=H*D2R,f=LAT*D2R,d2=dec*D2R;
  const sA=Math.sin(f)*Math.sin(d2)+Math.cos(f)*Math.cos(d2)*Math.cos(Hr);
  const alt=Math.asin(Math.max(-1,Math.min(1,sA)))*R2D;
  const cAz=(Math.sin(d2)-Math.sin(f)*sA)/(Math.cos(f)*(Math.cos(alt*D2R)||1e-9));
  let az=Math.acos(Math.max(-1,Math.min(1,cAz)))*R2D;
  if(Math.sin(Hr)>0)az=360-az;
  let rf=0;if(alt>-.575&&alt<=85)rf=1/Math.tan((alt+10.3/(alt+5.11))*D2R);
  // Phase (using inline sun longitude)
  const sunL=sunPos(date).sunLon;
  const elong=Math.acos(Math.max(-1,Math.min(1,Math.cos(sB*D2R)*Math.cos((Lp+sL-sunL)*D2R))))*R2D;
  const illum=(1-Math.cos(elong*D2R))/2;
  return{az,alt,altApp:alt+rf/60,dec,illum,elong};
}

// Moon rise/set — fast approximation
function moonRS(evts,mp){
  const lag=mp.elong/360*24.84;
  const rH=((evts?evts.rH:6)+lag+24)%24;
  return{rH,sH:(rH+12.42)%24};
}
