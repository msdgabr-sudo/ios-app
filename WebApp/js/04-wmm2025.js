/* QiblaAstro — WMM2025 isolated geomagnetic engine
 * Runtime status: ISOLATED. This file is NOT wired to the digital compass,
 * astronomical verification, camera, QT, or MDECL.
 * Model: NOAA/NCEI WMM2025, epoch 2025.0, degree/order 12.
 * WMM government model/software is public domain.
 */
(function(root){
'use strict';
const EPOCH=2025.0, MAX=12;
const COF=`1 0 -29351.8 0.0 12.0 0.0
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
function matrix(){return Array.from({length:13},()=>Array(13).fill(0));}
function Engine(){
 this.c=matrix();this.cd=matrix();this.tc=matrix();this.dp=matrix();this.k=matrix();
 this.snorm=Array(169).fill(0);this.sp=Array(13).fill(0);this.cp=Array(13).fill(0);
 this.fn=Array(13).fill(0);this.fm=Array(13).fill(0);this.pp=Array(13).fill(0);
 this.sp[0]=0;this.cp[0]=this.snorm[0]=this.pp[0]=1;this.dp[0][0]=0;
 for(const line of COF.split('\n')){const v=line.trim().split(/\s+/).map(Number),n=v[0],m=v[1];this.c[m][n]=v[2];this.cd[m][n]=v[4];if(m){this.c[n][m-1]=v[3];this.cd[n][m-1]=v[5];}}
 for(let n=1;n<=MAX;n++){
  this.snorm[n]=this.snorm[n-1]*(2*n-1)/n;let j=2;
  for(let m=0;m<=n;m++){
   this.k[m][n]=(((n-1)*(n-1))-m*m)/((2*n-1)*(2*n-3));
   if(m>0){const f=((n-m+1)*j)/(n+m);this.snorm[n+m*13]=this.snorm[n+(m-1)*13]*Math.sqrt(f);j=1;this.c[n][m-1]*=this.snorm[n+m*13];this.cd[n][m-1]*=this.snorm[n+m*13];}
   this.c[m][n]*=this.snorm[n+m*13];this.cd[m][n]*=this.snorm[n+m*13];
  }
  this.fn[n]=n+1;this.fm[n]=n;
 }
 this.k[1][1]=0;this.fm[0]=0;
}
Engine.prototype.field=function(altKm,latDeg,lonDeg,year){
 if(!Number.isFinite(altKm)||!Number.isFinite(latDeg)||!Number.isFinite(lonDeg)||!Number.isFinite(year))throw new TypeError('WMM2025 requires finite numeric inputs');
 if(latDeg < -90 || latDeg > 90 || lonDeg < -180 || lonDeg > 180)throw new RangeError('WMM2025 latitude/longitude out of range');
 const dt=year-EPOCH;if(dt<0||dt>5)throw new RangeError('WMM2025 valid for decimal years 2025.0 through 2030.0');
 const a=6378.137,b=6356.7523142,re=6371.2,a2=a*a,b2=b*b,c2=a2-b2,a4=a2*a2,b4=b2*b2,c4=a4-b4,dtr=Math.PI/180;
 const rlon=lonDeg*dtr,rlat=latDeg*dtr,srlon=Math.sin(rlon),srlat=Math.sin(rlat),crlon=Math.cos(rlon),crlat=Math.cos(rlat),srlat2=srlat*srlat,crlat2=crlat*crlat;
 this.sp[1]=srlon;this.cp[1]=crlon;
 const q=Math.sqrt(a2-c2*srlat2),q1=altKm*q,q2=Math.pow((q1+a2)/(q1+b2),2),ct=srlat/Math.sqrt(q2*crlat2+srlat2),st=Math.sqrt(Math.max(0,1-ct*ct));
 const r2=altKm*altKm+2*q1+(a4-c4*srlat2)/(q*q),r=Math.sqrt(r2),d=Math.sqrt(a2*crlat2+b2*srlat2),ca=(altKm+d)/r,sa=c2*crlat*srlat/(r*d);
 for(let m=2;m<=MAX;m++){this.sp[m]=this.sp[1]*this.cp[m-1]+this.cp[1]*this.sp[m-1];this.cp[m]=this.cp[1]*this.cp[m-1]-this.sp[1]*this.sp[m-1];}
 const aor=re/r;let ar=aor*aor,br=0,bt=0,bp=0,bpp=0;
 for(let n=1;n<=MAX;n++){
  ar*=aor;
  for(let m=0;m<=n;m++){
   if(n===m){this.snorm[n+m*13]=st*this.snorm[n-1+(m-1)*13];this.dp[m][n]=st*this.dp[m-1][n-1]+ct*this.snorm[n-1+(m-1)*13];}
   else if(n===1&&m===0){this.snorm[n+m*13]=ct*this.snorm[n-1+m*13];this.dp[m][n]=ct*this.dp[m][n-1]-st*this.snorm[n-1+m*13];}
   else {if(m>n-2){this.snorm[n-2+m*13]=0;this.dp[m][n-2]=0;}this.snorm[n+m*13]=ct*this.snorm[n-1+m*13]-this.k[m][n]*this.snorm[n-2+m*13];this.dp[m][n]=ct*this.dp[m][n-1]-st*this.snorm[n-1+m*13]-this.k[m][n]*this.dp[m][n-2];}
   this.tc[m][n]=this.c[m][n]+dt*this.cd[m][n];if(m)this.tc[n][m-1]=this.c[n][m-1]+dt*this.cd[n][m-1];
   const par=ar*this.snorm[n+m*13];let t1,t2;if(m===0){t1=this.tc[m][n]*this.cp[m];t2=this.tc[m][n]*this.sp[m];}else{t1=this.tc[m][n]*this.cp[m]+this.tc[n][m-1]*this.sp[m];t2=this.tc[m][n]*this.sp[m]-this.tc[n][m-1]*this.cp[m];}
   bt-=ar*t1*this.dp[m][n];bp+=this.fm[m]*t2*par;br+=this.fn[n]*t1*par;
   if(st===0&&m===1){if(n===1)this.pp[n]=this.pp[n-1];else this.pp[n]=ct*this.pp[n-1]-this.k[m][n]*this.pp[n-2];bpp+=this.fm[m]*t2*ar*this.pp[n];}
  }
 }
 bp=st===0?bpp:bp/st;
 const x=-bt*ca-br*sa,y=bp,z=bt*sa-br*ca,h=Math.hypot(x,y),f=Math.hypot(h,z),declination=Math.atan2(y,x)/dtr,inclination=Math.atan2(z,h)/dtr;
 return {declination,inclination,x,y,z,h,f,model:'WMM-2025',epoch:EPOCH,year,altitudeKm:altKm,latitude:latDeg,longitude:lonDeg,reliability:h<2000?'blackout':h<6000?'caution':'normal'};
};
Engine.prototype.declination=function(altKm,lat,lon,year){return this.field(altKm,lat,lon,year).declination;};
function decimalYear(date){date=date||new Date();const y=date.getUTCFullYear(),a=Date.UTC(y,0,1),b=Date.UTC(y+1,0,1);return y+(date.getTime()-a)/(b-a);}
const api={Engine,decimalYear,create:()=>new Engine(),epoch:EPOCH,model:'WMM-2025',coefficientCount:90};
root.QiblaAstroWMM2025=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
