// Banks are metadata-only windows. Independent pinned cursors retain identity
// while those windows move; names/parameter IDs are never used as identity.
function createSupportedPluginNavigator(track, device, hooks) {
    var WIDTH = 8, DELAY = 30;
    var bank = host.createTrackBank(1, 0, 0, true), row = bank.getItemAt(0);
    var devices = row.createDeviceBank(WIDTH);
    var revision = 0, total = 0, count = 0, trackOffset = -1, deviceOffset = -1;
    var rowExists = false, rowName = "", slots = [], queue = [], down = {};
    var operation = null, serial = 0, message = "", phase = "idle", lastResult = null;
    var targetTrackName = "", targetPosition = -1;
    function observe(value, callback) { value.addValueObserver(callback); }
    function changed() { revision++; }
    function anchor(id, follow) {
        var t = host.createCursorTrack("lcxl3-nav-" + id, "LCXL3 navigation " + id, 0, 0, follow);
        var d = t.createCursorDevice("lcxl3-nav-" + id, "LCXL3 navigation " + id, 0, CursorDeviceFollowMode.FOLLOW_SELECTION);
        var a = {track: t, device: d, exists: false, position: -1, trackPosition: -1};
        observe(d.exists(), function (v) { a.exists = v; changed(); });
        observe(d.position(), function (v) { a.position = v; changed(); });
        observe(t.position(), function (v) { a.trackPosition = v; changed(); });
        return a;
    }
    var origin = anchor("origin", false), destination = anchor("destination", false);
    var selection = anchor("selection", true), selectionOrigin = anchor("selection-origin", false);
    var originSame = true, selectionSame = true, destinationSame = false, selectedDestination = false, cursorExists = false;
    observe(device.exists(), function (v) { cursorExists = v; });
    function guardChange() {
        if (operation && operation.guarded && ((operation.hadOrigin && !originSame) || (operation.hadSelection && !selectionSame))) cancel("Selection changed");
    }
    observe(origin.device.createEqualsValue(device), function (v) { originSame = v; guardChange(); });
    observe(selectionOrigin.device.createEqualsValue(selection.device), function (v) { selectionSame = v; guardChange(); });
    observe(destination.device.createEqualsValue(device), function (v) { destinationSame = v; changed(); });
    observe(destination.device.createEqualsValue(selection.device), function (v) { selectedDestination = v; changed(); });
    var rowOrigin = false, rowDestination = false;
    observe(row.createEqualsValue(origin.device.getDeviceChain()), function (v) { rowOrigin = v; changed(); });
    observe(row.createEqualsValue(destination.device.getDeviceChain()), function (v) { rowDestination = v; changed(); });
    observe(bank.itemCount(), function (v) {
        if (operation && operation.guarded && total !== v) cancel("Tracks changed");
        total = v; changed();
    });
    observe(bank.scrollPosition(), function (v) { trackOffset = v; changed(); });
    observe(devices.scrollPosition(), function (v) { deviceOffset = v; changed(); });
    observe(devices.itemCount(), function (v) { count = v; changed(); });
    observe(row.exists(), function (v) { rowExists = v; changed(); });
    observe(row.name(), function (v) { rowName = String(v); changed(); });
    observe(device.getDeviceChain().name(), function (v) { targetTrackName = String(v); hooks.invalidate(); });
    observe(device.position(), function (v) { targetPosition = v; hooks.invalidate(); });
    for (var i = 0; i < WIDTH; i++) (function () {
        var proxy = devices.getItemAt(slots.length);
        var slot = {proxy: proxy, exists: false, name: "", ids: {}, destination: false, origin: false};
        slots.push(slot);
        observe(proxy.exists(), function (v) { slot.exists = v; changed(); });
        observe(proxy.name(), function (v) { slot.name = String(v); changed(); });
        proxy.addDirectParameterIdObserver(function (ids) {
            slot.ids = {};
            for (var j = 0; j < ids.length; j++) slot.ids[String(ids[j])] = true;
            changed();
        });
        observe(proxy.createEqualsValue(destination.device), function (v) { slot.destination = v; changed(); });
        observe(proxy.createEqualsValue(origin.device), function (v) { slot.origin = v; changed(); });
    }());
    function capture(a, t, d) {
        // Explicit cursor moves do not select anything in Bitwig's editor.
        a.track.selectChannel(t); a.device.selectDevice(d); a.device.isPinned().set(true);
    }
    function later(fn) {
        var token = operation && operation.id;
        host.scheduleTask(function () { if (operation && operation.id === token) fn(); }, DELAY);
    }
    function settle(fn) {
        var before = revision, tries = 0, quiet = 0;
        function poll() {
            if (++tries > 100) { cancel("Navigation timed out"); return; }
            if (before !== revision) { before = revision; quiet = 0; later(poll); return; }
            if (++quiet < 2) { later(poll); return; }
            fn();
        }
        later(poll);
    }
    function cancel(reason) {
        if (!operation) return;
        var wasHandoff = phase === "handoff", restore = operation.locked;
        operation = null; queue = []; phase = "idle"; message = reason;
        if (wasHandoff) { device.isPinned().set(restore); hooks.end(false); }
        hooks.invalidate();
    }
    function complete() {
        lastResult = {matches: operation.matches, destination: operation.best, locked: operation.locked};
        operation = null; phase = "idle"; hooks.invalidate();
        if (queue.length) start();
    }
    function scroll(t, d, fn) {
        bank.scrollPosition().set(t);
        settle(function () {
            if (trackOffset !== t || !rowExists) { cancel("Tracks changed"); return; }
            devices.scrollPosition().set(d);
            settle(function () {
                // Hosts may clamp the last page to a full window.
                if (deviceOffset < 0 || deviceOffset > d || (count > 0 && d >= deviceOffset + WIDTH)) { cancel("Devices changed"); return; }
                fn();
            });
        });
    }
    function start() {
        if (operation || !queue.length) return;
        operation = {id: ++serial, direction: queue.shift(), locked: hooks.locked(), guarded: false,
            matches: 0, originTrack: -1, originDevice: targetPosition, best: null, bestRank: Infinity};
        phase = "discovery"; message = "";
        capture(origin, track, device);
        capture(selectionOrigin, selection.track, selection.device);
        settle(function () {
            // Empty cursors compare unequal; absence is a valid starting point.
            operation.hadOrigin = origin.exists;
            operation.hadSelection = selectionOrigin.exists;
            operation.guarded = true;
            if ((operation.hadOrigin && !originSame) || (operation.hadSelection && !selectionSame)) { cancel("Selection changed"); return; }
            operation.originPosition = origin.position;
            operation.originTrackPosition = origin.trackPosition;
            locate(0);
        });
    }
    function stableOrigin() {
        if (!operation) return false;
        if ((operation.hadOrigin && (!originSame || !origin.exists || origin.position !== operation.originPosition || origin.trackPosition !== operation.originTrackPosition)) ||
            (operation.hadSelection ? !selectionSame : selection.exists) || (!operation.hadOrigin && cursorExists)) { cancel("Selection changed"); return false; }
        return true;
    }
    function locate(t) {
        if (!stableOrigin()) return;
        if (t >= total) { scan(0, 0); return; }
        scroll(t, 0, function () {
            if (rowOrigin) { operation.originTrack = t; scan(0, 0); }
            else locate(t + 1);
        });
    }
    function rank(t, d) {
        var o = operation, after = t > o.originTrack || (t === o.originTrack && d > o.originDevice);
        var before = t < o.originTrack || (t === o.originTrack && d < o.originDevice);
        // Lexicographic comparison avoids a fixed maximum device count.
        return o.direction > 0 ? (after ? 0 : 1) : (before ? 0 : 1);
    }
    function better(t, d) {
        var b = operation.best, r = rank(t, d);
        if (!b || r < operation.bestRank) return true;
        if (r > operation.bestRank) return false;
        return operation.direction > 0 ? (t < b.t || (t === b.t && d < b.d)) : (t > b.t || (t === b.t && d > b.d));
    }
    function scan(t, offset) {
        if (!stableOrigin()) return;
        if (t >= total) { choose(); return; }
        scroll(t, offset, function () {
            if (!stableOrigin()) return;
            for (var i = Math.max(0, offset - deviceOffset); i < WIDTH && deviceOffset + i < count; i++) {
                var s = slots[i], p = s.exists ? findLCXL3Profile(s.name, s.ids) : null;
                if (p) operation.matches++;
                if (p && better(t, deviceOffset + i)) {
                    operation.best = {t: t, d: deviceOffset + i, name: s.name, profile: p.id, track: rowName};
                    operation.bestRank = rank(t, deviceOffset + i);
                    capture(destination, row, s.proxy);
                }
            }
            if (deviceOffset + WIDTH < count) scan(t, deviceOffset + WIDTH);
            else scan(t + 1, 0);
        });
    }
    function choose() {
        if (!stableOrigin()) return;
        var best = operation.best;
        if (!best) { message = "No supported plugins"; queue = []; complete(); return; }
        var offset = Math.floor(best.d / WIDTH) * WIDTH;
        scroll(best.t, offset, function () {
            var s = slots[best.d - deviceOffset], p = s && s.exists ? findLCXL3Profile(s.name, s.ids) : null;
            // The pinned anchor must still be at the same slot, even if an
            // identical plugin has replaced or moved past it during discovery.
            if (!stableOrigin()) return;
            if (!s || !destination.exists || !rowDestination || !s.destination || s.name !== best.name || !p || p.id !== best.profile) { cancel("Plugins changed"); return; }
            if (s.origin) { message = ""; complete(); return; }
            operation.guarded = false; phase = "handoff";
            hooks.begin();
            device.isPinned().set(false);
            row.selectInEditor(); track.selectChannel(row);
            s.proxy.selectInEditor(); device.selectDevice(s.proxy);
            settle(function () {
                if (!destination.exists || !s.destination || !destinationSame || !selectedDestination || !rowDestination) { cancel("Selection changed"); return; }
                device.isPinned().set(operation.locked);
                settle(function () {
                    if (!destinationSame || !selectedDestination || !destination.exists) { cancel("Selection changed"); return; }
                    hooks.end(true); message = ""; complete();
                });
            });
        });
    }
    return {
        onMidi: function (status, cc, value) {
            if (status !== 0xb0 || (cc !== 102 && cc !== 103)) return false;
            if (!value) down[cc] = false;
            else if (!down[cc]) { down[cc] = true; queue.push(cc === 102 ? 1 : -1); start(); }
            return true;
        },
        busy: function () { return phase === "handoff"; },
        status: function () { return {phase: phase, queued: queue.length, message: message, tracks: total, scannedTrack: trackOffset, deviceOffset: deviceOffset, destination: operation ? operation.best : null, matches: operation ? operation.matches : null, lastResult: lastResult}; },
        display: function (title, subtitle) {
            if (message) hooks.hardware.stationary(message, targetTrackName);
            else hooks.hardware.stationary(targetTrackName || "No track", title + " D" + (targetPosition + 1), subtitle);
        },
        selectionChanged: function () { if (!operation) message = ""; },
        dispose: function () {
            if (operation && phase === "handoff") device.isPinned().set(operation.locked);
            operation = null; queue = [];
        }
    };
}
