const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '07 Vox Chime Dynamic Plate.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '08 Matchless Edge.hlx')));
const t = candidate.data.tone, s = source.data.tone, amp = t.dsp0.block2;
assert.equal(candidate.data.meta.name, '08 Matchless');
assert.equal(amp['@model'], 'HD2_AmpMatchstickCh1');
assert.deepEqual(Object.fromEntries(Object.entries(amp).filter(([k]) => !k.startsWith('@'))),
    {Ch1Drive: 0.3, Bass: 0.4, Cut: 0.4, Treble: 0.55, Presence: 0, ChVol: 0.7,
        Master: 1, Sag: 0.58, Hum: 0.5, Ripple: 0.5, Bias: 0.55, BiasX: 0.5});
assert.equal(amp['@cab'], 'cab0');
assert.deepEqual(t.dsp0.cab0, {'@enabled': true, '@model': 'HD2_CabMicIr_2x12MatchH30',
    Angle: 0, Distance: 1, HighCut: 8000, Level: 0, LowCut: 80, Mic: 0, Position: 0.56});
assert.deepEqual(t.controller.dsp0.block2, {Ch1Drive: s.controller.dsp0.block2.Drive});
assert.equal(t.automation['@assignments'][0]['@param'], 'dsp0.block2.Ch1Drive');
assert.equal(t.automation['@assignments'][2]['@param'], 'dsp0.block2.Cut');
assert.equal(t.dsp0.block1['@model'], 'HD2_DistTeemah');
assert.equal(t.dsp0.block3['@model'], 'VIC_DynPlate');
assert.equal(t.dsp0.outputA.gain, 0);
for (let i = 0; i < 8; i++) {
    const expected = structuredClone(s['snapshot' + i]);
    if (i < 5) {
        const c = expected.controllers.dsp0.block2;
        c.Ch1Drive = {...c.Drive, '@value': i === 1 ? 0.45 : 0.3};
        delete c.Drive;
    }
    assert.deepEqual(t['snapshot' + i], expected, 'same foundation and correct gain key: ' + i);
}
for (const a of t.automation['@assignments'].filter(Boolean)) {
    const value = a['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= a['@min'] && value <= a['@max']);
}
t.dsp0.block2 = s.dsp0.block2;
t.dsp0.cab0 = s.dsp0.cab0;
t.controller.dsp0.block2 = s.controller.dsp0.block2;
t.automation['@assignments'][0] = s.automation['@assignments'][0];
for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'shared effects, levels/output, routing and other assignments preserved');
console.log('PASS: Matchless model, Ch1Drive remapping, Cut slot, five roles and shared bank preservation.');
