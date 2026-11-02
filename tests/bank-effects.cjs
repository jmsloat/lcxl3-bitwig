const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const files = [
    ['17 Orange Hardware', '17 Orange Edge Bank', '17 Orange Edge'],
    ['07 Vox Chime', '07 Vox Chime Bank', '07 Vox Chime'],
    ['04 Clear Teemah', '04 Modern Clean Bank', '04 Modern Clean']
];
for (const [sourceName, fileName, displayName] of files) {
    const source = JSON.parse(fs.readFileSync(path.join(folder, sourceName + '.hlx')));
    const candidate = JSON.parse(fs.readFileSync(path.join(folder, fileName + '.hlx')));
    const t = candidate.data.tone, s = source.data.tone;
    assert.equal(candidate.data.meta.name, displayName);
    const pedal = t.dsp0.block1, reverb = t.dsp0.block3;
    assert.equal(pedal['@model'], 'HD2_DistTeemah');
    assert.deepEqual(Object.fromEntries(Object.entries(pedal).filter(([k]) => !k.startsWith('@'))),
        {Gain: 0.2, Bass: 0.15, Treble: 0.1, Clipping: 0, Level: 0.625});
    assert.equal(reverb['@model'], 'HD2_ReverbPlate');
    assert.equal(reverb['@type'], 7);
    assert.equal('@stereo' in reverb, false, 'stereo-only legacy Plate omits stereo selector');
    assert.deepEqual(Object.fromEntries(Object.entries(reverb).filter(([k]) => !k.startsWith('@'))),
        {Decay: 0.35, Predelay: 0.02, LowCut: 120, HighCut: 6300, Mix: s.dsp0.block3.Mix, Level: 0});
    for (const key of ['@enabled', '@no_snapshot_bypass', '@path', '@position', '@trails']) {
        assert.deepEqual(reverb[key], s.dsp0.block3[key], key);
    }
    for (const key of ['@enabled', '@no_snapshot_bypass', '@path', '@position', '@stereo', '@type']) {
        assert.deepEqual(pedal[key], s.dsp0.block1[key], key);
    }
    const targets = {8: 'Gain', 9: 'Treble', 10: 'Level'};
    for (let i = 0; i < t.automation['@assignments'].length; i++) {
        const actual = t.automation['@assignments'][i];
        const expected = structuredClone(s.automation['@assignments'][i]);
        if (targets[i]) expected['@param'] = 'dsp0.block1.' + targets[i];
        assert.deepEqual(actual, expected, fileName + ' slot ' + i);
        if (!actual) continue;
        const value = actual['@param'].split('.').reduce((obj, key) => obj[key], t);
        assert.notEqual(value, undefined);
        assert.ok(value >= actual['@min'] && value <= actual['@max']);
    }
    assert.equal(t.snapshot0.controllers.dsp0.block3.Mix['@value'], 0.12);
    assert.equal(t.snapshot4.controllers.dsp0.block3.Mix['@value'], 0.28);
    t.dsp0.block1 = s.dsp0.block1;
    t.dsp0.block3 = s.dsp0.block3;
    t.automation = s.automation;
    candidate.data.meta = source.data.meta;
    assert.deepEqual(candidate, source, 'only pedal/reverb, pedal targets and metadata differ: ' + fileName);
}
console.log('PASS: three Teemah/Plate bank copies preserve amps, cabs, levels, modulation, snapshots and control slots.');
