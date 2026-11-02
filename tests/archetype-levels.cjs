const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clear.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clear v2.hlx')));
const t = candidate.data.tone, s = source.data.tone;
assert.equal(candidate.data.meta.name, '04 Modern Clear v2');
assert.equal(t.dsp0.block2.Drive, 0.5);
assert.equal(t.dsp0.block2.ChVol, 0.7);
assert.deepEqual(t.controller.dsp0.block2.ChVol, {'@controller': 19, '@min': 0, '@max': 1, '@snapshot_disable': false});
for (let i = 0; i < 5; i++) {
    const controls = t['snapshot' + i].controllers.dsp0.block2;
    assert.equal(controls.Drive['@value'], [0.5, 0.65, 0.35, 0.28, 0.28][i]);
    assert.deepEqual(controls.ChVol, {'@fs_enabled': false, '@value': [0.7, 0.72, 0.67, 0.67, 0.67][i]});
    delete controls.ChVol;
    controls.Drive = s['snapshot' + i].controllers.dsp0.block2.Drive;
}
delete t.controller.dsp0.block2.ChVol;
t.dsp0.block2.Drive = s.dsp0.block2.Drive;
t.dsp0.block2.ChVol = s.dsp0.block2.ChVol;
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'only requested Core/Pushed gain/level and level recall assignments change');
console.log('PASS: Clear v2 Core/Pushed gain and level lift, all-five volume recall and original tone preservation.');
