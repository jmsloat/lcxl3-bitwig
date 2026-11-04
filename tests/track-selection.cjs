const assert = require('assert/strict');
const {createHarness} = require('./harness.cjs');
function fixture(options) {
    const h = createHarness(options), c = h.context;
    h.mcrocklin = () => h.plugin('McRocklin Suite', Object.values(c.MCROCKLIN_PARAMETERS));
    h.iroko = () => h.plugin('Iroko', Object.values(c.IROKO_PARAMETERS));
    h.killgate = () => h.plugin('Killgate', ['killgate/threshold']);
    h.track = (name, ...devices) => ({name, devices});
    h.chain = (...devices) => Object.assign(h.killgate(), {name: 'Chain', slots: {FX: {name: 'FX', devices}}});
    h.lock = () => { h.callbacks.midi(0xb0, 65, 127); h.callbacks.midi(0xb0, 65, 0); };
    return h;
}
{
    const h = fixture(), gate = h.killgate(), suite = h.mcrocklin(), later = h.iroko();
    suite.enabled = false;
    h.setProject([h.track('Guitar', gate, suite, later)]);
    assert.equal(h.target, suite, 'startup must skip Killgate and select the first profiled serial effect');
    assert.equal(h.context.activeProfile.id, 'mcrocklin');
    assert.equal(h.context.ready, true);
    assert.equal(suite.enabled, false);
    assert.equal(h.writes.length, 0);
    assert.equal(h.context.navigator.status().lastResult.cancelled, undefined);
    h.select(0, 0); h.drain();
    assert.equal(h.target, gate, 'a deliberate same-track unsupported device selection remains generic');
    h.select(0, 2); h.drain();
    assert.equal(h.target, later, 'a deliberate same-track supported device selection is preserved');
}
{
    const h = fixture(), origin = h.iroko(), suite = h.mcrocklin();
    h.setProject([h.track('Same name', origin), h.track('Same name', h.killgate(), suite)]);
    h.select(1); h.drain(); assert.equal(h.target, suite, 'track identity, not its name, triggers automatic resolution');
    h.select(0); h.drain(); h.select(1); h.drain(); assert.equal(h.target, suite);
    const scans = h.context.navigator.status().scans;
    h.context.flush(); h.drain(); assert.equal(h.context.navigator.status().scans, scans);
}
{
    const h = fixture(), nested = h.mcrocklin(), later = h.iroko();
    h.setProject([h.track('Guitar', h.killgate(), h.chain(nested), later)]);
    assert.equal(h.target, nested, 'forward order includes one Chain layer before later serial effects');
}
for (const empty of [false, true]) {
    const h = fixture(), gate = h.killgate();
    h.setProject([h.track('No match', ...(empty ? [] : [gate])), h.track('Other', h.iroko())]);
    assert.equal(h.target, empty ? null : gate, 'automatic resolution must never skip to another track');
    const scans = h.context.navigator.status().scans;
    h.context.flush(); h.drain(); h.context.flush(); h.drain();
    assert.equal(h.context.navigator.status().scans, scans, 'no-match resolution settles without polling');
    assert.equal(h.context.navigator.status().message, '');
    assert.equal(h.selections.length, 0); assert.equal(h.writes.length, 0);
}
for (const index of [1, 10]) {
    const h = fixture({clampBanks: true}), suite = h.plugin('McRocklin Suite', ['not-ready']);
    h.setProject([h.track('Guitar', ...Array.from({length: index}, h.killgate), suite,
        ...Array.from({length: 14}, h.killgate))]);
    assert.equal(h.target.name, 'Killgate');
    const scans = h.context.navigator.status().scans;
    h.context.flush(); h.drain(); assert.equal(h.context.navigator.status().scans, scans);
    suite.ids = Object.values(h.context.MCROCKLIN_PARAMETERS); h.changed(); h.drain();
    assert.equal(h.target, suite, 'late serial-plugin IDs must retry from the retained readiness page');
}
{
    const h = fixture(), origin = h.iroko(), suite = h.mcrocklin();
    h.setProject([h.track('Origin', origin), h.track('Guitar', h.killgate(), suite)]);
    h.lock(); h.select(1); h.drain(); assert.equal(h.target, origin);
    h.lock(); h.drain(); assert.equal(h.target, suite, 'unlock resolves the selected track');
}
{
    const h = fixture({privatePinDelay: 100}), gate = h.killgate(), suite = h.mcrocklin();
    h.setProject([h.track('Guitar', gate, suite), h.track('Other', h.killgate())], 0, 0, false);
    h.drain(() => h.context.navigator.status().phase === 'discovery');
    h.select(0, 1); h.drain();
    assert.equal(h.target, suite, 'manual device changes during discovery are respected');
    assert.equal(h.selections.length, 0); assert.equal(h.writes.length, 0);
}
{
    const h = fixture(), suite = h.mcrocklin(), other = h.iroko();
    h.setProject([h.track('Guitar', h.killgate(), suite), h.track('Other', other)], 0, 0, false);
    h.drain(() => h.context.navigator.status().phase === 'discovery');
    h.callbacks.midi(0xb0, 102, 127); h.callbacks.midi(0xb0, 102, 0); h.drain();
    assert.equal(h.target, other, 'explicit Track navigation takes priority over automatic resolution');
}
for (const startup of [false, true]) {
    const h = fixture(), first = h.mcrocklin(), later = h.iroko();
    const tracks = [h.track('Origin', h.iroko()), h.track('Guitar', h.killgate(), first, later)];
    h.setProject(tracks, startup ? 1 : 0, startup ? 2 : 0);
    if (!startup) { h.select(1, 2); h.drain(); }
    assert.equal(h.target, first, 'new-track entry chooses the first profile even if a later supported header was selected');
}
for (const during of ['discovery', 'handoff']) {
    const h = fixture({pinDelay: 100, privatePinDelay: 100}), a = h.mcrocklin(), b = h.mcrocklin();
    h.setProject([h.track('A', h.killgate(), a), h.track('B', h.killgate(), b)], 0, 0, false);
    h.drain(() => h.context.navigator.status().phase === during);
    h.select(1); h.drain();
    assert.equal(h.target, b, 'a newer track request during ' + during + ' must resolve after cancelling the old operation');
    assert.equal(h.writes.length, 0);
}
{
    const h = fixture(), suite = h.mcrocklin();
    h.setProject([h.track('Guitar', h.killgate(), suite)], 0, 0, false);
    h.drain(() => h.context.navigator.status().phase === 'discovery');
    h.lock(); h.drain(); assert.equal(h.target.name, 'Killgate');
    h.lock(); h.drain(); assert.equal(h.target, suite, 'unlock retries an interrupted automatic track request');
}
console.log('PASS: selected tracks skip unsupported serial effects, preserve first-match order, locks, identity, manual selection, no-match scope and late metadata.');
