const assert = require('assert/strict');
const {createHarness} = require('./harness.cjs');
const h = createHarness(), c = h.context, cb = h.callbacks, params = c.PIGMENTS_PARAMETERS;
const profile = c.LCXL3_PROFILES.find(p => p.id === 'pigments');
assert.equal(params['Macro 1'], 'CONTENTS/PID1');
assert.equal(params['F1 Cutoff'], 'CONTENTS/PIDa5');
assert.equal(params['Master Volume'], 'CONTENTS/PID0');
for (const name of [...profile.faders, ...profile.buttons, ...profile.shiftButtons,
    ...profile.pages.flatMap(p => p.rows.flat())]) {
    assert.ok(params[name], `Captured ID required for ${name}`);
}
h.selectDevice('pIgMeNtS', params);
assert.equal(c.activeProfile.id, 'pigments');
assert.equal(h.writes.length, 0, 'selecting Pigments must not force any parameters on');
// Numeric and formatted callbacks may straddle different flushes or arrive in
// either order. Inspect the actual screen messages, not just the formatter.
const cutoffId = params['F1 Cutoff'];
function cutoffScreenText() {
    const messages = h.sysex.map(s => Buffer.from(s, 'hex'))
        .filter(b => b[6] === 6 && b[7] === 17 && b[8] === 1);
    assert.ok(messages.length, 'cutoff encoder has screen feedback');
    return messages[messages.length - 1].subarray(9, -1).toString('ascii');
}
cb.value(cutoffId, 0.25); c.flush();
assert.equal(cutoffScreenText(), '', 'wait for the first plugin label without a percentage flash');
cb.display(cutoffId, '125 Hz'); c.flush();
assert.equal(cutoffScreenText(), '125 Hz', 'native frequency units reach the hardware');
cb.value(cutoffId, 0.3); c.flush();
assert.equal(cutoffScreenText(), '125 Hz', 'numeric-first feedback holds the last plugin label');
cb.display(cutoffId.replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), '250 Hz'); c.flush();
assert.equal(cutoffScreenText(), '250 Hz', 'wrapped feedback updates native units');
cb.display(cutoffId, '500 Hz'); c.flush();
assert.equal(cutoffScreenText(), '500 Hz', 'display-first feedback updates immediately');
cb.value(cutoffId, 0.4); c.flush();
assert.equal(cutoffScreenText(), '500 Hz', 'later numeric feedback does not undo native feedback');
cb.midi(0xbf, 81, 65); c.flush();
assert.equal(cutoffScreenText(), '500 Hz', 'optimistic encoder updates do not insert percentages');
cb.display(cutoffId, '550 Hz'); c.flush();
assert.equal(cutoffScreenText(), '550 Hz');
cb.display(cutoffId, ''); c.flush();
assert.equal(cutoffScreenText(), '550 Hz', 'empty labels do not erase the last plugin value');
for (const [name, label] of [['Env Amp Attack', '12 ms'], ['Master Volume', '-6 dB'], ['LFO 1 Waveform', 'Triangle'], ['Macro 1', '42 %']]) {
    cb.display(params[name], label);
    cb.value(params[name], 0.6);
    assert.equal(c.parameterText(params[name]), label, 'preserve exact plugin text for ' + name);
}
h.writes.length = 0;
// Exercise every encoder slot on every page, including wrapped VST feedback IDs.
for (let page = 0; page < profile.pages.length; page++) {
    c.page = page; c.needsLayout = true; c.flush();
    for (let index = 0; index < 24; index++) {
        const name = profile.pages[page].rows[Math.floor(index / 8)][index % 8];
        const id = params[name];
        cb.value(id.replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), 0.5);
        cb.midi(0xbf, 77 + index, 65);
        const write = h.writes.pop();
        assert.equal(write[1], id, `${page}:${index} writes ${name}`);
        assert.ok(write[2] > 8192, 'encoder increments normalized value');
    }
}
// Shift overlay targets distinct FX bypass controls and displays their true state.
cb.midi(0xb6, 63, 127);
cb.value(params['FX Global Bypass'], 0);
cb.midi(0xb0, 52, 127);
assert.deepEqual(h.writes.pop(), ['set', params['FX Global Bypass'], 1, 2]);
assert.equal(c.pendingButtonFeedback.state, 'Bypassed');
cb.midi(0xb0, 52, 127);
assert.equal(h.writes.length, 0, 'held button toggles once');
cb.midi(0xb0, 52, 0); cb.midi(0xb6, 63, 0);
// Macro faders wait for pickup, then resume pickup after an external change.
c.resetPickup(); cb.value(params['Macro 1'], 0.8);
cb.midi(0xbf, 5, 0); assert.equal(h.writes.length, 0);
cb.midi(0xbf, 5, 102); assert.equal(h.writes.pop()[1], params['Macro 1']);
cb.value(params['Macro 1'], 0.2);
cb.midi(0xbf, 5, 110); assert.equal(h.writes.length, 0);
assert.equal(h.presetMessages.length, 0, 'Pigments has no unverified preset MIDI actions');
h.selectDevice('Iroko', c.IROKO_PARAMETERS);
assert.equal(c.activeProfile.id, 'iroko');
cb.value(c.IROKO_PARAMETERS['Clean Gain'], 0.25);
cb.display(c.IROKO_PARAMETERS['Clean Gain'], '2.5');
assert.equal(c.parameterText(c.IROKO_PARAMETERS['Clean Gain']), '2.5', 'Iroko retains host-formatted feedback');
h.writes.length = 0;
h.selectDevice('Pigments', params);
assert.equal(c.page, 3, 'Pigments page survives an Iroko round trip');
assert.equal(c.parameterText(cutoffId), '', 'device changes discard previous plugin labels');
cb.value(c.IROKO_PARAMETERS['Amp Power'], 0); c.flush();
assert.equal(h.writes.length, 0, 'Iroko always-on rules do not affect Pigments');
const incomplete = {...params}; delete incomplete['F1 Cutoff'];
h.selectDevice('Pigments', incomplete);
assert.equal(c.activeProfile, null, 'a mismatched signature falls back to remotes');
cb.midi(0xbf, 85, 65); assert.equal(h.writes.length, 0);
console.log('PASS: captured Pigments IDs, stable screen units across delayed callbacks, every encoder page, bypass overlay, pickup, signature, profile isolation and page memory.');
