const assert=require('assert/strict');
const {createHarness}=require('./harness.cjs');
function fixture(options){
 const h=createHarness(options),c=h.context;
 c.registerLCXL3Profile({id:'test',name:'TEST',matchNames:['Test Synth'],requiredParameters:['Cutoff'],parameters:{Cutoff:'test/cutoff'},pages:[{name:'Tone',rows:Array.from({length:3},()=>Array(8).fill('Cutoff'))}],faders:Array(8).fill('Cutoff'),buttons:Array(16).fill(''),colors:{global:[127,0,127]}});
 h.iroko=()=>h.plugin('Iroko',Object.values(c.IROKO_PARAMETERS));
 h.synth=()=>h.plugin('Test Synth',['test/cutoff']);h.unknown=()=>h.plugin('Unknown',['unknown']);
 h.press=(direction,drain=true,rescan=false)=>{if(rescan)h.callbacks.midi(0xb6,63,127);const cc=direction>0?102:103;h.callbacks.midi(0xb0,cc,127);h.callbacks.midi(0xb0,cc,0);if(rescan)h.callbacks.midi(0xb6,63,0);if(drain)h.drain();};
 h.track=(name,...devices)=>({name,devices});return h;
}
{
 const storedCursorModes=Object.fromEntries(['origin','destination','slot-discovery','slot-parent','selection-origin'].map(id=>['lcxl3-nav-'+id,0]));
 const h=fixture({storedCursorModes}),origin=h.iroko(),nested=h.synth(),chain=h.unknown();
 chain.slots={FX:{name:'FX',devices:[nested]}};
 h.setProject([h.track('Origin',origin),h.track('Destination',chain)]);h.press(1);
 assert.equal(h.target,nested,'saved selection-following private cursors must not leak selection after upgrade');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined);
 assert.ok(h.cursorMoves.filter(m=>m.id!=='lcxl3-iroko-track').every(m=>m.mode===1),'private cursors must actually use the new mode, not just request it');
 assert.equal(storedCursorModes['lcxl3-iroko-device'],0,'main controller selection-following identity must stay unchanged');
}
{
 const h=fixture({privatePinDelay:100}),a=h.iroko(),first=h.synth(),later=h.iroko();
 const unused=h.unknown();unused.slots={FX:{name:'FX',devices:[]}};
 h.setProject([h.track('Origin',a),h.track('Destination',h.unknown(),first,later,unused),h.track('Unrelated',h.iroko())],0,0,false);
 h.drain(()=>h.context.navigator.status().tracks===3);
 h.press(1);assert.equal(h.target,first,'first supported plugin on the next eligible track wins');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined,'private cursor moves must not cancel navigation');
 assert.equal(h.slotEntries.length,0,'stop before opening containers after the first match');
 assert.ok(h.bankScrolls.every(t=>t<2),'do not search tracks after the destination');
 assert.ok(h.cursorMoves.filter(m=>m.id!=='lcxl3-iroko-track').every(m=>m.mode===1),'unassigned private cursors must position in isolated mode before pinning');
 h.press(-1);assert.equal(h.target,a,'reverse navigation changes tracks, not plugin order');
 h.select(1,2);h.drain();h.press(1);assert.equal(h.target,h.project[2].devices[0],'manually selected later plugins do not become extra navigation stops');
}
{
 const h=fixture({privatePinDelay:100}),origin=h.iroko(),old=h.unknown(),replacement=h.unknown(),first=h.iroko(),second=h.synth();
 old.slots={FX:{name:'FX',devices:[first]}};replacement.slots={FX:{name:'FX',devices:[second]}};
 h.setProject([h.track('Origin',origin),h.track('Destination',old)]);h.press(1);assert.equal(h.target,first);
 h.press(-1);assert.equal(h.target,origin);h.project[1].devices=[replacement];h.changed();h.drain();
 h.press(1);assert.equal(h.target,second,'private cursors must recover after their previous target is removed');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined);
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
 h.setProject([h.track('First',a,h.unknown(),h.iroko()),h.track('Synth',s),h.track('Last',b)]);
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
 h.press(1,true,true);assert.equal(h.target,tracks[1].devices[9],'Shift + Track refreshes newly added plugins');h.press(1);assert.equal(h.target,tracks[2].devices[9]);h.press(1);assert.equal(h.target,tracks[33].devices[9]);h.press(1);assert.equal(h.target,b);
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
 const h=fixture(),a=h.iroko(),b=h.synth();
 h.setProject([h.track('Empty'),h.track('A',a),h.track('B',b)]);
 h.press(1);assert.equal(h.target,a);h.press(1);assert.equal(h.target,b);
 h.select(0);h.drain();const state=JSON.stringify(h.project);h.press(1);
 assert.equal(h.target,a,'an empty origin must not reuse a stale same-origin shortcut');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined);
 assert.equal(JSON.stringify(h.project),state);assert.equal(h.writes.length,0);
}
{
 const h=fixture({clampBanks:true}),a=h.iroko(),b=h.iroko();
 h.setProject([h.track('Origin',a),h.track('Long chain',...Array.from({length:19},()=>h.unknown()),b)]);
 h.press(1);assert.equal(h.target,b,'clamped final bank windows remain searchable');h.press(-1);assert.equal(h.target,a);
}
// Physical navigation needs immediate visible acknowledgment while discovery
// runs, even when a knob's temporary display is still on the hardware screen.
{
 const h=fixture(),a=h.plugin('Pigments',Object.values(h.context.PIGMENTS_PARAMETERS)),b=h.iroko();
 h.setProject([h.track('Synth',a),h.track('Guitar',b)]);
 for(const cc of [102,103])assert.ok(h.midi.some(m=>m[0]===0xb0&&m[1]===cc&&m[2]===3),'Track buttons are lit');
 const overlay=()=>h.sysex.map(s=>Buffer.from(s,'hex')).filter(b=>b[6]===6&&b[7]===54).slice(-2).map(b=>b.subarray(9,-1).toString());
 h.press(1,false);
 assert.deepEqual(overlay(),['Finding next plugin','Synth'],'physical press is acknowledged before asynchronous scanning');
 h.drain();assert.equal(h.target,b);assert.deepEqual(overlay(),['Iroko','Guitar']);
 assert.equal(h.context.activeProfile.id,'iroko');
 h.press(-1,false);assert.deepEqual(overlay(),['Finding previous plugin','Guitar']);
 h.drain();assert.equal(h.target,a);assert.equal(h.context.activeProfile.id,'pigments');
 assert.deepEqual(overlay(),['Pigments','Synth'],'destination overlay identifies plugin and track');
}
{
 const h=fixture(),a=h.iroko(),b=h.synth();
 h.setProject([h.track('A',a),...Array.from({length:25},(_,i)=>h.track('Empty '+i)),h.track('B',b)]);
 h.press(1);assert.equal(h.target,b);h.press(-1);assert.equal(h.target,a);
 assert.equal(h.context.navigator.status().scans,2,'each navigation scans only until its first eligible track');
 h.press(1);h.project[0].devices=[h.unknown()];h.changed();h.drain();h.press(-1);
 assert.equal(h.target,b,'removed targets are not reused from an instance catalog');
 const c=h.iroko();h.project.push(h.track('New',c));h.changed();h.drain();h.press(1);assert.equal(h.target,c);
 const d=h.synth();h.project[h.project.length-1].devices.unshift(d);h.changed();h.drain();
 h.press(-1);assert.equal(h.target,b);h.press(1,true,true);
 assert.equal(h.target,d,'fresh per-track scanning observes a new first supported device');
}
{
 const h=fixture({handoffEqualityDelay:250}),a=h.iroko(),b=h.synth();
 h.setProject([h.track('A',a),h.track('B',b)]);
 h.press(1);assert.equal(h.target,b);
 assert.equal(h.context.navigator.status().lastResult.destination.name,'Test Synth');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined,'late cursor acknowledgments do not cancel successful selection');
 h.press(-1);assert.equal(h.target,a);assert.equal(h.context.navigator.status().lastResult.cancelled,undefined);
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko(),c=h.iroko();
 h.setProject([h.track('A',a),h.track('B',b),h.track('C',c)]);
 h.press(1);assert.equal(h.target,b);
 h.select(2);h.drain();h.press(1);
 assert.equal(h.target,a,'manual selection between identical profiles updates the navigation origin');
 assert.equal(h.context.navigator.status().scans,2,'manual selection establishes the next navigation origin');
}
// Repeated navigation validates live identities rather than cached instances.
{
 const h=fixture(),a=h.iroko(),b=h.synth();
 h.setProject([h.track('A',a),...Array.from({length:6},()=>h.track('Empty')),h.track('B',b)]);
 h.press(1);h.bankScrolls.length=0;
 h.press(-1,false);h.drain(()=>h.context.navigator.status().phase==='idle');
 assert.equal(h.target,a);h.drain();
 // A replacement with identical names and IDs must not reuse the deleted identity.
 const replacement=h.synth();h.project[7].devices=[replacement];h.changed();h.drain();
 h.press(1);assert.equal(h.target,replacement);assert.equal(h.context.navigator.status().scans,3);
}
{
 const h=fixture({handoffEqualityDelay:250,pinDelay:100}),a=h.iroko(),b=h.synth();
 h.setProject([h.track('A',a),h.track('B',b)]);
 h.callbacks.midi(0xb0,65,127);h.callbacks.midi(0xb0,65,0);h.drain();
 h.press(1);const start=h.time;
 h.press(-1,false);h.drain(()=>h.context.navigator.busy());
 h.writes.length=0;h.callbacks.midi(0xbf,77,65);
 assert.equal(h.writes.length,0,'handoff path still blocks writes until acknowledgment');
 h.drain(()=>h.context.navigator.status().phase==='idle');
 assert.equal(h.target,a);assert.equal(h.pinned.get(),true);
 assert.ok(h.time-start>=350,'destination and delayed lock must both acknowledge');h.drain();
}
{
 const h=fixture(),a=h.iroko(),b=h.synth(),u=h.unknown();
 h.setProject([h.track('A',a),h.track('B',b),h.track('Other',u)]);h.press(1);
 h.press(-1,false);h.drain(()=>h.context.navigator.busy());h.select(2);h.drain();
 assert.equal(h.target,u);assert.equal(h.context.navigator.status().message,'Selection changed','manual selection cancels pending handoff');
}
{
 const h=fixture(),plugins=Array.from({length:18},()=>h.iroko());
 h.setProject([h.track('Many',...plugins)]);h.press(-1);assert.equal(h.target,plugins[0]);
 h.press(1);assert.equal(h.target,plugins[0],'one eligible track always uses its first supported device');
 assert.equal(h.selections.length,0,'an already selected first device is not reselected');
}
console.log('PASS: first-supported-device track ordering, wraps, ignored duplicates, generic origin, profile memory, queue edges, pinned targets, no-match, stale identity, manual cancellation, handoff gates, paged projects and isolated private cursors.');

