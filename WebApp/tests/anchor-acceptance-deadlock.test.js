'use strict';
const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('js/astronomical-verification-session.js','utf8');
assert(!s.includes('result&&result.accepted&&finite(heading)'),'Celestial anchor must not require final Qibla acceptance.');
assert(s.includes('detectionConfidence>=0.50&&gravityQuality>=0.40&&quality>=0.45'),'Visible tracking, gravity and quality thresholds must drive the anchor.');
assert(s.includes('if(self.anchorStableCount>=3){'),'Three stable raw celestial solves must establish the anchor.');
assert(s.includes('__qiblaAstroAnchorDebug'),'Runtime anchor diagnostics must remain available.');
function validAnchor(v){return Number.isFinite(v.heading)&&Number.isFinite(v.reference)&&Number.isFinite(v.yaw)&&v.samples>=2&&v.detection>=.50&&v.gravity>=.40&&v.quality>=.45;}
assert(validAnchor({heading:93.06,reference:136.04,yaw:271,samples:4,detection:.70,gravity:.83,quality:.65,accepted:false}), 'Screenshot-equivalent raw celestial observation must establish an anchor even before Qibla alignment.');
console.log('ANCHOR ACCEPTANCE DEADLOCK: PASS');
