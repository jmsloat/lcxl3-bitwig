const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const baselines = path.join(__dirname, '..', 'presets', 'helix-native');
const current = path.join(baselines, 'current-bank');
const names = [
    '01 Twin Clean.hlx', '02 Princeton Clean.hlx', '03 Jazz Clean.hlx',
    '04 Modern Clean Dynamic Plate.hlx', '05 Hiwatt Clean.hlx', '06 Deluxe Edge.hlx',
    '07 Vox Chime Dynamic Plate.hlx', '08 Matchless Edge.hlx', '09 Dr Z Edge.hlx',
    '10 Divided Edge.hlx', '11 J45 Edge.hlx', '12 Trainwreck Edge Dynamic Plate v2.hlx',
    '13 Litigator Edge.hlx', '14 Hot Rod Rock.hlx', '15 Boogie Lead.hlx',
    '16 Heavy Rhythm.hlx', '17 Orange Edge Dynamic Plate.hlx', '18 Black Parade.hlx'
];
assert.deepEqual(fs.readdirSync(current).sort(), [...names].sort(), 'exactly 18 stable filenames');
for (const name of names) {
    const original = JSON.parse(fs.readFileSync(path.join(baselines, name)));
    const candidate = JSON.parse(fs.readFileSync(path.join(current, name)));
    const old = original.data.tone, t = candidate.data.tone;
    assert.equal(old.dsp0.block2['@type'], 3);
    assert.equal(old.dsp0.block2['@cab'], 'cab0');
    assert.equal(t.dsp0.block2['@type'], 1, name + ' standalone amp');
    assert.equal(t.dsp0.block2['@position'], 2);
    assert.equal(t.dsp0.block2['@path'], 0);
    assert.equal(t.dsp0.block2['@cab'], undefined);
    assert.equal(t.dsp0.cab0, undefined);
    assert.deepEqual(t.dsp0.block6, {...old.dsp0.cab0,
        '@type': 2, '@position': 3, '@path': 0, '@no_snapshot_bypass': false},
    name + ' same cab model, mic, position, distance, cuts, level and enabled state');
    const blocks = Object.entries(t.dsp0).filter(([key]) => /^block\d+$/.test(key));
    assert.deepEqual(blocks.sort((a, b) => a[1]['@position'] - b[1]['@position']).map(([key]) => key),
        ['block0', 'block1', 'block2', 'block6', 'block5', 'block4', 'block3']);
    for (let i = 0; i < 8; i++) {
        const snapshot = t['snapshot' + i];
        if (snapshot['@valid']) {
            assert.equal(snapshot.blocks.dsp0.block6,
                old['snapshot' + i].blocks.dsp0.block2 && old.dsp0.cab0['@enabled']);
            delete snapshot.blocks.dsp0.block6;
        }
        assert.deepEqual(snapshot, old['snapshot' + i], name + ' snapshot ' + i);
    }
    // Reverse only the declared structural changes: every other serialized value
    // must match, including all host assignments and snapshot controllers.
    t.dsp0.block2['@type'] = 3;
    t.dsp0.block2['@position'] = old.dsp0.block2['@position'];
    t.dsp0.block2['@cab'] = 'cab0';
    const cab = {...t.dsp0.block6};
    for (const key of ['@type', '@position', '@path', '@no_snapshot_bypass']) delete cab[key];
    t.dsp0.cab0 = cab;
    delete t.dsp0.block6;
    assert.deepEqual(candidate, original, name + ' all remaining data preserved');
}
console.log('PASS: all 18 separate amp/cab blocks preserve pairings, settings, controls, snapshots and filenames.');
