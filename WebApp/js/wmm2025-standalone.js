/* QiblaAstro — isolated WMM2025 engine.
 * NOT wired to compass, astronomical verification, camera, GNSS runtime, or MDECL.
 * Coefficients: WMM-2025 epoch 2025.0, degree/order 12.
 * Validation targets are NOAA/NCEI WMM2025 published test values.
 */
(function(root){'use strict';
const EPOCH=2025.0,NMAX=12,A=6378.137,B=6356.7523142,RE=6371.2;
const EPS2=1-(B*B)/(A*A);
const C=`1 0 -29351.8 0.0 12.0 0.0
1 1 -1410.8 4545.4 9.7 -21.5
2 0 -2556.6 0.0 -11.6 0.0
2 1 2951.1 -3133.6 -5.2 -27.7
2 2 1649.3 -815.1 -8.0 -12.1
3 0 1361.0 0.0 -1.3 0.0
3 1 -2404.1 -56.6 -4.2 4.0
3 2 1243.8 237.5 0.4 -0.3
3 3 453.6 -549.5 -15.6 -4.1
4 0 895.0 0.0 -1.6 0.0
4 1 799.5 278.6 -2.4 -1.1
4 2 55.7 -133.9 -6.0 4.1
4 3 -281.1 212.0 5.6 1.6
4 4 12.1 -375.6 -7.0 -4.4
5 0 -233.2 0.0 0.6 0.0
5 1 368.9 45.4 1.4 -0.5
5 2 187.2 220.2 0.0 2.2
5 3 -138.7 -122.9 0.6 0.4
5 4 -142.0 43.0 2.2 1.7
5 5 20.9 106.1 0.9 1.9
6 0 64.4 0.0 -0.2 0.0
6 1 63.8 -18.4 -0.4 0.3
6 2 76.9 16.8 0.9 -1.6
6 3 -115.7 48.8 1.2 -0.4
6 4 -40.9 -59.8 -0.9 0.9
6 5 14.9 10.9 0.3 0.7
6 6 -60.7 72.7 0.9 0.9
7 0 79.5 0.0 -0.0 0.0
7 1 -77.0 -48.9 -0.1 0.6
7 2 -8.8 -14.4 -0.1 0.5
7 3 59.3 -1.0 0.5 -0.8
7 4 15.8 23.4 -0.1 0.0
7 5 2.5 -7.4 -0.8 -1.0
7 6 -11.1 -25.1 -0.8 0.6
7 7 14.2 -2.3 0.8 -0.2
8 0 23.2 0.0 -0.1 0.0
8 1 10.8 7.1 0.2 -0.2
8 2 -17.5 -12.6 0.0 0.5
8 3 2.0 11.4 0.5 -0.4
8 4 -21.7 -9.7 -0.1 0.4
8 5 16.9 12.7 0.3 -0.5
8 6 15.0 0.7 0.2 -0.6
8 7 -16.8 -5.2 -0.0 0.3
8 8 0.9 3.9 0.2 0.2
9 0 4.6 0.0 -0.0 0.0
9 1 7.8 -24.8 -0.1 -0.3
9 2 3.0 12.2 0.1 0.3
9 3 -0.2 8.3 0.3 -0.3
9 4 -2.5 -3.3 -0.3 0.3
9 5 -13.1 -5.2 0.0 0.2
9 6 2.4 7.2 0.3 -0.1
9 7 8.6 -0.6 -0.1 -0.2
9 8 -8.7 0.8 0.1 0.4
9 9 -12.9 10.0 -0.1 0.1
10 0 -1.3 0.0 0.1 0.0
10 1 -6.4 3.3 0.0 0.0
10 2 0.2 0.0 0.1 -0.0
10 3 2.0 2.4 0.1 -0.2
10 4 -1.0 5.3 -0.0 0.1
10 5 -0.6 -9.1 -0.3 -0.1
10 6 -0.9 0.4 0.0 0.1
10 7 1.5 -4.2 -0.1 0.0
10 8 0.9 -3.8 -0.1 -0.1
10 9 -2.7 0.9 -0.0 0.2
10 10 -3.9 -9.1 -0.0 -0.0
11 0 2.9 0.0 0.0 0.0
11 1 -1.5 0.0 -0.0 -0.0
11 2 -2.5 2.9 0.0 0.1
11 3 2.4 -0.6 0.0 -0.0
11 4 -0.6 0.2 0.0 0.1
11 5 -0.1 0.5 -0.1 -0.0
11 6 -0.6 -0.3 0.0 -0.0
11 7 -0.1 -1.2 -0.0 0.1
11 8 1.1 -1.7 -0.1 -0.0
11 9 -1.0 -2.9 -0.1 0.0
11 10 -0.2 -1.8 -0.1 0.0
11 11 2.6 -2.3 -0.1 0.0
12 0 -2.0 0.0 0.0 0.0
12 1 -0.2 -1.3 0.0 -0.0
12 2 0.3 0.7 -0.0 0.0
12 3 1.2 1.0 -0.0 -0.1
12 4 -1.3 -1.4 -0.0 0.1
12 5 0.6 -0.0 -0.0 -0.0
12 6 0.6 0.6 0.1 -0.0
12 7 0.5 -0.1 -0.0 -0.0
12 8 -0.1 0.8 0.0 0.0
12 9 -0.4 0.1 0.0 -0.0
12 10 -0.2 -1.0 -0.1 -0.0
12 11 -1.3 0.1 -0.0 0.0
12 12 -0.7 0.2 -0.1 -0.1`;
const rows=C.trim().split(/\n/).map(s=>s.trim().split(/\s+/).map(Number));
const g=[],h=[],gd=[],hd=[]; for(const [n,m,G,H,dG,dH] of rows){const i=n*(n+1)/2+m;g[i]=G;h[i]=H;gd[i]=dG;hd[i]=dH;}
function legendre(x){const p=[1],dp=[0],sn=[1]; const z=Math.sqrt((1-x)*(1+x)); let n,m,i,i1,i2,k;
 for(n=1;n<=NMAX;n++)for(m=0;m<=n;m++){i=n*(n+1)/2+m;if(n===m){i1=(n-1)*n/2+m-1;p[i]=z*p[i1];dp[i]=z*dp[i1]+x*p[i1];}else if(n===1&&m===0){i1=(n-1)*n/2+m;p[i]=x*p[i1];dp[i]=x*dp[i1]-z*p[i1];}else{i1=(n-2)*(n-1)/2+m;i2=(n-1)*n/2+m;if(m>n-2){p[i]=x*p[i2];dp[i]=x*dp[i2]-z*p[i2];}else{k=((n-1)*(n-1)-m*m)/((2*n-1)*(2*n-3));p[i]=x*p[i2]-k*p[i1];dp[i]=x*dp[i2]-z*p[i2]-k*dp[i1];}}}
 for(n=1;n<=NMAX;n++){i=n*(n+1)/2;i1=(n-1)*n/2;sn[i]=sn[i1]*(2*n-1)/n;for(m=1;m<=n;m++){i=n*(n+1)/2+m;i1=i-1;sn[i]=sn[i1]*Math.sqrt(((n-m+1)*(m===1?2:1))/(n+m));}}
 for(n=1;n<=NMAX;n++)for(m=0;m<=n;m++){i=n*(n+1)/2+m;p[i]*=sn[i];dp[i]*=-sn[i];} return {p,dp};}
function field(lat,lon,altKm,year){altKm=Number(altKm||0);year=Number(year||EPOCH);if(!(lat>=-90&&lat<=90&&lon>=-180&&lon<=360))throw Error('WMM coordinate out of range');if(year<2025||year>2030)throw Error('WMM2025 date out of range');
 const lr=lat*Math.PI/180,lo=lon*Math.PI/180,cl=Math.cos(lr),sl=Math.sin(lr),rc=A/Math.sqrt(1-EPS2*sl*sl),xp=(rc+altKm)*cl,zp=(rc*(1-EPS2)+altKm)*sl,r=Math.hypot(xp,zp),phig=Math.asin(zp/r),sinphi=Math.sin(phig),cosphi=Math.cos(phig),L=legendre(sinphi),rel=[(RE/r)*(RE/r)],cm=[1,Math.cos(lo)],sm=[0,Math.sin(lo)];
 for(let n=1;n<=NMAX;n++)rel[n]=rel[n-1]*(RE/r);for(let m=2;m<=NMAX;m++){cm[m]=cm[m-1]*cm[1]-sm[m-1]*sm[1];sm[m]=cm[m-1]*sm[1]+sm[m-1]*cm[1];}
 const dt=year-EPOCH;let bx=0,by=0,bz=0;for(let n=1;n<=NMAX;n++)for(let m=0;m<=n;m++){const i=n*(n+1)/2+m,G=g[i]+dt*gd[i],H=h[i]+dt*hd[i];bz-=rel[n]*(G*cm[m]+H*sm[m])*(n+1)*L.p[i];by+=rel[n]*(G*sm[m]-H*cm[m])*m*L.p[i];bx-=rel[n]*(G*cm[m]+H*sm[m])*L.dp[i];}
 if(Math.abs(cosphi)>1e-10)by/=cosphi;else throw Error('Polar special case not enabled in isolated gate');const psi=phig-lr,bzg=bx*Math.sin(psi)+bz*Math.cos(psi),bxg=bx*Math.cos(psi)-bz*Math.sin(psi),byg=by,Hh=Math.hypot(bxg,byg),F=Math.hypot(Hh,bzg);return{x:bxg,y:byg,z:bzg,h:Hh,f:F,i:Math.atan2(bzg,Hh)*180/Math.PI,d:Math.atan2(byg,bxg)*180/Math.PI};}
const TESTS=[
 {year:2025,alt:0,lat:80,lon:0,x:6521.6,y:145.9,z:54791.5,h:6523.2,f:55178.5,i:83.21,d:1.28},
 {year:2025,alt:0,lat:0,lon:120,x:39677.8,y:-109.6,z:-10580.2,h:39677.9,f:41064.3,i:-14.93,d:-0.16},
 {year:2025,alt:0,lat:-80,lon:240,x:6117.5,y:15751.9,z:-52022.5,h:16898.1,f:54698.2,i:-72,d:68.78},
 {year:2027.5,alt:0,lat:80,lon:0,x:6500.8,y:294.5,z:54869.4,h:6507.5,f:55253.9,i:83.24,d:2.59},
 {year:2027.5,alt:0,lat:0,lon:120,x:39701.6,y:-167.4,z:-10381.8,h:39702,f:41036.9,i:-14.65,d:-0.24}
];
function selfTest(){return TESTS.map(t=>{const r=field(t.lat,t.lon,t.alt,t.year),err={};for(const k of ['x','y','z','h','f'])err[k]=Math.abs(r[k]-t[k]);for(const k of ['i','d'])err[k]=Math.abs(r[k]-t[k]);const pass=err.x<1&&err.y<1&&err.z<1&&err.h<1&&err.f<1&&err.i<0.02&&err.d<0.02;return{input:{year:t.year,alt:t.alt,lat:t.lat,lon:t.lon},expected:t,actual:r,error:err,pass};});}
root.QiblaWMM2025=Object.freeze({epoch:EPOCH,degree:NMAX,field,selfTest});
})(typeof globalThis!=='undefined'?globalThis:window);
