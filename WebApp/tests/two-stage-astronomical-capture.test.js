'use strict';
const assert=require('assert');
const Session=require('../js/astronomical-verification-session.js');

function near(a,b,t=1e-9){return Math.abs(a-b)<=t;}

// Astronomical anchor: camera is aimed at Moon at 93.06°, sensor yaw is 20°.
const anchorHeading=93.06;
const anchorYaw=20;
const referenceQibla=136.04;

// No rotation: must remain 93.06° and therefore cannot be accepted as Qibla.
const unchanged=Session.buildAnchoredHeading(anchorHeading,anchorYaw,anchorYaw);
assert(near(unchanged,93.06));
assert(Math.abs(((referenceQibla-unchanged+540)%360)-180)>1);

// Rotate phone clockwise by 42.98°: anchored astronomical heading reaches 136.04°.
const alignedYaw=62.98;
const aligned=Session.buildAnchoredHeading(anchorHeading,anchorYaw,alignedYaw);
assert(near(aligned,136.04,1e-8));
assert(near(((referenceQibla-aligned+540)%360)-180,0,1e-8));

// Wraparound remains correct.
assert(near(Session.buildAnchoredHeading(350,350,10),10));

// Relative yaw provider can update without magnetometer/card values.
let yaw=20;
const tracker=new Session.RelativeYawTracker(null,()=>yaw);
tracker.start().then(()=>{
  assert(near(tracker.read(),20));
  yaw=62.98;
  assert(near(tracker.read(),62.98));
  tracker.stop();
  console.log('TWO-STAGE ASTRONOMICAL CAPTURE: PASS');
}).catch(err=>{console.error(err);process.exit(1);});
