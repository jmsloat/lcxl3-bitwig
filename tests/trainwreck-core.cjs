const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '12 Trainwreck Edge Bank.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '12 Trainwreck Edge Bank v2.hlx')));
const t = candidate.data.tone, s = source.data.tone;
assert.equal(candidate.data.meta.name, '12 Trainwreck v2');
assert.equal(t.dsp0.block2.Drive, 0.1);
assert.equal(t.dsp0.block2.Master, 0.45);
assert.equal(t.dsp0.block2.ChVol, 0.8);
assert.deepEqual(t.controller.dsp0.block2.Master, {'@controller': 19, '@min': 0, '@max': 1, '@snapshot_disable': false});
for (let i = 0; i < 5; i++) {
    const controls = t['snapshot' + i].controllers.dsp0.block2;
    assert.deepEqual(controls.Master, {'@fs_enabled': false, '@value': i === 0 ? 0.45 : 0.85});
    assert.equal(controls.Drive['@value'], i === 0 ? 0.1 : s['snapshot' + i].controllers.dsp0.block2.Drive['@value']);
    assert.equal(controls.ChVol['@value'], i === 0 ? 0.8 : 0.6);
    delete controls.Master;
    if (i === 0) {
        controls.Drive = s.snapshot0.controllers.dsp0.block2.Drive;
        controls.ChVol = s.snapshot0.controllers.dsp0.block2.ChVol;
    }
}
assert.equal(t.automation['@assignments'][0]['@min'], 0, 'clean Core must be inside hardware gain range');
for (const a of t.automation['@assignments'].filter(Boolean)) {
    const value = a['@param'].split('.').reduce((obj, key) => obj[key], t);
    assert.notEqual(value, undefined);
    assert.ok(value >= a['@min'] && value <= a['@max']);
}
t.automation['@assignments'][0] = s.automation['@assignments'][0];
delete t.controller.dsp0.block2.Master;
t.dsp0.block2 = s.dsp0.block2;
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'only Core gain/master/level, Master recall and gain-knob lower bound change');
console.log('PASS: cleaner Trainwreck Core, gain range, Master recall and preservation of all other sounds.');
