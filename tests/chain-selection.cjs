const assert=require('assert/strict');
const {createHarness}=require('./harness.cjs');
function fixture(options){
 const h=createHarness(options),c=h.context;
 h.iroko=()=>h.plugin('Iroko',Object.values(c.IROKO_PARAMETERS),{[c.IROKO_PARAMETERS['Amp Sel']]:0});
 h.pigments=()=>h.plugin('Pigments',Object.values(c.PIGMENTS_PARAMETERS));
 h.unknown=()=>h.plugin('Unsupported',['unknown']);
 h.chain=(...devices)=>Object.assign(h.unknown(),{name:'Chain',slots:{CHAIN:{name:'CHAIN',devices}}});
 h.track=(name,...devices)=>({name,devices});
 h.lock=()=>{h.callbacks.midi(0xb0,65,127);h.callbacks.midi(0xb0,65,0);};
 return h;
}
{
 const h=fixture(),iroko=h.iroko(),chain=h.chain(h.unknown(),iroko);iroko.enabled=false;
 h.setProject([h.track('Guitar',chain)]);
 assert.equal(h.target,iroko,'selecting a Chain must activate its supported child without a Track press');
 assert.equal(h.context.activeProfile.id,'iroko');assert.equal(h.context.ready,true);
 assert.equal(iroko.enabled,false,'controller selection must not change plugin bypass');
 assert.equal(h.context.navigator.status().lastResult.cancelled,undefined);
 h.callbacks.midi(0xbf,77,65);assert.equal(h.writes.pop()[1],h.context.IROKO_PARAMETERS['Clean Gain']);
}
{
 const h=fixture(),outside=h.iroko(),inside=h.pigments(),later=h.iroko(),chain=h.chain(h.unknown(),inside,later);
 h.setProject([h.track('Guitar',outside,chain),h.track('Other',h.iroko())],0,1);
 assert.equal(h.target,inside,'automatic resolution must stay inside the selected Chain');
 assert.equal(h.context.activeProfile.id,'pigments');
}
for(const childCount of [0,1]){
 const h=fixture(),chain=h.chain(...Array.from({length:childCount},()=>h.unknown()));
 h.setProject([h.track('Guitar',chain),h.track('Other',h.iroko())]);
 assert.equal(h.target,chain);assert.equal(h.context.activeProfile,null);
 const scans=h.context.navigator.status().scans;h.context.flush();h.drain();h.context.flush();h.drain();
 assert.equal(h.context.navigator.status().scans,scans,'an unsupported or empty Chain must not rescan forever');
 assert.equal(h.context.navigator.status().message,'','automatic no-match must stay quietly generic');
}
{
 const h=fixture(),chain=h.chain(h.chain(h.iroko()));chain.slots.AUX={name:'AUX',devices:[h.iroko()]};
 h.setProject([h.track('Guitar',chain)]);assert.equal(h.target,chain);assert.equal(h.context.activeProfile,null);
 delete chain.slots.AUX;h.changed();h.drain();assert.equal(h.target,chain,'automatic resolution must not traverse deeper containers');
}
{
 const h=fixture({slotEntryDelay:180,clampBanks:true}),iroko=h.iroko(),chain=h.chain(...Array.from({length:11},()=>h.unknown()),iroko);
 chain.name='Renamed guitar chain';h.setProject([h.track('Guitar',chain)]);assert.equal(h.target,iroko);
}
{
 const h=fixture(),a=h.iroko(),b=h.pigments(),first=h.chain(a),second=h.chain(b);
 h.setProject([h.track('Guitar',first,second)]);assert.equal(h.target,a);
 h.select(0,1);h.drain();assert.equal(h.target,b,'identically named Chains must resolve by identity');
 h.select(0,0);h.drain();assert.equal(h.target,a);
}
{
 const h=fixture(),a=h.iroko(),b=h.pigments(),chain=h.chain(b);
 h.setProject([h.track('Original',a),h.track('Guitar',chain)]);h.lock();h.select(1);h.drain();
 assert.equal(h.target,a,'selecting a Chain must not displace a locked target');
 h.lock();h.drain();assert.equal(h.target,b,'unlocking on a selected Chain must resolve its child');
}
{
 const h=fixture(),iroko=h.iroko(),chain=h.chain(iroko),other=h.unknown();
 h.setProject([h.track('Guitar',chain),h.track('Other',other)],0,0,false);
 h.drain(()=>h.context.navigator.status().phase==='discovery');h.select(1);h.drain();
 assert.equal(h.target,other,'manual selection must cancel pending automatic resolution');
 assert.equal(h.selections.length,0);assert.equal(h.writes.length,0);
}
{
 const h=fixture(),chain=h.chain(h.iroko());
 h.setProject([h.track('Guitar',chain)],0,0,false);h.drain(()=>h.context.navigator.status().phase==='discovery');
 h.lock();h.drain();assert.equal(h.target,chain);assert.equal(h.pinned.get(),true,'locking during automatic discovery must be respected');
 h.lock();h.drain();assert.equal(h.context.activeProfile.id,'iroko');
}
{
 const h=fixture(),iroko=h.plugin('Iroko',['not-ready']),chain=h.chain(iroko);
 h.setProject([h.track('Guitar',chain)]);assert.equal(h.target,chain);
 iroko.ids=Object.values(h.context.IROKO_PARAMETERS);h.changed();h.drain();
 assert.equal(h.target,iroko,'late child metadata must permit a new automatic attempt');
}
for(const index of [0,9]){
 const h=fixture({clampBanks:true}),iroko=h.plugin('Iroko',['not-ready']);
 const chain=h.chain(...Array.from({length:index},()=>h.unknown()),iroko,...Array.from({length:14},()=>h.unknown()));
 h.setProject([h.track('Guitar',chain)]);assert.equal(h.target,chain);
 const scans=h.context.navigator.status().scans;h.context.flush();h.drain();assert.equal(h.context.navigator.status().scans,scans);
 iroko.ids=Object.values(h.context.IROKO_PARAMETERS);h.changed();h.drain();
 assert.equal(h.target,iroko,'a paged no-match scan must keep the first recognized child observable for late metadata');
}
{
 const h=fixture(),chain=h.chain(h.iroko());h.setProject([h.track('Guitar',chain)],0,0,false);
 h.drain(()=>h.context.navigator.status().tracks===1);h.context.exit();h.drain();
 assert.equal(h.target,chain,'a pending automatic request must not run after controller disposal');
 assert.equal(h.selections.length,0);assert.equal(h.writes.length,0);
}
console.log('PASS: selected Chain automatically activates its first supported child; scope, bypass, generic fallback, identity, paging, locks, cancellation and late metadata.');
