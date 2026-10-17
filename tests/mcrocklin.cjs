const assert = require('assert/strict');
const {createHarness} = require('./harness.cjs');
const h = createHarness(), c = h.context, cb = h.callbacks, params = c.MCROCKLIN_PARAMETERS;
const profile = c.LCXL3_PROFILES.find(p => p.id === 'mcrocklin');
assert.equal(params['Acoustic Gain'], 'CONTENTS/PID72bc6aa1');
assert.equal(params['Attacker Drive'], 'CONTENTS/PID73b1ef67');
assert.equal(params['Global Output'], 'CONTENTS/PID68d92fad');
assert.equal(profile.resolveName('@Gain', () => undefined), '', 'unobserved amp selectors cannot bind the wrong amp');
assert.equal(profile.resolveName('@Gain', () => NaN), '');
const prefixes = ['Acoustic', 'Clean', 'Edge', 'Gain Amp'];
for (let amp = 0; amp < 4; amp++) {
    h.selectDevice('McRocklin Suite', params, {[params['Amp Select']]: amp / 3});
    assert.equal(c.activeProfile.id, 'mcrocklin');
    assert.equal(h.writes.length, 0, 'selecting a profile must not enable effects');
    assert.equal(c.resolveName('@Gain'), prefixes[amp] + ' Gain');
    assert.equal(c.resolveName('@Character'), ['Acoustic Profile', 'Clean Presence', 'Edge Boost', 'Gain Amp Presence'][amp]);
    // Exercise all page slots against captured IDs for every amp selection.
    for (let page = 0; page < profile.pages.length; page++) {
        c.page = page; c.needsLayout = true; c.flush();
        for (let index = 0; index < 24; index++) {
            const name = profile.pages[page].rows[Math.floor(index / 8)][index % 8];
            cb.value(params['Amp Select'], amp / 3);
            const resolved = c.resolveName(name), id = params[resolved];
            assert.ok(id, `captured binding for ${resolved}`);
            if (id !== params['Amp Select']) cb.value(id.replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), 0.5);
            cb.midi(0xbf, 77 + index, amp === 3 && id === params['Amp Select'] ? 63 : 65);
            assert.equal(h.writes.pop()[1], id, `${amp}:${page}:${index} writes ${resolved}`);
        }
    }
}
// Amp changes resubscribe dynamic display IDs, including Edge's Boost control.
c.page = 0; cb.value(params['Amp Select'], 2 / 3); c.flush();
assert.ok(cb.observed.includes(params['Edge Gain']));
assert.ok(cb.observed.includes(params['Edge Boost']));
assert.ok(!cb.observed.includes(params['Clean Gain']));
cb.display(params['Edge Gain'], '4.2');
cb.value(params['Edge Gain'], 0.6);
assert.equal(c.parameterText(params['Edge Gain']), '4.2', 'numeric updates do not replace plugin units');
cb.display(params['Delay Time'].replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), '375 ms');
cb.value(params['Delay Time'], 0.4);
assert.equal(c.parameterText(params['Delay Time']), '375 ms');
// A host can quantize selector writes and immediately echo the current state.
// Every detent must still move through all four amps, including with Shift held.
c.page = 0;
for (const fine of [false, true]) {
    cb.midi(0xb6, 63, fine ? 127 : 0);
    cb.value(params['Amp Select'], 0);
    for (let state = 1; state < 4; state++) {
        cb.midi(0xbf, 77, 65);
        const write = h.writes.pop();
        const selected = Math.round(write[2] / (write[3] - 1) * 3);
        assert.equal(selected, state, 'one detent selects the next amp');
        cb.value(params['Amp Select'], selected / 3);
        c.flush();
        assert.equal(c.resolveName('@Gain'), prefixes[state] + ' Gain');
    }
    cb.midi(0xbf, 77, 63);
    const write = h.writes.pop();
    assert.equal(Math.round(write[2] / (write[3] - 1) * 3), 2, 'reverse selects Edge');
}
cb.midi(0xb6, 63, 0);
// Both button layers are binary toggles; amp/model selectors stay on encoders.
for (let layer = 0; layer < 2; layer++) {
    cb.midi(0xb6, 63, layer ? 127 : 0);
    const bindings = layer ? profile.shiftButtons : profile.buttons;
    for (let index = 0; index < 16; index++) {
        const id = params[bindings[index]];
        assert.ok(id); assert.notEqual(id, params['Amp Select']);
        cb.value(id, 0); cb.midi(0xb0, 37 + index, 127);
        assert.deepEqual(h.writes.pop(), ['set', id, 1, 2]);
        cb.midi(0xb0, 37 + index, 127); assert.equal(h.writes.length, 0, 'held buttons toggle once');
        cb.midi(0xb0, 37 + index, 0);
    }
}
cb.midi(0xb6, 63, 0);
c.resetPickup(); cb.value(params['Attacker Level'], 0.8);
cb.midi(0xbf, 5, 0); assert.equal(h.writes.length, 0);
cb.midi(0xbf, 5, 102); assert.equal(h.writes.pop()[1], params['Attacker Level']);
assert.equal(h.presetMessages.length, 0, 'no unverified preset MIDI commands');
c.page = 4;
h.selectDevice('Iroko', c.IROKO_PARAMETERS);
h.selectDevice('Pigments', c.PIGMENTS_PARAMETERS);
h.selectDevice('MCROCKLIN SUITE', params);
assert.equal(c.page, 4, 'page selection survives other profiles');
cb.value(c.IROKO_PARAMETERS['Amp Power'], 0); c.flush();
assert.equal(h.writes.length, 0, 'Iroko always-on rules cannot affect McRocklin');
const missing = {...params}; delete missing['Acoustic Gain'];
h.selectDevice('McRocklin Suite', missing);
assert.equal(c.activeProfile, null, 'matching name requires a complete signature');
h.selectDevice('McRocklin Suite Copy', params);
assert.equal(c.activeProfile, null, 'profile names match exactly');
// The shared cached navigator includes the new profile without plugin-specific changes.
const a = h.plugin('McRocklin Suite', Object.values(params));
const b = h.plugin('Iroko', Object.values(c.IROKO_PARAMETERS));
const d = h.plugin('Pigments', Object.values(c.PIGMENTS_PARAMETERS));
h.setProject([{name:'McRocklin',devices:[a]}, {name:'Iroko',devices:[b]}, {name:'Pigments',devices:[d]}]);
function next() { cb.midi(0xb0, 102, 127); cb.midi(0xb0, 102, 0); h.drain(); }
next(); assert.equal(h.target, b);
next(); assert.equal(h.target, d);
next(); assert.equal(h.target, a); assert.equal(c.activeProfile.id, 'mcrocklin');
assert.equal(c.navigator.status().scans, 1);
assert.equal(c.navigator.status().cacheHits, 2);
console.log('PASS: McRocklin captured IDs, all amp/page bindings, dynamic feedback, native units, both button layers, pickup, isolation and cached navigation.');
