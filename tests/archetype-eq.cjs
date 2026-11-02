const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '04 Modern Clean.hlx')));
const variants = [
    ['04 Modern Clear', {Bass: 0.4, Mid: 0.5, Treble: 0.55, Presence: 0.55, Depth: 0.2, BrightSW: false}],
    ['04 Modern Glass', {Bass: 0.3, Mid: 0.35, Treble: 0.6, Presence: 0.55, Depth: 0.1, BrightSW: true}]
];
for (const [name, eq] of variants) {
    const candidate = JSON.parse(fs.readFileSync(path.join(folder, name + '.hlx')));
    assert.equal(candidate.data.meta.name, name);
    for (const [key, value] of Object.entries(eq)) {
        assert.equal(candidate.data.tone.dsp0.block2[key], value, name + ': ' + key);
        candidate.data.tone.dsp0.block2[key] = source.data.tone.dsp0.block2[key];
    }
    candidate.data.meta = source.data.meta;
    assert.deepEqual(candidate, source, 'only EQ/bright and metadata change: ' + name);
}
console.log('PASS: two Archetype EQ-only trials preserve cab/mic, gain, levels, effects, snapshots and automation.');
