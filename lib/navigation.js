// Banks are metadata-only windows. Independent pinned cursors retain identity
// while those windows move; names/parameter IDs are never used as identity.
function createSupportedPluginNavigator(track, device, hooks) {
    var WIDTH = 8, DELAY = 30, RETAINED = 16;
    var bank = host.createTrackBank(1, 0, 0, true), row = bank.getItemAt(0);
    var devices = row.createDeviceBank(WIDTH);
    var revision = 0, total = 0, count = 0, trackOffset = -1, deviceOffset = -1;
    var rowExists = false, rowName = "", slots = [], queue = [], down = {};
    var nestedCatalog = false;
    var pendingCheck = null;
    var operation = null, serial = 0, message = "", phase = "idle", lastResult = null;
    var targetTrackName = "", targetPosition = -1;
    var catalog = null, knownLocation = null, catalogProfiles = 0, scans = 0, cacheHits = 0;
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
    var activeChild = null;
    var selection = anchor("selection", true), selectionOrigin = anchor("selection-origin", false);
    var originSame = true, selectionSame = true, destinationSame = false, selectedDestination = false, cursorExists = false;
    observe(device.exists(), function (v) { cursorExists = v; });
    function guardChange() {
        if (operation && operation.guarded && ((operation.hadOrigin && !originSame) || (operation.hadSelection && !selectionSame))) cancel("Selection changed");
    }
    observe(origin.device.createEqualsValue(device), function (v) { originSame = v; guardChange(); });
    observe(selectionOrigin.device.createEqualsValue(selection.device), function (v) { selectionSame = v; guardChange(); });
    observe(destination.device.createEqualsValue(device), function (v) { destinationSame = v; if (!operation && !v) knownLocation = null; changed(); });
    observe(destination.device.createEqualsValue(selection.device), function (v) { selectedDestination = v; changed(); });
    // Bitwig proxies must be created during init. Reuse a bounded pool rather
    // than allocating a cursor for every device in an arbitrarily large project.
    var retained = [];
    for (var r = 0; r < RETAINED; r++) (function (index) {
        var a = anchor("cached-" + index, false);
        a.name = ""; a.trackName = ""; a.ids = {}; a.destination = false; a.origin = false;
        observe(a.device.name(), function (v) { a.name = String(v); });
        observe(a.track.name(), function (v) { a.trackName = String(v); });
        a.device.addDirectParameterIdObserver(function (ids) {
            a.ids = {};
            for (var j = 0; j < ids.length; j++) a.ids[String(ids[j])] = true;
        });
        observe(a.device.createEqualsValue(destination.device), function (v) { a.destination = v; });
        observe(a.device.createEqualsValue(origin.device), function (v) { a.origin = v; });
        retained.push(a);
    }(r));
    var rowPosition = -1;
    observe(row.position(), function (v) { rowPosition = v; changed(); });
    var pinned = false;
    observe(device.isPinned(), function (v) { pinned = v; });
    var rowOrigin = false, rowDestination = false;
    observe(row.createEqualsValue(origin.track), function (v) { rowOrigin = v; changed(); });
    observe(row.createEqualsValue(destination.track), function (v) { rowDestination = v; changed(); });
    observe(bank.itemCount(), function (v) {
        if (operation && operation.guarded && total !== v) cancel("Tracks changed");
        if (total !== v) { catalog = null; knownLocation = null; }
        total = v; changed();
    });
    observe(bank.scrollPosition(), function (v) { trackOffset = v; changed(); });
    observe(devices.scrollPosition(), function (v) { deviceOffset = v; changed(); });
    observe(devices.itemCount(), function (v) { if (!operation && count !== v) catalog = null; count = v; changed(); });
    observe(row.exists(), function (v) { rowExists = v; changed(); });
    observe(row.name(), function (v) { rowName = String(v); changed(); });
    observe(track.name(), function (v) { targetTrackName = String(v); hooks.invalidate(); });
    observe(device.position(), function (v) { targetPosition = v; hooks.invalidate(); });
    function metadata(deviceBank, target, includeSlots) {
      for (var i = 0; i < WIDTH; i++) (function () {
        var proxy = deviceBank.getItemAt(target.length);
        var slot = {proxy: proxy, exists: false, name: "", ids: {}, destination: false, origin: false};
        target.push(slot);
        slot.chains = [];
        if (includeSlots) {
            var chain = proxy.getCursorSlot();
            slot.children = {bank: chain.createDeviceBank(WIDTH), slots: [], offset: -1, count: 0, name: ""};
            observe(chain.name(), function (v) { slot.children.name = String(v); changed(); });
            observe(slot.children.bank.scrollPosition(), function (v) { slot.children.offset = v; changed(); });
            observe(slot.children.bank.itemCount(), function (v) {
                if (!operation && slot.children.count !== v) catalog = null;
                slot.children.count = v; changed();
            });
            metadata(slot.children.bank, slot.children.slots, false);
        }
        if (includeSlots) observe(proxy.slotNames(), function (v) {
            slot.chains = Array.prototype.slice.call(v); if (!operation) catalog = null; changed();
        });
        observe(proxy.exists(), function (v) { if (!operation && slot.exists !== v) catalog = null; slot.exists = v; changed(); });
        observe(proxy.name(), function (v) { if (!operation && slot.name !== String(v)) catalog = null; slot.name = String(v); changed(); });
        proxy.addDirectParameterIdObserver(function (ids) {
            var signature = Array.prototype.join.call(ids, "\n");
            if (!operation && slot.signature !== signature) catalog = null;
            slot.signature = signature;
            slot.ids = {};
            for (var j = 0; j < ids.length; j++) slot.ids[String(ids[j])] = true;
            changed();
        });
        observe(proxy.createEqualsValue(destination.device), function (v) { slot.destination = v; changed(); });
        observe(proxy.createEqualsValue(origin.device), function (v) { slot.origin = v; changed(); });
      }());
    }
    metadata(devices, slots, true);
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
        lastResult = {cancelled: reason, phase: phase, matches: operation.matches, destination: operation.best, locked: restore,
            validation: {destinationExists: destination.exists, destinationSame: destinationSame,
                selectedDestination: selectedDestination, rowDestination: rowDestination,
                slotDestination: operation.best && slots[operation.best.d - deviceOffset] ? slots[operation.best.d - deviceOffset].destination : false}};
        pendingCheck = null; operation = null; queue = []; phase = "idle"; message = reason;
        knownLocation = null;
        if (wasHandoff) { device.isPinned().set(restore); hooks.end(false); }
        feedback(reason, targetTrackName);
        hooks.invalidate();
    }
    function complete() {
        lastResult = {matches: operation.matches, destination: operation.best, locked: operation.locked, cached: !!operation.fromCache};
        if (operation.best && !message) knownLocation = {t: operation.best.t, d: operation.best.d, path: operation.best.path};
        feedback(message || (operation.best ? operation.best.name : "No supported plugins"), operation.best ? operation.best.track : "");
        pendingCheck = null; operation = null; phase = "idle"; hooks.invalidate();
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
            matches: 0, entries: [], originPath: knownLocation ? knownLocation.path : null, originTrack: knownLocation ? knownLocation.t : -1, originDevice: targetPosition, best: null, bestRank: Infinity};
        phase = "discovery"; message = "";
        feedback(operation.direction > 0 ? "Finding next plugin" : "Finding previous plugin", targetTrackName);
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
            if (catalog && !nestedCatalog && catalogProfiles === LCXL3_PROFILES.length && knownLocation) useCatalog();
            else locate(0);
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
        if (t >= total) { if (catalog && !nestedCatalog && catalogProfiles === LCXL3_PROFILES.length) useCatalog(); else scan(0, 0); return; }
        scroll(t, 0, function () {
            if (rowOrigin) {
                operation.originTrack = t;
                visitTrack(t, 0, function (s, location) {
                    if (s.origin) operation.originPath = location.path;
                }, function () {
                    if (catalog && !nestedCatalog && catalogProfiles === LCXL3_PROFILES.length) useCatalog(); else scan(0, 0);
                });
            }
            else locate(t + 1);
        });
    }
    function comparePath(a, b) {
        for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
        return a.length - b.length;
    }
    function rank(t, d, path) {
        var o = operation, relative = t === o.originTrack ? comparePath(path || [d], o.originPath || [o.originDevice]) : t - o.originTrack;
        return o.direction > 0 ? (relative > 0 ? 0 : 1) : (relative < 0 ? 0 : 1);
    }
    function better(t, d, path) {
        var b = operation.best, r = rank(t, d, path);
        if (!b || r < operation.bestRank) return true;
        if (r > operation.bestRank) return false;
        var relative = t === b.t ? comparePath(path || [d], b.path || [b.d]) : t - b.t;
        return operation.direction > 0 ? relative < 0 : relative > 0;
    }
    // A single-slot container (including Chain) has no ambiguous UI slot
    // selection. Its slot bank gives direct access without moving any cursor.
    // Multi-slot devices and deeper containers are deliberately not traversed.
    function openSlot(parent, name, offset, done) {
        activeChild = parent.children;
        waitFor(function () { return parent.chains.length === 1 && activeChild.name === name; }, function () {
            activeChild.bank.scrollPosition().set(offset);
            settle(function () { done(true); });
        }, "Chain slot unavailable");
    }
    function visitTrack(t, offset, visit, done) {
        scroll(t, offset, function () {
            var i = Math.max(0, offset - deviceOffset);
            function next() {
                if (!stableOrigin()) return;
                if (i >= WIDTH || deviceOffset + i >= count) {
                    if (deviceOffset + WIDTH < count) visitTrack(t, deviceOffset + WIDTH, visit, done); else done();
                    return;
                }
                var s = slots[i++], d = deviceOffset + i - 1, chains = s.chains.length === 1 ? s.chains.slice() : [], chainIndex = 0;
                visit(s, {t: t, d: d, path: [d]});
                function nextChain() {
                    if (chainIndex >= chains.length) { next(); return; }
                    nestedCatalog = true;
                    var n = chainIndex++, name = chains[n];
                    openSlot(s, name, 0, function (opened) {
                        if (!opened) { nextChain(); return; }
                        function page(offset) {
                            activeChild.bank.scrollPosition().set(offset);
                            settle(function () {
                                if (activeChild.offset < 0 || activeChild.offset > offset || offset >= activeChild.offset + WIDTH) { cancel("Devices changed"); return; }
                                for (var j = Math.max(0, offset - activeChild.offset); j < WIDTH && activeChild.offset + j < activeChild.count; j++) {
                                    var child = activeChild.slots[j];
                                    visit(child, {t: t, d: d, path: [d, n, activeChild.offset + j], chain: name, child: activeChild.offset + j});
                                }
                                if (activeChild.offset + WIDTH < activeChild.count) page(activeChild.offset + WIDTH); else nextChain();
                            });
                        }
                        page(0);
                    });
                }
                nextChain();
            }
            next();
        });
    }
    function useCatalog() {
        operation.fromCache = true; operation.matches = catalog.length; cacheHits++;
        for (var i = 0; i < catalog.length; i++) {
            var entry = catalog[i];
            if (better(entry.t, entry.d, entry.path)) { operation.best = entry; operation.bestRank = rank(entry.t, entry.d, entry.path); }
        }
        choose();
    }
    function rebuildCatalog() {
        catalog = null; operation.fromCache = false; operation.best = null;
        operation.bestRank = Infinity; operation.matches = 0; operation.entries = [];
        scan(0, 0);
    }
    function scan(t, offset) {
        if (!stableOrigin()) return;
        if (t === 0 && offset === 0) nestedCatalog = false;
        if (t >= total) {
            catalog = operation.entries.slice(); catalogProfiles = LCXL3_PROFILES.length; scans++;
            choose(); return;
        }
        visitTrack(t, offset, function (s, entry) {
            var p = s.exists ? findLCXL3Profile(s.name, s.ids) : null;
            if (!p) return;
            operation.matches++;
            entry.name = s.name; entry.profile = p.id; entry.track = rowName; entry.trackPosition = rowPosition;
            if (operation.entries.length < retained.length) {
                entry.retained = operation.entries.length;
                capture(retained[entry.retained], row, s.proxy);
            }
            operation.entries.push(entry);
            if (better(entry.t, entry.d, entry.path)) {
                operation.best = entry; operation.bestRank = rank(entry.t, entry.d, entry.path);
                capture(destination, row, s.proxy);
            }
        }, function () { scan(t + 1, 0); });
    }
    function choose() {
        if (!stableOrigin()) return;
        var best = operation.best;
        if (!best) { message = "No supported plugins"; queue = []; complete(); return; }
        if (operation.fromCache && best.retained !== undefined) {
            var a = retained[best.retained];
            function validRetained() {
                var profile = a.exists ? findLCXL3Profile(a.name, a.ids) : null;
                return a.exists && a.position === (best.child === undefined ? best.d : best.child) && a.trackPosition === best.trackPosition &&
                    a.name === best.name && profile && profile.id === best.profile;
            }
            if (!validRetained()) { rebuildCatalog(); return; }
            best.track = a.trackName;
            capture(destination, a.track, a.device);
            waitFor(function () {
                if (!validRetained()) { catalog = null; cancel("Plugins changed"); return false; }
                return a.destination && destination.exists;
            }, function () {
                if (!stableOrigin()) return;
                if (!validRetained()) { rebuildCatalog(); return; }
                handoff(best, a.track, a.device, function () { return validRetained() && a.destination; }, a.origin);
            }, "Plugins changed");
            return;
        }
        var offset = Math.floor(best.d / WIDTH) * WIDTH;
        scroll(best.t, offset, function () {
            if (!stableOrigin()) return;
            var s = slots[best.d - deviceOffset];
            if (best.child !== undefined) {
                if (!s || s.chains.indexOf(best.chain) < 0) { cancel("Plugins changed"); return; }
                openSlot(s, best.chain, Math.floor(best.child / WIDTH) * WIDTH, function (opened) {
                    var child = activeChild.slots[best.child - activeChild.offset];
                    function valid() {
                        var profile = child && child.exists ? findLCXL3Profile(child.name, child.ids) : null;
                        return opened && child && child.destination && destination.exists && rowDestination &&
                            child.name === best.name && profile && profile.id === best.profile;
                    }
                    handoff(best, row, child && child.proxy, valid, child && child.origin);
                });
                return;
            }
            var p = s && s.exists ? findLCXL3Profile(s.name, s.ids) : null;
            if (operation.fromCache) {
                // Cached locations are hints. Validate metadata before capturing
                // an identity anchor, then validate that anchor before selection.
                if (!p || s.name !== best.name || p.id !== best.profile) { rebuildCatalog(); return; }
                best.track = rowName;
                capture(destination, row, s.proxy);
                waitFor(function () { return s.destination && destination.exists && rowDestination; }, function () { handoff(best); }, "Plugins changed");
            } else handoff(best);
        });
    }
    function handoff(best, targetTrack, targetDevice, validTarget, sameOrigin) {
        var s = slots[best.d - deviceOffset];
        if (!validTarget) {
            targetTrack = row; targetDevice = s && s.proxy;
            sameOrigin = s && s.origin;
            validTarget = function () {
                var profile = s && s.exists ? findLCXL3Profile(s.name, s.ids) : null;
                return s && destination.exists && rowDestination && s.destination && s.name === best.name && profile && profile.id === best.profile;
            };
        }
        if (!stableOrigin()) return;
        if (!validTarget()) { catalog = null; cancel("Plugins changed"); return; }
        if (sameOrigin) { message = ""; complete(); return; }
        operation.guarded = false; phase = "handoff";
        hooks.begin();
        device.isPinned().set(false);
        targetTrack.selectInEditor(); track.selectChannel(targetTrack);
        targetDevice.selectInEditor(); device.selectDevice(targetDevice);
        // Cursor equality can lag behind device names/IDs, notably for Pigments.
        // Wait for destination acknowledgment instead of treating quiet metadata
        // as proof that all cursor observers have already caught up.
        waitFor(function () {
            if (!validTarget()) { catalog = null; cancel("Plugins changed"); return false; }
            return destinationSame && selectedDestination && hooks.ready(best.profile);
        }, function () {
            device.isPinned().set(operation.locked);
            waitFor(function () {
                if (!validTarget() || !destinationSame || !selectedDestination) {
                    cancel("Selection changed"); return false;
                }
                return pinned === operation.locked;
            }, function () { hooks.end(true); message = ""; complete(); }, "Lock timed out");
        }, "Selection changed");
    }

    return {
        onMidi: function (status, cc, value, rescan) {
            if (status !== 0xb0 || (cc !== 102 && cc !== 103)) return false;
            if (!value) down[cc] = false;
            else if (!down[cc]) { if (rescan) { catalog = null; knownLocation = null; } down[cc] = true; queue.push(cc === 102 ? 1 : -1); start(); }
            return true;
        },
        flush: function () { if (pendingCheck) pendingCheck(); },
        busy: function () { return phase === "handoff"; },
        status: function () { return {cachedPlugins: catalog ? catalog.length : null, scans: scans, cacheHits: cacheHits, phase: phase, queued: queue.length, message: message, tracks: total, scannedTrack: trackOffset, deviceOffset: deviceOffset, destination: operation ? operation.best : null, matches: operation ? operation.matches : null, lastResult: lastResult}; },
        display: function (title, subtitle) {
            hooks.hardware.sendCC(0xb0, 102, total > 0 ? 3 : 0);
            hooks.hardware.sendCC(0xb0, 103, total > 0 ? 3 : 0);
            if (message) hooks.hardware.stationary(message, targetTrackName);
            else hooks.hardware.stationary(targetTrackName || "No track", title + " D" + (targetPosition + 1), subtitle);
        },
        selectionChanged: function () { if (!operation) { message = ""; knownLocation = null; } },
        dispose: function () {
            if (operation && phase === "handoff") device.isPinned().set(operation.locked);
            pendingCheck = null; operation = null; queue = [];
        }
    };
}
