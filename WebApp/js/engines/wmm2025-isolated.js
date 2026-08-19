/* QiblaAstro isolated WMM2025 engine.
 * SAFETY: intentionally NOT loaded by index.html and NOT wired to MDECL/QM,
 * digital compass, camera, or astronomical verification.
 * Coefficients: WMM2025 official coefficient set, epoch 2025.0, degree/order 12.
 */
(function(root){
'use strict';
const N=12, RE=6371.2, A=6378.137, E2=0.00669437999014, EPOCH=2025.0, VALID_TO=2030.0;
const rows=`
1 0 -29351.8 0.0 12.0 0.0
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
7 0 79.5 0.0 0.0 0.0
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
8 7 -16.8 -5.2 0.0 0.3
8 8 0.9 3.9 0.2 0.2
9 0 4.6 0.0 0.0 0.0
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
10 2 0.2 0.0 0.1 0.0
10 3 2.0 2.4 0.1 -0.2
10 4 -1.0 5.3 0.0 0.1
10 5 -0.6 -9.1 -0.3 -0.1
10 6 -0.9 0.4 0.0 0.1
10 7 1.5 -4.2 -0.1 0.0
10 8 0.9 -3.8 -0.1 -0.1
10 9 -2.7 0.9 0.0 0.2
10 10 -3.9 -9.1 0.0 0.0
11 0 2.9 0.0 0.0 0.0
11 1 -1.5 0.0 0.0 0.0
11 2 -2.5 2.9 0.0 0.1
11 3 2.4 -0.6 0.0 0.0
11 4 -0.6 0.2 0.0 0.1
11 5 -0.1 0.5 -0.1 0.0
11 6 -0.6 -0.3 0.0 0.0
11 7 -0.1 -1.2 0.0 0.1
11 8 1.1 -1.7 -0.1 0.0
11 9 -1.0 -2.9 -0.1 0.0
11 10 -0.2 -1.8 -0.1 0.0
11 11 2.6 -2.3 -0.1 0.0
12 0 -2.0 0.0 0.0 0.0
12 1 -0.2 -1.3 0.0 0.0
12 2 0.3 0.7 0.0 0.0
12 3 1.2 1.0 0.0 -0.1
12 4 -1.3 -1.4 0.0 0.1
12 5 0.6 0.0 0.0 0.0
12 6 0.6 0.6 0.1 0.0
12 7 0.5 -0.1 0.0 0.0
12 8 -0.1 0.8 0.0 0.0
12 9 -0.4 0.1 0.0 0.0
12 10 -0.2 -1.0 -0.1 0.0
12 11 -1.3 0.1 0.0 0.0
12 12 -0.7 0.2 -0.1 -0.1`;
function matrix(){return Array.from({length:N+2},()=>Array(N+2).fill(0));}
const g=matrix(),h=matrix(),dg=matrix(),dh=matrix();
rows.trim().split(/\n/).forEach(line=>{const v=line.trim().split(/\s+/).map(Number),n=v[0],m=v[1];g[n][m]=v[2];h[n][m]=v[3];dg[n][m]=v[4];dh[n][m]=v[5];});
function declination(latDeg,lonDeg,altKm,decimalYear){
  if(![latDeg,lonDeg,altKm,decimalYear].every(Number.isFinite)) throw new TypeError('WMM2025 inputs must be finite numbers');
  if(latDeg < -90 || latDeg > 90 || lonDeg < -180 || lonDeg > 360) throw new RangeError('WMM2025 coordinate out of range');
  if(decimalYear < EPOCH || decimalYear >= VALID_TO) throw new RangeError('WMM2025 valid for 2025.0 <= year < 2030.0');
  const t=decimalYear-EPOCH, phi=latDeg*Math.PI/180, lam=lonDeg*Math.PI/180;
  const sp=Math.sin(phi),cp=Math.cos(phi),rc=A/Math.sqrt(1-E2*sp*sp),rho=(rc+altKm)*cp,z=(rc*(1-E2)+altKm)*sp,r=Math.hypot(rho,z),phic=Math.asin(z/r),s=Math.sin(phic),c=Math.cos(phic);
  const P=matrix(),dP=matrix(); P[0][0]=1;
  for(let n=1;n<=N;n++) for(let m=0;m<=n;m++){
    if(n===m){const k=n===1?1:Math.sqrt((2*n-1)/(2*n));P[n][n]=k*c*P[n-1][n-1];dP[n][n]=k*(c*dP[n-1][n-1]-s*P[n-1][n-1]);}
    else {const f1=Math.sqrt(n*n-m*m),f2=Math.sqrt(Math.max(0,(n-1)*(n-1)-m*m)),a=2*n-1,p2=n>=2?P[n-2][m]:0,dp2=n>=2?dP[n-2][m]:0;P[n][m]=(a*s*P[n-1][m]-f2*p2)/f1;dP[n][m]=(a*(s*dP[n-1][m]+c*P[n-1][m])-f2*dp2)/f1;}
  }
  let bx=0,by=0,bz=0,ar=RE/r,arn=ar*ar;
  for(let n=1;n<=N;n++){arn*=ar;for(let m=0;m<=n;m++){const sm=Math.sin(m*lam),cm=Math.cos(m*lam),gt=g[n][m]+t*dg[n][m],ht=h[n][m]+t*dh[n][m],gc=gt*cm+ht*sm,gs=gt*sm-ht*cm;bx-=arn*gc*dP[n][m];bz-=arn*gc*P[n][m]*(n+1);if(Math.abs(c)>1e-10)by+=arn*m*gs*P[n][m]/c;}}
  const dphi=phic-phi,x=bx*Math.cos(dphi)-bz*Math.sin(dphi),y=by,H=Math.hypot(x,y),D=Math.atan2(y,x)*180/Math.PI;
  return {declination:D,horizontalIntensity:H,status:H<2000?'blackout':H<6000?'caution':'normal',model:'WMM2025',epoch:EPOCH};
}
root.QiblaWMM2025=Object.freeze({declination,epoch:EPOCH,validTo:VALID_TO,isolated:true});
})(typeof window!=='undefined'?window:globalThis);