for(const slotEntryDelay of [30,60,180]) {
 const h=fixture({slotEntryDelay}),chain=h.unknown(),iroko=h.iroko();
 chain.name='Chain';chain.slots={FX:{name:'FX',devices:[h.unknown(),iroko]}};
 h.setProject([h.track('Guitar',chain)],0,0,false);
 h.drain(()=>h.context.navigator.status().destination?.child===1);
 assert.equal(h.context.navigator.status().destination?.child,1,'discover Iroko without a UI-selected Chain slot');
 assert.equal(h.target,chain,'discovery must not move the controlled device');
 assert.equal(h.selections.length,0,'discovery must not select device headers');
 assert.equal(h.writes.length,0,'discovery must not write plugin parameters');
 assert.equal(chain.selectedSlot,undefined,'discovery must not change UI slot selection');
 h.drain();assert.equal(h.target,iroko);assert.equal(h.context.activeProfile.id,'iroko');
 assert.equal(h.context.navigator.status().lastResult.matches,1);
 assert.equal(h.context.navigator.status().message,'');
}
{
 const h=fixture({slotEntryDelay:180}),first=h.iroko(),chain=h.unknown(),nested=h.iroko();
 chain.slots={FX:{name:'FX',devices:[nested]}};chain.selectedSlot='FX';
 h.setProject([h.track('Guitar',first,chain)]);h.press(1);
 assert.equal(h.target,first,'first top-level match wins over a later Chain');
 assert.equal(h.context.navigator.status().lastResult.matches,1);assert.equal(h.slotEntries.length,0);
}

