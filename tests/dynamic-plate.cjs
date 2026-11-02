const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const files = [
    ['04 Modern Clean Bank', '04 Modern Clean Dynamic Plate', '04 Modern DP'],
    ['07 Vox Chime Bank', '07 Vox Chime Dynamic Plate', '07 Vox DP'],
    ['17 Orange Edge Bank', '17 Orange Edge Dynamic Plate', '17 Orange DP'],
    ['12 Trainwreck Edge Bank v3', '12 Trainwreck Edge Dynamic Plate', '12 Trainwreck DP']
];
for (const [sourceName, fileName, displayName] of files) {
    const source = JSON.parse(fs.readFileSync(path.join(folder, sourceName + '.hlx')));
    const candidate = JSON.parse(fs.readFileSync(path.join(folder, fileName + '.hlx')));
    const t = candidate.data.tone, s = source.data.tone, reverb = t.dsp0.block3;
    assert.equal(candidate.data.meta.name, displayName);
    assert.equal(reverb['@model'], 'VIC_DynPlate');
    assert.equal(reverb['@type'], 7);
    assert.equal(reverb['@stereo'], true);
    assert.equal('Predelay' in reverb, false, 'Dynamic Plate uses PreDelay, not legacy Predelay');
    assert.deepEqual(Object.fromEntries(Object.entries(reverb).filter(([k]) => !k.startsWith('@'))),
        {Decay: 2, PreDelay: 0.02, Damping: 6000, MatrFreq: 0.25, VarDelayAmpl: 0.15,
            Mix: s.dsp0.block3.Mix, BassFreq: 100, BassBoost: 0, LowCut: 120, HighCut: 8000, Level: 0});
    for (const key of ['@enabled', '@no_snapshot_bypass', '@path', '@position', '@trails']) {
        assert.deepEqual(reverb[key], s.dsp0.block3[key], key);
    }
    assert.equal(t.dsp0.block1['@model'], 'HD2_DistTeemah');
    assert.deepEqual(t.automation, s.automation);
    for (let i = 0; i < 8; i++) assert.deepEqual(t['snapshot' + i], s['snapshot' + i]);
    if (sourceName.includes('Trainwreck')) assert.equal(t.dsp0.outputA.gain, 8, 'clipping report not silently treated as fixed');
    t.dsp0.block3 = s.dsp0.block3;
    candidate.data.meta = source.data.meta;
    assert.deepEqual(candidate, source, 'only reverb and metadata change: ' + fileName);
}
console.log('PASS: four Dynamic Plate copies preserve amp tones, levels, snapshots, Teemah and hardware assignments.');
