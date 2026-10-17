const assert=require('assert/strict');
const {createHarness}=require('./harness.cjs');
function fixture(options){
 const h=createHarness(options),c=h.context;
 c.registerLCXL3Profile({id:'test',name:'TEST',matchNames:['Test Synth'],requiredParameters:['Cutoff'],parameters:{Cutoff:'test/cutoff'},pages:[{name:'Tone',rows:Array.from({length:3},()=>Array(8).fill('Cutoff'))}],faders:Array(8).fill('Cutoff'),buttons:Array(16).fill(''),colors:{global:[127,0,127]}});
 h.iroko=()=>h.plugin('Iroko',Object.values(c.IROKO_PARAMETERS));
 h.synth=()=>h.plugin('Test Synth',['test/cutoff']);h.unknown=()=>h.plugin('Unknown',['unknown']);
 h.press=(direction,drain=true)=>{const cc=direction>0?102:103;h.callbacks.midi(0xb0,cc,127);h.callbacks.midi(0xb0,cc,0);if(drain)h.drain();};
 h.track=(name,...devices)=>({name,devices});return h;
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko(),u=h.unknown();
 b.enabled=false;
 h.setProject([h.track('Guitar A',a),h.track('Unsupported',u),h.track('Guitar B',b)]);
 h.press(1);assert.equal(h.target,b);assert.equal(b.enabled,false,'bypassed plugins stay eligible without being enabled');h.press(1);assert.equal(h.target,a,'forward wraps');h.press(-1);assert.equal(h.target,b,'backward wraps');
 h.select(1);h.drain();h.press(1);assert.equal(h.target,b,'generic mode finds next supported plugin');
 h.select(1);h.drain();h.press(-1);assert.equal(h.target,a,'generic mode finds previous supported plugin');
 assert.equal(h.writes.length,0,'discovery, selection and default enabled sections never write parameters');
 const lines=h.sysex.map(s=>Buffer.from(s,'hex')).filter(b=>b[6]===6&&b[7]===53).slice(-3).map(b=>b.subarray(9,-1).toString());
 assert.deepEqual(lines,['Guitar A','IROKO 1/3 D1','Amp + FX'],'permanent display identifies track, instance and page');
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko(),s=h.synth();
 h.setProject([h.track('Same track',a,h.unknown(),s,b)]);
 h.context.page=2;h.press(1);assert.equal(h.target,s);h.press(1);assert.equal(h.target,b);assert.equal(h.context.page,2,'profile page memory survives mixed profiles');
 h.press(-1);assert.equal(h.target,s);h.press(-1);assert.equal(h.target,a);
 h.press(1,false);h.press(1,false);h.press(-1,false);h.drain();assert.equal(h.target,s,'rapid presses run in order');
 h.callbacks.midi(0xb0,102,127);h.callbacks.midi(0xb0,102,127);h.drain();assert.equal(h.target,b,'one navigation per held button');h.callbacks.midi(0xb0,102,0);
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko();h.setProject([h.track('A',a),h.track('B',b)]);
 h.callbacks.midi(0xb0,65,127);h.callbacks.midi(0xb0,65,0);assert.equal(h.pinned.get(),true);
 h.select(1);h.drain();assert.equal(h.target,a,'manual selection leaves locked controller target in place');
 h.press(1);assert.equal(h.target,b,'navigation originates at locked target');assert.equal(h.pinned.get(),true,'lock follows destination');
 h.press(-1);assert.equal(h.target,a);assert.equal(h.pinned.get(),true);
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko();h.setProject([h.track('A',a),h.track('B',b)]);
 h.callbacks.midi(0xbf,5,64);assert.equal(h.context.faderPicked[0],true);
 h.context.displayed.old='stale';h.context.buttonDown[37]=true;
 h.press(1,false);h.drain(()=>h.context.navigator.busy());assert.equal(h.context.navigator.busy(),true);
 assert.equal(Object.keys(h.context.displayed).length,0);assert.equal(Object.keys(h.context.buttonDown).length,0);
 assert.equal(h.context.faderPicked.length,0);
 h.writes.length=0;
 h.callbacks.value(h.context.IROKO_PARAMETERS['Amp Power'],0);
 for(const msg of [[0xbf,77,65],[0xbf,5,64],[0xb0,37,127],[0xb0,43,127]])h.callbacks.midi(...msg);
 h.context.flush();assert.equal(h.writes.length,0,'all writes including section enforcement suspended during handoff');assert.equal(h.presetMessages.length,0);
 h.drain();assert.equal(h.target,b);h.writes.length=0;h.callbacks.midi(0xbf,5,0);assert.equal(h.writes.length,0,'identical IDs cannot retain previous fader pickup');
}
{
 const h=fixture(),a=h.iroko();h.setProject([h.track('One',a)]);h.press(1);h.press(-1);assert.equal(h.target,a);assert.equal(h.selections.length,0,'single instance never reselects');
 h.setProject([h.track('Empty',h.unknown())]);h.press(1);assert.equal(h.context.navigator.status().message,'No supported plugins');
 // A matching name without the signature and rack-contained plugins are excluded.
 const rack=h.unknown();rack.nested=[h.iroko()];h.setProject([h.track('Rack',rack,h.plugin('Iroko',['wrong']))]);h.press(1);assert.equal(h.context.navigator.status().message,'No supported plugins');
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko();h.setProject([h.track('A',a),h.track('B',b),h.track('C',h.unknown())]);
 h.press(1,false);h.drain(()=>h.context.navigator.status().phase==='discovery'&&h.tasks.length>0);h.select(2);h.drain();assert.equal(h.target,h.project[2].devices[0]);assert.equal(h.context.navigator.status().message,'Selection changed');assert.equal(h.selections.length,0);
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko();h.setProject([h.track('A',a),h.track('B',b),...Array.from({length:5},(_,i)=>h.track('Empty '+i,h.unknown()))]);
 h.press(1,false);
 // Allow discovery to capture B, then replace it with an identical-looking plugin.
 h.drain(()=>h.context.navigator.status().destination?.t===1);
 assert.equal(h.context.navigator.status().destination.t,1);
 h.project[1].devices[0]=h.iroko();h.changed();h.drain();assert.equal(h.target,a);assert.equal(h.selections.length,0,'disappeared destination cannot select its identical replacement');
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko();const tracks=Array.from({length:35},(_,i)=>h.track('Track '+i,...Array.from({length:21},()=>h.unknown())));
 tracks[0].devices[0]=a;tracks[34].devices[20]=b;
 // Flat bank includes group rows, collapsed children, returns, and master in host order.
 tracks[1].type='group';tracks[1].collapsed=true;tracks[2].parent=tracks[1];tracks[33].type='return';tracks[34].type='master';
 h.setProject(tracks);h.press(1);assert.equal(h.target,b,'search crosses every track/device bank window');h.press(1);assert.equal(h.target,a);
 for(const index of [1,2,33])tracks[index].devices[9]=h.synth();h.changed();h.drain();
 h.press(1);assert.equal(h.target,tracks[1].devices[9]);h.press(1);assert.equal(h.target,tracks[2].devices[9]);h.press(1);assert.equal(h.target,tracks[33].devices[9]);h.press(1);assert.equal(h.target,b);
}
{
 const h=fixture({pinDelay:20}),a=h.iroko(),b=h.iroko();h.setProject([h.track('A',a),h.track('B',b)]);
 h.callbacks.midi(0xb0,65,127);h.callbacks.midi(0xb0,65,0);
 h.press(1);assert.equal(h.target,b);assert.equal(h.pinned.get(),true,'immediate lock plus navigation retains lock before asynchronous acknowledgment');
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko(),u=h.unknown();h.setProject([h.track('A',a),h.track('B',b),h.track('Other',u)]);
 h.press(1,false);h.drain(()=>h.context.navigator.status().destination?.t===1);
 h.project[1].devices.unshift(h.unknown());h.changed();h.drain();assert.equal(h.target,a);assert.equal(h.selections.length,0,'reordered destination is rejected');
 h.project[1].devices=[b];h.changed();h.drain();
 h.press(1,false);h.drain(()=>h.context.navigator.busy());h.select(2);h.changed();h.drain();
 assert.equal(h.target,u,'manual selection during handoff is respected');assert.equal(h.context.navigator.status().message,'Selection changed');
}
{
 const h=fixture(),a=h.iroko();h.setProject([h.track('Empty'),h.track('A',a)]);
 h.press(1);assert.equal(h.target,a,'empty origin finds a supported instance');
 h.setProject([h.track('Empty'),h.track('A',a)]);h.press(1,false);h.drain(()=>h.context.navigator.status().scannedTrack===1);h.select(1);h.drain();assert.equal(h.context.navigator.status().message,'Selection changed','manual selection from empty origin cancels discovery');
}
{
 const h=fixture({clampBanks:true}),a=h.iroko(),b=h.iroko();
 h.setProject([h.track('Long chain',a,...Array.from({length:19},()=>h.unknown()),b)]);
 h.press(1);assert.equal(h.target,b,'clamped final bank windows remain searchable');h.press(-1);assert.equal(h.target,a);
}
console.log('PASS: supported-instance ordering, wraps, duplicates, generic origin, profile memory, queue edges, pinned targets, no-match, main-chain scope, stale identity, manual cancellation, handoff write gate/pickup, large paged projects.');
