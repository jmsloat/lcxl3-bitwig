const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '07 Vox Chime Dynamic Plate.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '02 Princeton Clean.hlx')));
const t = candidate.data.tone, s = source.data.tone;
assert.equal(candidate.data.meta.name, '02 Princeton');
assert.deepEqual(t.dsp0.block2, {...Object.fromEntries(Object.entries(s.dsp0.block2).filter(([k]) => k.startsWith('@'))),
    '@model': 'HD2_AmpUSPrincess', Drive: 0.3, Bass: 0.25, Mid: 0.6, Treble: 0.6,
    Presence: 0, ChVol: 0.8, Master: 1, Sag: 0.5, Hum: 0.5, Ripple: 0.5, Bias: 0.52, BiasX: 0.5});
assert.deepEqual(t.dsp0.cab0, {'@enabled': true, '@model': 'HD2_CabMicIr_1x10USPrincess',
    Mic: 11, Position: 0.63, Distance: 2, Angle: 45, LowCut: 80, HighCut: 8000, Level: 0});
assert.equal(t.automation['@assignments'][2]['@param'], 'dsp0.block2.Mid');
for (let i = 0; i < 8; i++) {
    const expected = structuredClone(s['snapshot' + i]);
    if (i < 5) expected.controllers.dsp0.block2.Drive['@value'] = i === 1 ? 0.5 : 0.3;
    assert.deepEqual(t['snapshot' + i], expected, 'snapshot ' + i);
}
for (const a of t.automation['@assignments'].filter(Boolean)) {
    const value = a['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= a['@min'] && value <= a['@max']);
}
t.dsp0.block2 = s.dsp0.block2;
t.dsp0.cab0 = s.dsp0.cab0;
t.automation['@assignments'][2] = s.automation['@assignments'][2];
for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'only intended amp, cab, gain and Mid mapping differences');
console.log('PASS: Princeton amp/cab, Mid mapping, coherent snapshots and shared bank preservation.');
