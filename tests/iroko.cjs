const assert = require('assert/strict');
const {createHarness}=require('./harness.cjs');
const h=createHarness(), {context,callbacks,writes,midi,sysex,presetMessages}=h;
assert.equal(writes.length,0, 'init never changes plugin parameters');
const params = context.IROKO_PARAMETERS;
function select(name) {
    h.selectDevice(name, params);
    for (const id of Object.values(params)) callbacks.value(id,0.5);
    callbacks.value(params['Amp Sel'],0);
    context.flush();
}
select('Iroko');

assert.deepEqual(Array.from(context.EFFECT_COLORS.drive),[40,127,0],'Drive uses a brighter green interpretation of the pedal');
assert.deepEqual(Array.from(context.EFFECT_COLORS.multimod),[0,127,70],'MultiMod follows the teal pedal');
assert.deepEqual(Array.from(context.EFFECT_COLORS.reverb),[127,30,5],'Reverb follows the coral UI accents');
for (const page of context.PAGES) {
    assert.equal(page.rows.length,3);
    for (const row of page.rows) {
        assert.equal(row.length,8);
        for (const name of row) {
            if (!name) continue;
            for (const prefix of ['Clean','Crunch']) assert.ok(params[name.startsWith('@') ? prefix+' '+name.slice(1) : name], name);
        }
    }
}
for (const name of [...context.FADERS,...context.BUTTONS,...context.SHIFT_BUTTONS]) if (name) assert.ok(params[context.resolveName(name)], name);
select('Iroko');
const gainId = params['Clean Gain'];
assert.ok(callbacks.observed.includes(gainId),'initial display ID is subscribed');
assert.ok(callbacks.observed.includes(gainId.replace('CONTENTS/','CONTENTS/ROOT_GENERIC_MODULE/')),'live display ID is subscribed');