{
 const h=fixture(),a=h.iroko(),b=h.iroko(),c=h.synth();
 const chain=h.unknown();chain.name='Killgate + Iroko';chain.slots={FX:{name:'FX',devices:[h.unknown(),b]}};
 h.setProject([h.track('Origin',a),h.track('Guitar',chain,c)]);
 h.press(1);assert.equal(h.target,b,'first nested match precedes the following top-level device');
 h.press(1);assert.equal(h.target,a,'later supported devices on the destination track are ignored');
 h.press(-1);assert.equal(h.target,b);h.press(-1);assert.equal(h.target,a);
 h.press(-1);assert.equal(h.target,b,'reverse track navigation still takes the first device');
 assert.equal(h.writes.length,0,'nested discovery does not write parameters');
}

{
 const h=fixture({clampBanks:true}),a=h.iroko(),b=h.iroko(),chain=h.unknown();
 chain.slots={FX:{name:'FX',devices:[...Array.from({length:11},()=>h.unknown()),b]}};
 h.setProject([h.track('Origin',a),h.track('Guitar',chain)]);h.press(1);assert.equal(h.target,b,'page through Chain children');
 h.callbacks.midi(0xb0,65,127);h.callbacks.midi(0xb0,65,0);
 h.press(1);assert.equal(h.target,a);h.press(-1);assert.equal(h.target,b);assert.equal(h.pinned.get(),true,'nested target preserves lock');
 const lines=h.sysex.map(s=>Buffer.from(s,'hex')).filter(b=>b[6]===6&&b[7]===53).slice(-3).map(b=>b.subarray(9,-1).toString());
 assert.equal(lines[0],'Guitar','display uses owning track, not FX slot');
 const c=h.synth();chain.slots.FX.devices.push(c);h.changed();h.drain();h.press(1);assert.equal(h.target,a);h.press(1);assert.equal(h.target,b,'later children do not replace the first supported child');
 h.press(-1);assert.equal(h.target,a);chain.slots.FX.devices.splice(11,1);h.changed();h.drain();
 h.press(1);assert.equal(h.target,c,'fresh scanning finds the new first supported child');
 assert.equal(h.writes.length,0);
}
{
 const h=fixture(),plugins=Array.from({length:18},()=>h.iroko()),chain=h.unknown();
 chain.slots={FX:{name:'FX',devices:plugins}};
 h.setProject([h.track('Nested only',chain)]);
 for(const direction of [1,-1,1]){h.press(direction);assert.equal(h.target,plugins[0],'only the first nested instance is a navigation target');}
 // Manually selecting the container still resolves to the track's first plugin.
 h.select(0);h.drain();h.press(-1);assert.equal(h.target,plugins[0]);
}
{
 const h=fixture(),a=h.iroko(),b=h.iroko(),chain=h.unknown();
 chain.slots={FX:{name:'FX',devices:[b]}};
 h.setProject([h.track('A',a),h.track('B',chain),...Array.from({length:3},()=>h.track('Empty',h.unknown()))]);
 h.press(1,false);h.drain(()=>h.context.navigator.status().destination?.child===0);
 chain.slots.FX.devices[0]=h.iroko();h.changed();h.drain();
 assert.equal(h.target,a,'lookalike replacement cannot steal a captured identity');
 assert.equal(h.context.navigator.status().message,'Plugins changed');assert.equal(h.selections.length,0);
}
console.log('PASS: Chain discovery, ordering, empty slots, paging, locks, track labels, edits and stale nested identity');

