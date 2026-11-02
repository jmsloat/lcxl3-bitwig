const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clear v2.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '04 Clear Teemah.hlx')));
const t = candidate.data.tone, s = source.data.tone, pedal = t.dsp0.block1;
assert.equal(candidate.data.meta.name, '04 Clear Teemah');
assert.equal(pedal['@model'], 'HD2_DistTeemah');
const expected = {Gain: 0.2, Bass: 0.15, Treble: 0.1, Clipping: 0, Level: 0.625};
assert.deepEqual(Object.keys(pedal).filter(k => !k.startsWith('@')).sort(), Object.keys(expected).sort());
for (const [key, value] of Object.entries(expected)) assert.equal(pedal[key], value);
for (const key of Object.keys(s.dsp0.block1).filter(k => k.startsWith('@') && k !== '@model')) {
    assert.deepEqual(pedal[key], s.dsp0.block1[key], 'pedal routing/bypass ' + key);
}
const slots = {8: 'Gain', 9: 'Treble', 10: 'Level'};
for (let i = 0; i < t.automation['@assignments'].length; i++) {
    const assignment = t.automation['@assignments'][i];
    const expectedAssignment = structuredClone(s.automation['@assignments'][i]);
    if (slots[i]) expectedAssignment['@param'] = 'dsp0.block1.' + slots[i];
    assert.deepEqual(assignment, expectedAssignment, 'hardware slot ' + i);
    if (!assignment) continue;
    const value = assignment['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= assignment['@min'] && value <= assignment['@max']);
}
t.dsp0.block1 = s.dsp0.block1;
t.automation = s.automation;
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'amp/EQ/cab/mic, effects, five snapshots and accepted gain/levels unchanged');
console.log('PASS: Teemah schema, drive-slot remapping, bypass routing and accepted Clear v2 sound preservation outside pedal.');
