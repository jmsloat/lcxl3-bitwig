const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '07 Vox Chime.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clean.hlx')));
const t = candidate.data.tone, s = source.data.tone, amp = t.dsp0.block2;
assert.equal(candidate.data.meta.name, '04 Modern Clean');
assert.equal(amp['@model'], 'HD2_AmpArchetypeClean');
const numeric = ['Drive', 'Bass', 'Mid', 'Treble', 'Presence', 'ChVol', 'Master', 'Sag', 'Hum', 'Ripple', 'Bias', 'BiasX', 'Depth'];
assert.deepEqual(Object.keys(amp).filter(k => !k.startsWith('@')).sort(), [...numeric, 'BrightSW'].sort());
for (const key of numeric) assert.ok(amp[key] >= 0 && amp[key] <= 1, key);
assert.equal(amp.BrightSW, false);
assert.equal(amp['@cab'], 'cab0');
assert.equal(t.dsp0.cab0['@model'], 'HD2_CabMicIr_4x12CaliV30');
assert.equal(t.dsp0.cab0.Mic, 5);
assert.equal(t.dsp0.outputA.gain, 0, 'independent listening starting point');
assert.equal(amp.ChVol, 0.67);
assert.equal(t.dsp0.block5.Intensity, 0.18, 'keep future modulation subtle');
for (let i = 0; i < t.automation['@assignments'].length; i++) {
    const actual = t.automation['@assignments'][i];
    const expected = structuredClone(s.automation['@assignments'][i]);
    if (i === 2) expected['@param'] = 'dsp0.block2.Mid';
    assert.deepEqual(actual, expected, 'hardware slot ' + i);
    if (!actual) continue;
    const value = actual['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= actual['@min'] && value <= actual['@max']);
}
for (let i = 0; i < 8; i++) {
    const expected = structuredClone(s['snapshot' + i]);
    if (i < 5) expected.controllers.dsp0.block2.Drive['@value'] = [0.30, 0.50, 0.35, 0.28, 0.28][i];
    assert.deepEqual(t['snapshot' + i], expected, 'snapshot roles/bypass ' + i);
}
assert.equal(amp.Drive, t.snapshot0.controllers.dsp0.block2.Drive['@value']);
candidate.data.meta = source.data.meta;
t.dsp0.block2 = s.dsp0.block2;
t.dsp0.cab0 = s.dsp0.cab0;
t.automation = s.automation;
for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
assert.deepEqual(candidate, source, 'no other template changes');
console.log('PASS: Archetype Clean schema, Mid mapping, five snapshots and shared template preservation.');