callbacks.value(gainId.replace('CONTENTS/','CONTENTS/ROOT_GENERIC_MODULE/'),0.25);
callbacks.display(gainId.replace('CONTENTS/','CONTENTS/ROOT_GENERIC_MODULE/'),'25.0 %');
assert.equal(context.normalized[gainId],0.25,'live wrapped IDs update the initial parameter ID');
assert.equal(context.displayed[gainId],'25.0 %','wrapped display updates reach the control');
assert.equal(context.parameterText(gainId),'25.0 %');
callbacks.value(gainId.replace('CONTENTS/','CONTENTS/ROOT_GENERIC_MODULE/'),0.3);
assert.equal(context.parameterText(gainId),'30.0 %','stale formatted labels fall back to the live numeric value');
callbacks.display(gainId,'');
assert.equal(context.parameterText(gainId),'30.0 %','empty host labels never blank live feedback');
callbacks.value(gainId,0.5);
assert.equal(writes.length,0, 'selection and feedback never change parameters');
callbacks.midi(0xbf,77,65);
assert.deepEqual(writes.pop(),['set',params['Clean Gain'],Math.round((0.5+8/1023)*16383),16384]);
callbacks.midi(0xb6,63,127); callbacks.midi(0xbf,77,63);
assert.deepEqual(writes.pop(),['set',params['Clean Gain'],Math.round((0.5+7/1023)*16383),16384]);
callbacks.midi(0xb6,63,0);
callbacks.midi(0xbf,5,0); assert.equal(writes.length,0,'fader waits for pickup');
callbacks.midi(0xbf,5,70);
assert.deepEqual(writes.pop(),['set',params['Drive Level'],70,128]);
callbacks.value(params['Drive Level'],0.95);
callbacks.midi(0xbf,5,75); assert.equal(writes.length,0,'automation change rearms pickup');
callbacks.midi(0xb0,37,127);
assert.deepEqual(writes.pop(),['set',params['Drive Power'],0,2]);
context.flush();
function overlayFields() {
    return sysex.slice(-4).slice(1,3).map(message => {
        const bytes = message.match(/../g).map(v=>parseInt(v,16));
        assert.equal(bytes[6],6); assert.equal(bytes[7],54);
        return String.fromCharCode(...bytes.slice(9,-1));
    });
}
assert.deepEqual(overlayFields(),['Drive','Off']);
assert.ok(sysex.at(-1).endsWith('04367ff7'),'temporary button overlay is triggered');
const afterButtonFeedback = sysex.length;
callbacks.midi(0xb0,37,127); assert.equal(writes.length,0,'held button toggles once');
context.flush(); assert.equal(sysex.length,afterButtonFeedback,'held button does not retrigger feedback');
callbacks.midi(0xb0,37,0);
callbacks.midi(0xb0,50,127); writes.length=0;
context.flush();
assert.deepEqual(overlayFields(),['Amp Channel','Crunch'],'amp overlay survives layout refresh');
callbacks.midi(0xbf,77,65);
assert.deepEqual(writes.pop(),['set',params['Crunch Gain'],Math.round((0.5+8/1023)*16383),16384]);
callbacks.midi(0xb0,107,127); callbacks.midi(0xb0,107,0); context.flush();
callbacks.midi(0xbf,80,65);
assert.deepEqual(writes.pop(),['set',params['Comp Amount'],Math.round((0.5+8/1023)*16383),16384]);
callbacks.midi(0xb6,30,6); callbacks.midi(0xbf,80,65); assert.equal(writes.length,0,'custom mode is ignored');
callbacks.midi(0xb6,30,2);
select('Different plugin'); callbacks.midi(0xbf,80,65); callbacks.midi(0xb0,38,127);
assert.equal(writes.length,0,'unrelated plugins are protected');
select('Iroko');
callbacks.value(params['Comp Amount'],1); callbacks.midi(0xbf,80,65);
assert.deepEqual(writes.pop(),['set',params['Comp Amount'],16383,16384]);
callbacks.value(params['Comp Amount'],0); callbacks.midi(0xbf,80,63);
assert.deepEqual(writes.pop(),['set',params['Comp Amount'],0,16384]);
callbacks.value(params['Comp Amount'],NaN); callbacks.midi(0xbf,80,65);
assert.equal(writes.length,0,'unknown values cannot be incremented');
select('Iroko');
for (let i=0;i<context.BUTTONS.length;i++) {
    if (!context.BUTTONS[i]) continue;
    const id = context.parameterId(context.BUTTONS[i]);
    callbacks.value(id,0);
    callbacks.midi(0xb0,37+i,127); context.flush();
    const fields=overlayFields();
    assert.ok(fields[0].length>0,'every button has a label');
    assert.equal(fields[1],i===13?'Crunch':'On','every button reports the resulting state');
    callbacks.midi(0xb0,37+i,0);
}
writes.length=0;
context.page=1; context.needsLayout=true; context.flush();
for (const [cc,name] of [[77,'Tremolo Rate'],[78,'Tremolo Depth'],[79,'Tremolo Ramp']]) {
    const id=params[name]; callbacks.value(id,0.5); callbacks.midi(0xbf,cc,65);
    assert.deepEqual(writes.pop(),['set',id,Math.round((0.5+8/1023)*16383),16384]);
}
callbacks.midi(0xb6,63,127);
callbacks.value(params['KillGate Power'],0); callbacks.midi(0xb0,42,127);
assert.deepEqual(writes.pop(),['set',params['KillGate Power'],1,2]);
context.flush(); assert.deepEqual(overlayFields(),['KillGate','On']);
callbacks.midi(0xb0,42,0); callbacks.midi(0xb6,63,0);
for (const name of context.PAGES.flatMap(p=>p.rows.flat()).concat(context.BUTTONS,context.SHIFT_BUTTONS)) assert.ok(!/wah/i.test(name),'no wah bindings remain');
// RGB feedback follows live values while preserving effect hues across pages.
const drive=params['Drive Gain'];
function lastRgb() { return sysex.at(-1).match(/../g).map(x=>parseInt(x,16)).slice(9,-1); }
callbacks.value(drive,0); context.setParameterLed(24,'Drive Gain',drive,false); const low=lastRgb();
callbacks.value(drive,0.5); context.setParameterLed(24,'Drive Gain',drive,false); const mid=lastRgb();
callbacks.value(drive,1); context.setParameterLed(24,'Drive Gain',drive,false); const high=lastRgb();
assert.ok(low[0]>0 && low[0]<mid[0] && mid[0]<high[0],'brightness increases from a visible low-value floor');
assert.deepEqual(high,Array.from(context.EFFECT_COLORS.drive,c=>Math.round(c*0.60)));
assert.ok(mid[0]<high[0]*0.5,'lower values stay dimmer with the curved brightness response');
context.setParameterLed(25,'Drive Tone',drive,false); assert.deepEqual(lastRgb(),high,'drive controls share a hue');
assert.equal(context.effectGroup('@Gain'),'amp');
assert.notEqual(context.effectGroup('Comp Amount'),context.effectGroup('Drive Gain'));
context.setParameterLed(24,'Comp Amount',params['Comp Amount'],false); assert.notDeepEqual(lastRgb(),high,'page remapping changes the LED group');
const count=sysex.length; context.setParameterLed(24,'Comp Amount',params['Comp Amount'],false);
assert.equal(sysex.length,count,'unchanged colors are not retransmitted');
callbacks.value(params['Drive Power'],0); context.setParameterLed(37,'Drive Power',params['Drive Power'],true); const off=lastRgb();
callbacks.value(params['Drive Power'],1); context.setParameterLed(37,'Drive Power',params['Drive Power'],true); const on=lastRgb();
assert.ok(off[0]<on[0],'button off/on uses dim/bright group color');
assert.deepEqual(off,Array.from(context.EFFECT_COLORS.drive,c=>Math.round(c*0.15)),'off buttons retain a visible group color');
assert.deepEqual(on,Array.from(context.EFFECT_COLORS.drive,c=>Math.round(c*1.00)),'on buttons use full intensity');
context.setParameterLed(37,'Drive Power',null,true); assert.deepEqual(lastRgb(),[0,0,0],'unavailable controls are dark');
callbacks.value(drive.replace('CONTENTS/','CONTENTS/ROOT_GENERIC_MODULE/'),0.8); context.flush();
const drivePackets=sysex.map(m=>m.match(/../g).map(x=>parseInt(x,16))).filter(b=>b[6]===1 && b[7]===83 && b[8]===24);
assert.deepEqual(drivePackets.at(-1).slice(9,-1),Array.from(context.EFFECT_COLORS.drive,c=>Math.round(c*(0.03+0.57*Math.pow(0.8,1.5)))),'live plugin callback refreshes LED brightness');
writes.length=0;
for (const name of context.ALWAYS_ON) {
    assert.ok(!context.BUTTONS.includes(name) && !context.SHIFT_BUTTONS.includes(name),'section switches are absent from both layouts');
    callbacks.value(params[name],0);
}
context.flush();
assert.equal(writes.length,6,'all six disabled sections are enabled');
assert.deepEqual(writes.map(w=>w[1]).sort(),Array.from(context.ALWAYS_ON,n=>params[n]).sort());
writes.length=0; context.flush(); assert.equal(writes.length,0,'enabled sections are not repeatedly written');
callbacks.midi(0xb0,43,127); callbacks.midi(0xb0,43,127); callbacks.midi(0xb0,43,0);
callbacks.midi(0xb0,44,127); callbacks.midi(0xb0,44,0);
assert.deepEqual(presetMessages,[[176,43,127],[176,44,127]],'preset buttons send one Iroko MIDI command per press');
assert.equal(writes.length,0,'preset buttons never load or overwrite Bitwig device presets');
callbacks.midi(0xb6,63,127);
assert.equal(context.buttonBinding(8),'FuzzBoy Power'); assert.equal(context.buttonBinding(14),'@Bright');
callbacks.midi(0xb6,63,0);
assert.equal(context.buttonBinding(8),'FuzzBoy Power');
callbacks.name('Different plugin'); callbacks.midi(0xb0,43,127); callbacks.midi(0xb0,43,0);
assert.equal(presetMessages.length,2,'preset commands are blocked when Iroko is not selected');
callbacks.value(params['Amp Power'],0); context.flush();
assert.equal(writes.length,0,'section enforcement is disabled on unrelated plugins');
callbacks.ids([]); callbacks.midi(0xbf,80,65);
assert.equal(writes.length,0,'unavailable IDs cannot be written');
context.exit();
assert.deepEqual(midi.at(-1),[159,12,0]);
for (const message of sysex) {
    const bytes = message.replaceAll(' ','').match(/../g).map(v=>parseInt(v,16));
    assert.equal(bytes[0],240); assert.equal(bytes.at(-1),247);
    assert.ok(bytes.slice(1,-1).every(v=>v>=0 && v<128));
}
console.log('PASS: captured mapping IDs; relative/fine encoders; amp switching; pickup and automation; button edges; pages; custom-mode and device guards; SysEx; grouped RGB/value brightness; exit cleanup.');
