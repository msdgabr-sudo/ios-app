'use strict';
const fs=require('fs');
const assert=require('assert');
const ui=fs.readFileSync('js/astronomical-observatory-ui.js','utf8');
const session=fs.readFileSync('js/astronomical-verification-session.js','utf8');

assert(session.includes("this.phase = 'OBSERVE_CELESTIAL'"),'Session must begin by observing the celestial body.');
assert(session.includes("self.phase='ALIGN_QIBLA'"),'A valid celestial solution must create the Qibla-alignment phase.');
assert(session.includes('buildAnchoredHeading'),'Qibla alignment must use the astronomically anchored relative rotation.');
assert(session.includes("alignmentMode:'astronomical-relative-yaw'"),'Recorded result must identify the two-stage astronomical method.');
assert(!session.includes('webkitCompassHeading'),'No hidden platform compass may enter the astronomical path.');
assert(ui.includes("alignPhase=data.phase==='ALIGN_QIBLA'"),'UI must expose the second alignment phase.');
assert(ui.includes("دوّر الهاتف نحو القبلة"),'UI must guide rotation after the celestial reference is fixed.');
assert(ui.includes("if(this.mode==='auto'&&ratio>=1)this.requestAutoCapture()"),'Automatic capture must trigger after anchored Qibla alignment.');
console.log('TWO-STAGE RETICLE/CAPTURE HANDSHAKE: PASS');
