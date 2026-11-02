const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '12 Trainwreck Edge Bank v2.hlx')));
const candidate = JSON.parse(fs.readFileSync(path.join(folder, '12 Trainwreck Edge Bank v3.hlx')));
const t = candidate.data.tone, s = source.data.tone;
assert.equal(candidate.data.meta.name, '12 Trainwreck v3');
assert.equal(t.dsp0.outputA.gain, 8, 'post-chain level lift, not amp gain');
assert.deepEqual(t.dsp0.block2, s.dsp0.block2, 'clean Core amp voicing unchanged');
for (let i = 0; i < 5; i++) {
    const c = t['snapshot' + i].controllers.dsp0.block2;
    assert.deepEqual(c.Drive, {'@fs_enabled': false, '@value': i === 1 ? 0.2 : 0.1});
    assert.deepEqual(c.Master, {'@fs_enabled': false, '@value': 0.45});
    assert.deepEqual(c.ChVol, {'@fs_enabled': false, '@value': 0.8});
    t['snapshot' + i].controllers.dsp0.block2 = s['snapshot' + i].controllers.dsp0.block2;
}
assert.deepEqual(t.snapshot0.blocks, s.snapshot0.blocks);
assert.equal(t.snapshot2.blocks.dsp0.block1, true, 'Drive still adds Teemah');
assert.equal(t.snapshot3.blocks.dsp0.block5, true, 'Movement retains modulation');
assert.equal(t.snapshot4.blocks.dsp0.block4, true, 'Space retains delay');
t.dsp0.outputA.gain = s.dsp0.outputA.gain;
candidate.data.meta = source.data.meta;
assert.deepEqual(candidate, source, 'only final output, snapshot amp rebasing and metadata change');
console.log('PASS: Trainwreck five-snapshot clean rebasing, post-chain output lift and unchanged tone/effects.');
