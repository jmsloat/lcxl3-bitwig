const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clean Dynamic Plate.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '18 Black Parade.hlx')));
const t = candidate.data.tone, s = source.data.tone, amp = t.dsp0.block2;
assert.equal(candidate.data.meta.name, '18 Black Parade');
assert.equal(amp['@model'], 'HD2_AmpBrit2203');
assert.deepEqual(Object.fromEntries(Object.entries(amp).filter(([k]) => !k.startsWith('@'))),
    {Drive: 0.65, Bass: 0.4, Mid: 0.65, Treble: 0.5, Presence: 0.4, ChVol: 0.6,
        Master: 0.35, Sag: 0.5, Hum: 0.5, Ripple: 0.5, Bias: 0.5, BiasX: 0.5, InputType: true});
assert.equal(amp['@cab'], 'cab0');
assert.deepEqual(t.dsp0.cab0, {'@enabled': true, '@model': 'HD2_CabMicIr_4x12BritV30',
    Angle: 0, Distance: 1, HighCut: 8000, Level: 0, LowCut: 90, Mic: 0, Position: 0.3});
assert.equal(t.dsp0.outputA.gain, 0, 'independent level starting point, no Trainwreck boost');
assert.equal(t.dsp0.block1['@model'], 'HD2_DistTeemah');
assert.equal(t.dsp0.block3['@model'], 'VIC_DynPlate');
for (let i = 0; i < 8; i++) {
    const expected = structuredClone(s['snapshot' + i]);
    if (i < 5) {
        expected.controllers.dsp0.block2.Drive['@value'] = i === 1 ? 0.75 : 0.65;
        expected.controllers.dsp0.block2.ChVol['@value'] = 0.6;
    }
    assert.deepEqual(t['snapshot' + i], expected, 'consistent crunch foundation and existing role/bypass ' + i);
}
for (const a of t.automation['@assignments'].filter(Boolean)) {
    const value = a['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= a['@min'] && value <= a['@max']);
}
t.dsp0.block2 = s.dsp0.block2;
t.dsp0.cab0 = s.dsp0.cab0;
for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'only amp/cab, snapshot amp values and metadata differ');
console.log('PASS: Black Parade-inspired JCM800, consistent five roles and shared effects/control preservation.');
