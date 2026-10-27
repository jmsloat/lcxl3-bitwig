const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {createHarness} = require('./harness.cjs');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '17 Orange Hardware.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '07 Vox Chime.hlx')));
const t = candidate.data.tone, s = source.data.tone;
assert.equal(candidate.data.meta.name, '07 Vox Chime');
assert.equal(candidate.schema, source.schema);
assert.equal(candidate.version, source.version);
const amp = t.dsp0.block2;
assert.equal(amp['@model'], 'HD2_AmpEssexA30');
const ampKeys = ['Drive', 'Bass', 'Cut', 'Treble', 'Presence', 'ChVol', 'Master', 'Sag', 'Hum', 'Ripple', 'Bias', 'BiasX'];
assert.deepEqual(Object.keys(amp).filter(k => !k.startsWith('@')).sort(), ampKeys.sort());
for (const key of ampKeys) assert.ok(amp[key] >= 0 && amp[key] <= 1, key);
assert.equal(amp['@cab'], 'cab0');
assert.equal(t.dsp0.cab0['@model'], 'HD2_CabMicIr_2x12BlueBell');
assert.equal(t.dsp0.cab0.Mic, 5, 'modern 121 Ribbon index');
assert.equal(t.dsp0.outputA.gain, 0, 'start uncalibrated, not with Orange output boost');
assert.equal(amp.ChVol, 0.74);
assert.equal(t.dsp0.block5.Intensity, 0.18);
assert.ok(t.dsp0.block5.Intensity < s.dsp0.block5.Intensity);
const assignments = t.automation['@assignments'];
const originalAssignments = s.automation['@assignments'];
for (let i = 0; i < assignments.length; i++) {
    const expected = structuredClone(originalAssignments[i]);
    if (i === 2) expected['@param'] = 'dsp0.block2.Cut';
    assert.deepEqual(assignments[i], expected, 'slot ' + i);
    if (!assignments[i]) continue;
    const value = assignments[i]['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined, 'every assignment resolves');
    assert.ok(value >= assignments[i]['@min'] && value <= assignments[i]['@max']);
}
const gains = [0.25, 0.4, 0.3, 0.23, 0.23];
for (let i = 0; i < 8; i++) {
    const expected = structuredClone(s['snapshot' + i]);
    if (i < 5) expected.controllers.dsp0.block2.Drive['@value'] = gains[i];
    assert.deepEqual(t['snapshot' + i], expected, 'snapshot role and bypass ' + i);
}
const h = createHarness();
assert.equal(h.context.HELIX_BANK_KNOBS[2].name, 'Mid / Cut');
h.selectDevice('Helix Native', h.context.HELIX_NATIVE_PARAMETERS);
assert.equal(h.context.activeProfile.parameters['Mid / Cut'], h.context.HELIX_NATIVE_PARAMETERS['Knob 03']);
// Only the declared voicing, level, modulation, assignment and metadata differ.
candidate.data.meta = source.data.meta;
t.dsp0.block2 = s.dsp0.block2;
t.dsp0.cab0 = s.dsp0.cab0;
t.dsp0.outputA = s.dsp0.outputA;
t.dsp0.block5 = s.dsp0.block5;
t.automation = s.automation;
for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
assert.deepEqual(candidate, source, 'shared effects, routing and controller schema preserved');
console.log('PASS: Vox schema, Cut slot, five roles, subtle modulation, independent level start and template preservation.');
