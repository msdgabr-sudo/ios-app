(function(g){'use strict';
// WMM2025 isolated engine. NOT connected to compass/astronomical verification runtime.
// Coefficients: NOAA/NCEI WMM2025.COF, epoch 2025.0, valid through 2029-12-31.
const COF=`1 0 -29351.8 0 12 0
1 1 -1410.8 4545.4 9.7 -21.5
2 0 -2556.6 0 -11.6 0
2 1 2951.1 -3133.6 -5.2 -27.7
2 2 1649.3 -815.1 -8 -12.1
3 0 1361 0 -1.3 0
3 1 -2404.1 -56.6 -4.2 4
3 2 1243.8 237.5 .4 -.3
3 3 453.6 -549.5 -15.6 -4.1
4 0 895 0 -1.6 0
4 1 799.5 278.6 -2.4 -1.1
4 2 55.7 -133.9 -6 4.1
4 3 -281.1 212 5.6 1.6
4 4 12.1 -375.6 -7 -4.4
5 0 -233.2 0 .6 0
5 1 368.9 45.4 1.4 -.5
5 2 187.2 220.2 0 2.2
5 3 -138.7 -122.9 .6 .4
5 4 -142 43 2.2 1.7
5 5 20.9 106.1 .9 1.9
6 0 64.4 0 -.2 0
6 1 63.8 -18.4 -.4 .3
6 2 76.9 16.8 .9 -1.6
6 3 -115.7 48.8 1.2 -.4
6 4 -40.9 -59.8 -.9 .9
6 5 14.9 10.9 .3 .7
6 6 -60.7 72.7 .9 .9
7 0 79.5 0 0 0
7 1 -77 -48.9 -.1 .6
7 2 -8.8 -14.4 -.1 .5
7 3 59.3 -1 .5 -.8
7 4 15.8 23.4 -.1 0
7 5 2.5 -7.4 -.8 -1
7 6 -11.1 -25.1 -.8 .6
7 7 14.2 -2.3 .8 -.2
8 0 23.2 0 -.1 0
8 1 10.8 7.1 .2 -.2
8 2 -17.5 -12.6 0 .5
8 3 2 11.4 .5 -.4
8 4 -21.7 -9.7 -.1 .4
8 5 16.9 12.7 .3 -.5
8 6 15 .7 .2 -.6
8 7 -16.8 -5.2 0 .3
8 8 .9 3.9 .2 .2
9 0 4.6 0 0 0
9 1 7.8 -24.8 -.1 -.3
9 2 3 12.2 .1 .3
9 3 -.2 8.3 .3 -.3
9 4 -2.5 -3.3 -.3 .3
9 5 -13.1 -5.2 0 .2
9 6 2.4 7.2 .3 -.1
9 7 8.6 -.6 -.1 -.2
9 8 -8.7 .8 .1 .4
9 9 -12.9 10 -.1 .1
10 0 -1.3 0 .1 0
10 1 -6.4 3.3 0 0
10 2 .2 0 .1 0
10 3 2 2.4 .1 -.2
10 4 -1 5.3 0 .1
10 5 -.6 -9.1 -.3 -.1
10 6 -.9 .4 0 .1
10 7 1.5 -4.2 -.1 0
10 8 .9 -3.8 -.1 -.1
10 9 -2.7 .9 0 .2
10 10 -3.9 -9.1 0 0
11 0 2.9 0 0 0
11 1 -1.5 0 0 0
11 2 -2.5 2.9 0 .1
11 3 2.4 -.6 0 0
11 4 -.6 .2 0 .1
11 5 -.1 .5 -.1 0
11 6 -.6 -.3 0 0
11 7 -.1 -1.2 0 .1
11 8 1.1 -1.7 -.1 0
11 9 -1 -2.9 -.1 0
11 10 -.2 -1.8 -.1 0
11 11 2.6 -2.3 -.1 0
12 0 -2 0 0 0
12 1 -.2 -1.3 0 0
12 2 .3 .7 0 0
12 3 1.2 1 0 -.1
12 4 -1.3 -1.4 0 .1
12 5 .6 0 0 0
12 6 .6 .6 .1 0
12 7 .5 -.1 0 0
12 8 -.1 .8 0 0
12 9 -.4 .1 0 0
12 10 -.2 -1 -.1 0
12 11 -1.3 .1 0 0
12 12 -.7 .2 -.1 -.1`;
const C=COF.trim().split(/\n/).map(x=>x.trim().split(/\s+/).map(Number));
const D=Math.PI/180,R=180/Math.PI,A=6378.137,F=1/298.257223563,E2=F*(2-F),AR=6371.2,N=12;
function decimalYear(d){d=d||new Date();let y=d.getUTCFullYear(),a=Date.UTC(y,0,1),b=Date.UTC(y+1,0,1);return y+(d.getTime()-a)/(b-a)}
function leg(theta){let ct=Math.cos(theta),st=Math.sin(theta),p=Array.from({length:13},()=>Array(13).fill(0)),dp=Array.from({length:13},()=>Array(13).fill(0));p[0][0]=1;p[1][0]=ct;dp[1][0]=-st;p[1][1]=st;dp[1][1]=ct;for(let n=2;n<=N;n++){let q=Math.sqrt((2*n-1)/(2*n));p[n][n]=st*p[n-1][n-1]*q;dp[n][n]=(ct*p[n-1][n-1]+st*dp[n-1][n-1])*q;q=Math.sqrt(2*n-1);p[n][n-1]=ct*p[n-1][n-1]*q;dp[n][n-1]=(ct*dp[n-1][n-1]-st*p[n-1][n-1])*q;for(let m=0;m<=n-2;m++){let num=2*n-1,den=Math.sqrt(n*n-m*m),prev=Math.sqrt((n-1)*(n-1)-m*m);p[n][m]=(num*ct*p[n-1][m]-prev*p[n-2][m])/den;dp[n][m]=(num*(ct*dp[n-1][m]-st*p[n-1][m])-prev*dp[n-2][m])/den}}return{p,dp}}
function field(lat,lon,opt){opt=opt||{};let alt=opt.altitudeKm==null?0:+opt.altitudeKm,yr=opt.decimalYear==null?decimalYear(opt.date):+opt.decimalYear;if(!isFinite(lat)||!isFinite(lon)||lat < -90||lat>90||lon < -180||lon>360)throw Error('invalid coordinates');if(!isFinite(alt)||alt < -1||alt>850)throw Error('WMM2025 altitude outside [-1,850] km');if(!isFinite(yr)||yr<2025||yr>=2030)throw Error('WMM2025 date outside [2025,2030)');lon=((lon+180)%360+360)%360-180;let lr=lat*D,pr=lon*D,s=Math.sin(lr),c=Math.cos(lr),rn=A/Math.sqrt(1-E2*s*s),x=(rn+alt)*c*Math.cos(pr),y=(rn+alt)*c*Math.sin(pr),z=(rn*(1-E2)+alt)*s,r=Math.hypot(x,y,z),gl=Math.asin(z/r),diff=lr-gl,theta=Math.PI/2-gl;if(theta<1e-10)theta=1e-10;if(theta>Math.PI-1e-10)theta=Math.PI-1e-10;let L=leg(theta),dt=yr-2025,br=0,bt=0,bp=0,st=Math.sin(theta);for(const [n,m,g0,h0,dg,dh] of C){let gg=g0+dg*dt,hh=h0+dh*dt,sc=Math.pow(AR/r,n+2),co=Math.cos(m*pr),si=Math.sin(m*pr),ghc=gg*co+hh*si,ghs=-gg*si+hh*co,p=L.p[n][m],dp=L.dp[n][m];br+=(n+1)*sc*ghc*p;bt-=sc*ghc*dp;bp-=sc*m*ghs*p/st}let sd=Math.sin(diff),cd=Math.cos(diff),X=-bt*cd-br*sd,Y=bp,Z=bt*sd-br*cd,H=Math.hypot(X,Y),T=Math.hypot(H,Z);return{declinationDeg:Math.atan2(Y,X)*R,inclinationDeg:Math.atan2(Z,H)*R,northNt:X,eastNt:Y,downNt:Z,horizontalNt:H,totalNt:T,decimalYear:yr,status:H<2000?'blackout':H<6000?'caution':'normal'}}
function tests(){let t=[[80,0,0,2025,1.28],[0,120,0,2025,-.16],[-80,240,0,2025,68.78],[80,0,0,2027.5,2.59],[0,120,0,2027.5,-.24],[-80,240,0,2027.5,68.49]];return t.map(a=>{let v=field(a[0],a[1],{altitudeKm:a[2],decimalYear:a[3]}).declinationDeg,e=Math.abs(v-a[4]);return{lat:a[0],lon:a[1],year:a[3],expected:a[4],actual:v,error:e,pass:e<=.02}})}
const api=Object.freeze({model:'WMM2025',epoch:2025,validTo:2030,degree:12,order:12,runtimeIntegrated:false,field,declination:(lat,lon,opt)=>field(lat,lon,opt).declinationDeg,decimalYear,selfTest:tests,coefficientRows:Object.freeze(C.map(row=>Object.freeze(row.slice())))});g.QiblaWMM2025=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