{
 const h=fixture(),origin=h.iroko(),nested=h.iroko(),chain=h.unknown(),synth=h.synth();
 chain.slots={FX:{name:'FX',devices:[nested]}};
 h.setProject([h.track('Origin',origin),h.track('Destination',chain,synth)]);
 h.press(1,false);h.drain(()=>h.context.navigator.status().destination?.child===0);
 h.project[1].devices.reverse();const state=JSON.stringify(h.project);h.changed();h.drain();
 assert.equal(h.target,origin,'moving a captured Chain must not select a stale first-match target');
 assert.equal(h.context.navigator.status().message,'Plugins changed');
 assert.equal(h.selections.length,0);assert.equal(h.writes.length,0);
 assert.equal(JSON.stringify(h.project),state,'rejecting the stale destination must not change project data');
}

{
 const h=fixture(),a=h.iroko(),b=h.iroko(),empty=h.unknown(),multi=h.unknown(),chain=h.unknown();
 empty.slots={FX:{name:'FX',devices:[]}};
 multi.slots={Pre:{name:'Pre',devices:[h.iroko()]},Post:{name:'Post',devices:[]}};
 chain.slots={FX:{name:'FX',devices:[b]}};
 h.setProject([h.track('Origin',a),h.track('Guitar',empty,multi,chain)]);h.press(1);
 assert.equal(h.target,b,'empty Chain is skipped, ambiguous multi-slot containers excluded');
 assert.equal(h.writes.length,0);
}
