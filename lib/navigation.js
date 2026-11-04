// Track navigation scans only as far as the next eligible track. Each track
// contributes its first supported device in forward chain order.
function createSupportedPluginNavigator(track, device, hooks) {
    var WIDTH = 8, DELAY = 30;
    var bank = host.createTrackBank(1, 0, 0, true), row = bank.getItemAt(0);
    var devices = row.createDeviceBank(WIDTH);
    var revision = 0, total = 0, count = 0, trackOffset = -1, deviceOffset = -1;
    var rowExists = false, rowName = "", rowPosition = -1, slots = [], queue = [], down = {};
    var pendingCheck = null, operation = null, serial = 0, message = "", phase = "idle", lastResult = null, scans = 0;
    var targetTrackName = "", targetPosition = -1;
    var selectedSlots = [], selectedRevision = 0, attemptedRevision = -1, followScheduled = false, disposed = false;
    function observe(value, callback) { value.addValueObserver(callback); }
    function changed() { revision++; }
    function anchor(id, follow) {
        // Follow mode is only a creation default. Version private IDs so old
        // saved FOLLOW_SELECTION cursors cannot override FIRST_DEVICE defaults.
        var cursorId = (follow ? "lcxl3-nav-" : "lcxl3-nav-first-v1-") + id;
        var t = host.createCursorTrack(cursorId, "LCXL3 navigation " + id, 0, 0, follow);
        var mode = follow ? CursorDeviceFollowMode.FOLLOW_SELECTION : CursorDeviceFollowMode.FIRST_DEVICE;
        var d = t.createCursorDevice(cursorId, "LCXL3 navigation " + id, 0, mode);
        var a = {track: t, device: d, exists: false, position: -1, trackPosition: -1, pinned: false};
        observe(d.exists(), function (v) { a.exists = v; changed(); });
        observe(d.position(), function (v) { a.position = v; changed(); });
        observe(t.position(), function (v) { a.trackPosition = v; changed(); });
        observe(d.isPinned(), function (v) { a.pinned = v; });
        return a;
    }
    var origin = anchor("origin", false), destination = anchor("destination", false);
    var childCursor = anchor("slot-discovery", false), container = anchor("slot-parent", false);
    var attempted = anchor("selected-container-v1", false), attemptedSame = false;
    var selection = anchor("selection", true), selectionOrigin = anchor("selection-origin", false);
    var originSame = true, selectionSame = true, destinationSame = false, selectedDestination = false, cursorExists = false;
    function guardChange() {
        if (operation && operation.guarded && ((operation.hadOrigin && !originSame) || (operation.hadSelection && !selectionSame))) cancel("Selection changed");
    }
    observe(device.exists(), function (v) { cursorExists = v; requestAuto(true); });
    observe(device.slotNames(), function (v) { selectedSlots = Array.prototype.slice.call(v); requestAuto(true); });
    observe(attempted.device.createEqualsValue(device), function (v) { attemptedSame = v; requestAuto(false); });
    observe(origin.device.createEqualsValue(device), function (v) { originSame = v; guardChange(); });
    observe(selectionOrigin.device.createEqualsValue(selection.device), function (v) { selectionSame = v; guardChange(); });
    observe(destination.device.createEqualsValue(device), function (v) { destinationSame = v; changed(); });
    observe(destination.device.createEqualsValue(selection.device), function (v) { selectedDestination = v; changed(); });
    var pinned = false, rowOrigin = false, rowDestination = false;
    observe(device.isPinned(), function (v) {
        pinned = v;
        if (v && operation && operation.kind === "selected-container" && phase === "discovery") cancel("Selection changed");
        requestAuto(true);
    });
    observe(row.createEqualsValue(origin.track), function (v) { rowOrigin = v; changed(); });
    observe(row.createEqualsValue(destination.track), function (v) { rowDestination = v; changed(); });
    observe(bank.itemCount(), function (v) {
        if (operation && operation.guarded && total !== v) cancel("Tracks changed");
        total = v; changed();
    });
    observe(bank.scrollPosition(), function (v) { trackOffset = v; changed(); });
    observe(devices.scrollPosition(), function (v) { deviceOffset = v; changed(); });
    observe(devices.itemCount(), function (v) { count = v; changed(); });
    observe(row.exists(), function (v) { rowExists = v; changed(); });
    observe(row.name(), function (v) { rowName = String(v); changed(); });
    observe(row.position(), function (v) { rowPosition = v; changed(); });
    observe(track.name(), function (v) { targetTrackName = String(v); hooks.invalidate(); });
    observe(device.position(), function (v) { targetPosition = v; hooks.invalidate(); requestAuto(true); });
    observe(track.position(), function () { requestAuto(true); });
    var children = {bank: childCursor.device.createSiblingsDeviceBank(WIDTH), slots: [], offset: -1, count: 0};
    observe(children.bank.scrollPosition(), function (v) { children.offset = v; changed(); });
    observe(children.bank.itemCount(), function (v) { children.count = v; changed(); });
    function metadata(deviceBank, target, includeSlots) {
        for (var i = 0; i < WIDTH; i++) (function () {
            var proxy = deviceBank.getItemAt(target.length);
            var slot = {proxy: proxy, exists: false, name: "", ids: {}, destination: false, origin: false, chains: []};
            target.push(slot);
            if (includeSlots) {
                observe(proxy.createEqualsValue(childCursor.device), function (v) { slot.childParent = v; changed(); });
                observe(proxy.createEqualsValue(container.device), function (v) { slot.container = v; changed(); });
                observe(proxy.slotNames(), function (v) { slot.chains = Array.prototype.slice.call(v); changed(); });
            }
            observe(proxy.exists(), function (v) { slot.exists = v; changed(); if (!includeSlots) requestAuto(true); });
            observe(proxy.name(), function (v) { slot.name = String(v); changed(); if (!includeSlots) requestAuto(true); });
            proxy.addDirectParameterIdObserver(function (ids) {
                slot.ids = {};
                for (var j = 0; j < ids.length; j++) slot.ids[String(ids[j])] = true;
                changed();
                if (!includeSlots) requestAuto(true);
            });
            observe(proxy.createEqualsValue(destination.device), function (v) { slot.destination = v; changed(); });
            observe(proxy.createEqualsValue(origin.device), function (v) { slot.origin = v; changed(); });
        }());
    }
    metadata(devices, slots, true);
    metadata(children.bank, children.slots, false);
    function requestAuto(metadataChanged) {
        if (metadataChanged) selectedRevision++;
        if (disposed || operation || followScheduled || !cursorExists || pinned || selectedSlots.length !== 1) return;
        followScheduled = true;
        host.scheduleTask(function () {
            followScheduled = false;
            if (disposed || operation || queue.length || !cursorExists || pinned || hooks.locked() || hooks.supported() || selectedSlots.length !== 1) return;
            if (attemptedSame && attemptedRevision === selectedRevision) return;
            begin("selected-container", 0);
        }, DELAY);
    }
    function capture(a, t, d, done, present) {
        // FIRST_DEVICE moves are private and auto-pin an assigned target.
        // Pinning an unassigned cursor is a host no-op, so position first.
        a.track.selectChannel(t);
        if (present === false) { done(); return; }
        a.device.selectDevice(d);
        a.device.isPinned().set(true);
        waitFor(function () { return a.pinned; }, done, "Cursor pin timed out");
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
    // Run readiness checks after a host update batch, never from an individual
    // observer: name, IDs, equality and values can arrive in different orders.
    function waitFor(test, done, reason) {
        var token = operation.id, tries = 0;
        function check() {
            if (!operation || operation.id !== token || pendingCheck !== check) return;
            if (test()) { pendingCheck = null; done(); }
        }
        pendingCheck = check;
        function poll() {
            if (!operation || operation.id !== token || pendingCheck !== check) return;
            check();
            if (pendingCheck !== check) return;
            if (++tries > 100) { cancel(reason); return; }
            later(poll);
        }
        later(poll);
    }
    function feedback(title, detail) {
        // Use the temporary overlay so a lingering knob display cannot hide
        // navigation progress or the selected destination.
        hooks.hardware.sysex([4, 54, 1]);
        hooks.hardware.text(54, 0, title);
        hooks.hardware.text(54, 1, detail || "");
        hooks.hardware.sysex([4, 54, 127]);
    }
    function cancel(reason) {
        if (!operation) return;
        var wasHandoff = phase === "handoff", restore = operation.locked;
        lastResult = {cancelled: reason, phase: phase, matches: operation.matches, destination: operation.best, locked: restore};
        if (operation.kind === "selected-container") attemptedRevision = selectedRevision;
        pendingCheck = null; operation = null; queue = []; phase = "idle"; message = reason;
        if (wasHandoff) { device.isPinned().set(restore); hooks.end(false); }
        feedback(reason, targetTrackName); hooks.invalidate();
    }
    function complete() {
        lastResult = {matches: operation.matches, destination: operation.best, locked: operation.locked};
        if (operation.kind === "selected-container") attemptedRevision = selectedRevision;
        if (operation.kind !== "selected-container" || operation.best) {
            feedback(message || (operation.best ? operation.best.name : "No supported plugins"), operation.best ? operation.best.track : "");
        }
        pendingCheck = null; operation = null; phase = "idle"; hooks.invalidate();
        if (queue.length) start();
    }
    function scroll(t, d, fn) {
        bank.scrollPosition().set(t);
        settle(function () {
            if (trackOffset !== t || !rowExists) { cancel("Tracks changed"); return; }
            devices.scrollPosition().set(d);
            settle(function () {
                if (deviceOffset < 0 || deviceOffset > d || (count > 0 && d >= deviceOffset + WIDTH)) { cancel("Devices changed"); return; }
                fn();
            });
        });
    }
    function start() {
        if (operation || !queue.length) return;
        begin("track", queue.shift());
    }
    function begin(kind, direction) {
        operation = {id: ++serial, kind: kind, direction: direction, locked: hooks.locked(), hadOrigin: cursorExists,
            hadSelection: selection.exists, guarded: false, matches: 0, visited: 0, best: null};
        phase = "discovery"; message = "";
        if (kind === "track") feedback(direction > 0 ? "Finding next plugin" : "Finding previous plugin", targetTrackName);
        capture(origin, track, device, function () {
            capture(selectionOrigin, selection.track, selection.device, function () {
                settle(function () {
                    operation.guarded = true;
                    operation.originPosition = origin.position;
                    operation.originTrackPosition = origin.trackPosition;
                    if (!stableOrigin()) return;
                    if (kind === "selected-container") {
                        capture(attempted, origin.track, origin.device, function () {
                            waitFor(function () { return attemptedSame; }, function () { locate(0); }, "Selection changed");
                        });
                    } else locate(0);
                });
            }, operation.hadSelection);
        }, operation.hadOrigin);
    }
    function stableOrigin() {
        if (!operation) return false;
        if ((operation.hadOrigin && (!originSame || !origin.exists || origin.position !== operation.originPosition || origin.trackPosition !== operation.originTrackPosition)) ||
            (operation.hadSelection ? !selectionSame : selection.exists) || (!operation.hadOrigin && cursorExists)) { cancel("Selection changed"); return false; }
        return true;
    }
    function locate(t) {
        if (!stableOrigin()) return;
        if (t >= total && operation.kind === "selected-container") { finishSelected(); return; }
        if (t >= total) { scan(operation.direction > 0 ? 0 : total - 1); return; }
        scroll(t, 0, function () {
            if (rowOrigin && operation.kind === "selected-container") selectedContainer(t);
            else if (rowOrigin) scan((t + operation.direction + total) % total);
            else locate(t + 1);
        });
    }
    function finishSelected() {
        function end() { scans++; message = ""; complete(); }
        if (operation.readinessPage === undefined || children.offset === operation.readinessPage) { end(); return; }
        // Keep the first recognized-but-unready child's page observed, not an
        // unrelated final page. Late parameter IDs can then request a retry.
        children.bank.scrollPosition().set(operation.readinessPage);
        settle(function () {
            if (!stableOrigin()) return;
            var location = operation.selectedLocation;
            for (var j = 0; j < WIDTH && children.offset + j < children.count; j++) {
                if (accept(children.slots[j], {t: location.t, d: location.d, path: [location.d, 0, children.offset + j],
                    chain: location.chain, child: children.offset + j})) return;
            }
            end();
        });
    }
    function selectedContainer(t) {
        var d = operation.originPosition;
        scroll(t, Math.floor(d / WIDTH) * WIDTH, function () {
            if (!stableOrigin()) return;
            var parent = slots[d - deviceOffset];
            if (!parent || !parent.origin || parent.chains.length !== 1) { finishSelected(); return; }
            var name = parent.chains[0];
            operation.selectedLocation = {t: t, d: d, chain: name};
            openSlot(parent, name, function (opened) {
                if (opened) visitChildren(t, d, name, finishSelected); else finishSelected();
            });
        });
    }
    function scan(t) {
        if (!stableOrigin()) return;
        if (operation.visited >= total) {
            scans++; message = "No supported plugins"; queue = []; complete(); return;
        }
        operation.visited++;
        visitTrack(t, 0, function () { scan((t + operation.direction + total) % total); });
    }
    function openSlot(parent, name, done) {
        capture(container, row, parent.proxy, function () {
            capture(childCursor, row, parent.proxy, function () {
                waitFor(function () { return container.exists && parent.container && childCursor.exists && parent.childParent; }, function () {
                    childCursor.device.selectFirstInSlot(name);
                    var tries = 0;
                    function entered() {
                        if (!stableOrigin()) return;
                        // Empty slot entry is a no-op; allow the full readiness
                        // window rather than mistaking quiet observers for completion.
                        if (parent.childParent) {
                            if (++tries > 100) { done(false); return; }
                            later(entered); return;
                        }
                        children.bank.scrollPosition().set(0);
                        settle(function () { done(true); });
                    }
                    later(entered);
                }, "Chain slot unavailable");
            });
        });
    }
    function visitTrack(t, offset, done) {
        scroll(t, offset, function () {
            var i = Math.max(0, offset - deviceOffset);
            function next() {
                if (!stableOrigin()) return;
                if (i >= WIDTH || deviceOffset + i >= count) {
                    if (deviceOffset + WIDTH < count) visitTrack(t, deviceOffset + WIDTH, done); else done();
                    return;
                }
                var s = slots[i++], d = deviceOffset + i - 1;
                if (accept(s, {t: t, d: d, path: [d]})) return;
                if (s.chains.length !== 1) { next(); return; }
                var name = s.chains[0];
                openSlot(s, name, function (opened) {
                    if (!opened) { next(); return; }
                    visitChildren(t, d, name, next);
                });
            }
            next();
        });
    }
    function visitChildren(t, d, name, done) {
        function page(offset) {
            children.bank.scrollPosition().set(offset);
            settle(function () {
                if (!stableOrigin()) return;
                if (children.offset < 0 || children.offset > offset || offset >= children.offset + WIDTH) { cancel("Devices changed"); return; }
                for (var j = Math.max(0, offset - children.offset); j < WIDTH && children.offset + j < children.count; j++) {
                    if (accept(children.slots[j], {t: t, d: d, path: [d, 0, children.offset + j], chain: name, child: children.offset + j})) return;
                    if (operation.kind === "selected-container" && operation.readinessPage === undefined && children.slots[j].exists &&
                        LCXL3_PROFILES.some(function (p) { return p.matchNames.some(function (n) { return n.toLowerCase() === children.slots[j].name.toLowerCase(); }); })) {
                        operation.readinessPage = children.offset;
                    }
                }
                if (children.offset + WIDTH < children.count) page(children.offset + WIDTH); else done();
            });
        }
        page(0);
    }
    function accept(s, entry) {
        var profile = s.exists ? findLCXL3Profile(s.name, s.ids) : null;
        if (!profile) return false;
        entry.name = s.name; entry.profile = profile.id; entry.track = rowName; entry.trackPosition = rowPosition;
        operation.best = entry; operation.matches = 1; scans++;
        // Stop scanning immediately. Keep these bank windows fixed until the
        // destination identity, profile, selection and lock all acknowledge.
        capture(destination, row, s.proxy, function () {
            function valid() {
                var p = s.exists ? findLCXL3Profile(s.name, s.ids) : null;
                var parent = slots[entry.d - deviceOffset];
                var parentValid = entry.child === undefined || (container.exists && parent && parent.container &&
                    container.position === entry.d && container.trackPosition === entry.trackPosition);
                return destination.exists && rowDestination && s.destination && rowPosition === entry.trackPosition &&
                    parentValid &&
                    destination.position === (entry.child === undefined ? entry.d : entry.child) &&
                    s.name === entry.name && p && p.id === entry.profile;
            }
            waitFor(function () { return destination.exists && rowDestination && s.destination; }, function () {
                handoff(entry, s, valid);
            }, "Plugins changed");
        });
        return true;
    }
    function handoff(best, slot, validTarget) {
        if (!stableOrigin()) return;
        if (!validTarget()) { cancel("Plugins changed"); return; }
        if (operation.hadOrigin && slot.origin) { message = ""; complete(); return; }
        operation.guarded = false; phase = "handoff";
        hooks.begin();
        device.isPinned().set(false);
        row.selectInEditor(); track.selectChannel(row);
        slot.proxy.selectInEditor(); device.selectDevice(slot.proxy);
        waitFor(function () {
            if (!validTarget()) { cancel("Plugins changed"); return false; }
            return destinationSame && selectedDestination && hooks.ready(best.profile);
        }, function () {
            device.isPinned().set(operation.locked);
            waitFor(function () {
                if (!validTarget() || !destinationSame || !selectedDestination) { cancel("Selection changed"); return false; }
                return pinned === operation.locked;
            }, function () { hooks.end(true); message = ""; complete(); }, "Lock timed out");
        }, "Selection changed");
    }
    return {
        onMidi: function (status, cc, value, rescan) {
            if (status !== 0xb0 || (cc !== 102 && cc !== 103)) return false;
            if (!value) down[cc] = false;
            else if (!down[cc]) {
                if (operation && operation.kind === "selected-container" && phase === "discovery") cancel("Selection changed");
                down[cc] = true; queue.push(cc === 102 ? 1 : -1); start();
            }
            return true;
        },
        flush: function () { if (pendingCheck) pendingCheck(); },
        busy: function () { return phase === "handoff"; },
        status: function () { return {cachedPlugins: null, scans: scans, cacheHits: 0, phase: phase, queued: queue.length, message: message, tracks: total, scannedTrack: trackOffset, deviceOffset: deviceOffset, destination: operation ? operation.best : null, matches: operation ? operation.matches : null, lastResult: lastResult}; },
        display: function (title, subtitle) {
            hooks.hardware.sendCC(0xb0, 102, total > 0 ? 3 : 0);
            hooks.hardware.sendCC(0xb0, 103, total > 0 ? 3 : 0);
            if (message) hooks.hardware.stationary(message, targetTrackName);
            else hooks.hardware.stationary(targetTrackName || "No track", title + " D" + (targetPosition + 1), subtitle);
        },
        selectionChanged: function () { if (!operation) message = ""; requestAuto(true); },
        dispose: function () {
            disposed = true;
            if (operation && phase === "handoff") device.isPinned().set(operation.locked);
            pendingCheck = null; operation = null; queue = [];
        }
    };
}
