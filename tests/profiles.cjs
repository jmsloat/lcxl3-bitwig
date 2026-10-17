const assert=require('assert/strict');
const {createHarness}=require('./harness.cjs');
const h=createHarness(), {context:c,callbacks:cb,writes,presetMessages}=h;
const iroko=c.IROKO_PARAMETERS;
assert.equal(h.tasks.length,0,'continuous diagnostic exports are off by default');
h.selectDevice('Iroko',iroko,{[iroko['Amp Sel']]:0});
assert.equal(c.activeProfile.id,'iroko');
cb.midi(0xbf,77,65);assert.equal(writes.pop()[1],iroko['Clean Gain']);
c.page=2;c.needsLayout=true;c.flush();
// A second data-only profile proves the engine has no Iroko-specific routing.
c.registerLCXL3Profile({id:'test',name:'TEST',matchNames:['Test Synth'],requiredParameters:['Cutoff'],parameters:{Cutoff:'test/cutoff',Enabled:'test/enabled'},
 pages:[{name:'Tone',rows:[['Cutoff','','','','','','',''],['','','','','','','',''],['','','','','','','','']]}],
 faders:['Cutoff','','','','','','',''],buttons:['Enabled','','','','','','','','','','','','','','',''],colors:{global:[127,0,127]}});
h.selectDevice('Test Synth',{Cutoff:'test/cutoff',Enabled:'test/enabled'});
assert.equal(c.activeProfile.id,'test');assert.equal(c.page,0);
cb.midi(0xbf,77,65);assert.equal(writes.pop()[1],'test/cutoff');
cb.midi(0xb0,37,127);assert.deepEqual(writes.pop(),['set','test/enabled',0,2]);cb.midi(0xb0,37,0);
cb.value(iroko['Amp Power'],0);c.flush();assert.equal(writes.length,0,'Iroko rules cannot affect another profile');
cb.midi(0xb0,43,127);cb.midi(0xb0,43,0);assert.equal(presetMessages.length,0,'profiles without preset actions send nothing');
h.selectDevice('Iroko',iroko,{[iroko['Amp Sel']]:0});assert.equal(c.page,2,'custom page selection is remembered');
cb.midi(0xbf,5,0);assert.equal(writes.length,0,'switching profiles rearms fader pickup');
// A matching name alone must not grant access to hard-coded plugin IDs.
h.selectDevice('Iroko',{Other:'other/id'});assert.equal(c.activeProfile,null);
cb.value(iroko['Amp Power'],0);c.flush();assert.equal(writes.length,0);
h.selectDevice('Unknown Instrument',{Gain:'unknown/gain'});
assert.equal(c.activeProfile,null);
h.remotePage.count.set(3);h.remotePage.name.set('Tone');h.remoteState[0].name.set('Cutoff');h.remoteState[0].exists.set(true);h.remoteState[0].value.set(0.5);c.flush();
cb.midi(0xbf,77,65);assert.deepEqual(writes.pop(),['remote',0,c.LCXL3_SETTINGS.normalStep]);
cb.midi(0xb6,63,127);cb.midi(0xbf,77,63);assert.deepEqual(writes.pop(),['remote',0,-c.LCXL3_SETTINGS.fineStep]);cb.midi(0xb6,63,0);
cb.midi(0xbf,85,65);cb.midi(0xbf,5,127);cb.midi(0xb0,37,127);cb.midi(0xb0,43,127);
assert.equal(writes.length,0,'generic fallback leaves other rows/faders/buttons unassigned');assert.equal(presetMessages.length,0);
cb.midi(0xb0,107,127);cb.midi(0xb0,107,127);assert.equal(h.remotePage.index.get(),1,'held page button advances once');cb.midi(0xb0,107,0);
cb.midi(0xb0,107,127);assert.equal(h.remotePage.index.get(),2);cb.midi(0xb0,107,0);cb.midi(0xb0,107,127);assert.equal(h.remotePage.index.get(),2,'page navigation stops at the last page');
cb.midi(0xb0,107,0);cb.midi(0xb0,106,127);assert.equal(h.remotePage.index.get(),1);cb.midi(0xb0,106,0);
h.remoteState[0].exists.set(false);cb.midi(0xbf,77,65);assert.equal(writes.length,0,'empty remotes are protected');
h.selectDevice('',{});h.remoteState[0].exists.set(true);cb.midi(0xbf,77,65);assert.equal(writes.length,0,'no device means no writes');
// Lock uses Bitwig's pinnable cursor, not a second routing implementation.
h.selectDevice('Test Synth',{Cutoff:'test/cutoff',Enabled:'test/enabled'});
cb.midi(0xb0,65,127);assert.equal(h.pinned.get(),true);assert.equal(c.pendingButtonFeedback.state,'Locked');cb.midi(0xb0,65,0);
h.selectDevice('Iroko',iroko);assert.equal(c.activeProfile.id,'test','pinned cursor stays on the original device');
cb.midi(0xb0,65,127);assert.equal(h.pinned.get(),false);cb.midi(0xb0,65,0);
h.selectDevice('Iroko',iroko);assert.equal(c.activeProfile.id,'iroko');
assert.throws(()=>c.registerLCXL3Profile({id:'iroko'}));
assert.throws(()=>c.registerLCXL3Profile({id:'invalid',name:'Invalid',matchNames:['Invalid'],parameters:{},pages:[],faders:[],buttons:[]}));
console.log('PASS: two independent profiles, signature matching, page memory, pickup reset, generic remotes and bounds, device lock, profile-specific side effects, default diagnostics disabled.');
