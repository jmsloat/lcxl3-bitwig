// Shared LCXL3 controller engine. Device behavior belongs in profiles/.
var navigator, hardware, generic, activeProfile = null, locked = false, deviceExists = false;
var presetInputs = {}, rememberedPages = {};
var PAGES = [], FADERS = [], BUTTONS = [], SHIFT_BUTTONS = [], ALWAYS_ON = [], EFFECT_COLORS = {};
function clearDeviceState() {
    normalized = {}; displayed = {}; displayAtValue = {}; dirtyValues = {};
    buttonDown = {}; pendingButtonFeedback = null; resetPickup(); needsLayout = true;
}
function reconcileProfile() {
    var next = deviceExists ? findLCXL3Profile(deviceName, available) : null;
    if (next !== activeProfile) {
        if (activeProfile) rememberedPages[activeProfile.id] = page;
        activeProfile = next; clearDeviceState();
        if (hardware) hardware.clearLedCache();
        PAGES = next ? next.pages : [];
        FADERS = next ? next.faders : [];
        BUTTONS = next ? next.buttons : [];
        SHIFT_BUTTONS = next ? (next.shiftButtons || next.buttons) : [];
        ALWAYS_ON = next ? (next.alwaysOn || []) : [];
        EFFECT_COLORS = next ? next.colors : {};
        page = next ? Math.max(0, Math.min(PAGES.length - 1, rememberedPages[next.id] || 0)) : 0;
    }
    ready = !!activeProfile && deviceExists;
    presetInput = activeProfile ? presetInputs[activeProfile.id] : null;
    needsLayout = true;
    if (generic) generic.setDevice(deviceName, deviceExists);
}
function showLockLed() { writeLedColor(65, locked ? [0,127,40] : [10,10,10]); }
function buttonBinding(index) { return (shift ? SHIFT_BUTTONS : BUTTONS)[index] || ""; }
function isPresetButton(index) { return !!(activeProfile && activeProfile.preset && activeProfile.preset.buttons[index]); }
var output, device, displayObserver, presetInput;
var deviceName = "", available = {}, normalized = {}, displayed = {}, displayAtValue = {};
var page = 0, shift = false, surfaceActive = true;
var ready = false, needsLayout = true, dirtyValues = {};
var lastFader = [], faderPicked = [], buttonDown = {};
var pendingButtonFeedback = null;
var diagnosticEvents = [];

function effectGroup(name) { return activeProfile && activeProfile.groupForName ? activeProfile.groupForName(resolveName(name)) : "global"; }
function setParameterLed(cc, name, id, button) {
    var rgb = [0, 0, 0];
    if (id) {
        var value = validValue(id) ? Math.max(0, Math.min(1, normalized[id])) : 0;
        rgb = hardware.valueColor(EFFECT_COLORS[effectGroup(name)] || [127,127,127], value, button);
    }
    writeLedColor(cc, rgb);
}
function writeLedColor(cc, rgb) { hardware.color(cc, rgb); }
function setPresetLed(index, pressed) {
    var level = pressed ? LCXL3_SETTINGS.buttonOn : LCXL3_SETTINGS.buttonOff;
    writeLedColor(37 + index, [127,127,127].map(function (c) { return Math.round(c * level); }));
}
function switchPreset(index) {
    if (!ready || !presetInput || !isPresetButton(index)) return;
    var action = activeProfile.preset.buttons[index];
    presetInput.sendRawMidiEvent(0xb0, action.cc, 127);
    resetPickup(); pendingButtonFeedback = {name: action.label, state: "MIDI command sent"};
    setPresetLed(index, true);
}
function exportDiagnostics() {
    var name = activeProfile ? continuousName(13) : "", id = parameterId(name);
    var data = JSON.stringify({device: deviceName, ready: ready, page: page, surfaceActive: surfaceActive,
        navigation: navigator ? navigator.status() : null, profile: activeProfile ? activeProfile.id : "generic", locked: locked, presetInputReady: !!presetInput, buttonLayer: shift ? "Secondary" : "Main", firstEncoder: resolveName(name), id: id, value: id ? normalized[id] : null,
        display: id ? parameterText(id) : null, valueCount: Object.keys(normalized).length, extraValues: Object.keys(normalized).filter(function(k) { return !available[k]; }).map(function(k) { return [k, normalized[k]]; }), events: diagnosticEvents});
    var bytes = [];
    for (var i = 0; i < data.length; i++) bytes.push(data.charCodeAt(i) < 128 ? data.charCodeAt(i) : 32);
    host.sendDatagramPacket("127.0.0.1", LCXL3_SETTINGS.diagnosticPort, bytes);
    host.scheduleTask(exportDiagnostics, 2000);
}

function resolveName(name) {
    name = name || "";
    return activeProfile && activeProfile.resolveName ? activeProfile.resolveName(name, function (n) { return normalized[activeProfile.parameters[n]]; }) : name;
}
function parameterId(name) {
    var id = activeProfile && activeProfile.parameters[resolveName(name)];
    return ready && id && available[id] ? id : null;
}
function canonicalParameterId(id) {
    id = String(id);
    if (available[id]) return id;
    var shortId = id.replace("/ROOT_GENERIC_MODULE/", "/");
    return available[shortId] ? shortId : id;
}
function validValue(id) { return id && typeof normalized[id] === "number" && isFinite(normalized[id]); }
function parameterText(id) {
    // Some plugins deliver numeric and formatted feedback at different times.
    // Profiles can choose one stable representation instead of alternating units.
    // In plugin mode, keep the last host label until its replacement arrives.
    // Do not associate it with a numeric callback: either callback may arrive first.
    if (activeProfile && activeProfile.valueDisplay === "plugin") return displayed[id] || "";
    if (activeProfile && activeProfile.valueDisplay === "normalized") return validValue(id) ? (normalized[id] * 100).toFixed(1) + " %" : "";
    if (!validValue(id)) return displayed[id] || "";
    // Some bridged VSTs provide a formatted label only on selection. Never show
    // that old label after the numeric value changes.
    if (displayed[id] && typeof displayAtValue[id] === "number" && Math.abs(displayAtValue[id] - normalized[id]) < 1 / 16383) return displayed[id];
    return (normalized[id] * 100).toFixed(1) + " %";
}
function sendCC(status, cc, value) { hardware.sendCC(status, cc, value); }
function sysex(bytes) { hardware.sysex(bytes); }
function text(target, field, value) { hardware.text(target, field, value); }
function stationary(title, subtitle) { if (navigator) navigator.display(title, subtitle); else hardware.stationary(title, subtitle); }
function queueButtonFeedback(index, state) {
    var parameter = buttonBinding(index);
    var labels = activeProfile.buttonLabels || {}, states = (activeProfile.buttonStates || {})[parameter];
    pendingButtonFeedback = {
        name: labels[parameter] || resolveName(parameter).replace(/ Power$/, ""),
        state: states ? states[state ? 1 : 0] : (state ? "On" : "Off")
    };
}
function showButtonFeedback() {
    if (!pendingButtonFeedback) return;
    // The global temporary display expires using the controller's timeout setting.
    sysex([4, 54, 1]);
    text(54, 0, pendingButtonFeedback.name);
    text(54, 1, pendingButtonFeedback.state);
    sysex([4, 54, 127]);
    pendingButtonFeedback = null;
}
function continuousName(cc) { return cc < 13 ? FADERS[cc - 5] : PAGES[page].rows[Math.floor((cc - 13) / 8)][(cc - 13) % 8]; }
function resetPickup() { lastFader = []; faderPicked = []; }
function setupHardware() {
    if (hardware) hardware.clearLedCache();
    output.sendMidi(0x9f, 12, 127); // DAW mode, only through the DAW port.
    sendCC(0xb6, 30, 2); // DAW Control surface.
    sendCC(0xb6, 69, 127); sendCC(0xb6, 72, 127); sendCC(0xb6, 73, 127);
    // Pickup is implemented below, so its crossing logic can be tested directly.
    sendCC(0xb6, 70, 0);
    needsLayout = true;
}
function observeVisibleParameters() {
    var ids = [], seen = {};
    function add(name) {
        var id = parameterId(name);
        if (id && !seen[id]) {
            ids.push(id);
            if (id.indexOf("CONTENTS/PID") === 0) ids.push(id.replace("CONTENTS/", "CONTENTS/ROOT_GENERIC_MODULE/"));
            seen[id] = true;
        }
    }
    for (var cc = 5; cc <= 36; cc++) add(continuousName(cc));
    for (var b = 0; b < BUTTONS.length; b++) add(buttonBinding(b));
    displayObserver.setObservedParameterIds(ids);
}
function updateLayout() {
    needsLayout = false;
    observeVisibleParameters();
    stationary(ready ? activeProfile.name + " " + (page + 1) + "/" + PAGES.length + (locked ? " LOCK" : "") : "Select device", ready ? PAGES[page].name : deviceName || "No device");
    for (var cc = 5; cc <= 36; cc++) {
        var name = continuousName(cc), id = parameterId(name);
        sysex([4, cc, 97]); // Parameter name + formatted value; change and touch displays.
        text(cc, 0, id ? resolveName(name) : (name ? "Unavailable" : "Unassigned"));
        text(cc, 1, id ? parameterText(id) : "");
        if (cc >= 13) setParameterLed(cc, name, id, false);
        if (id) dirtyValues[id] = true;
    }
    for (var b = 0; b < BUTTONS.length; b++) {
        if (isPresetButton(b)) { setPresetLed(b, !!buttonDown[37 + b]); continue; }
        var id = parameterId(buttonBinding(b));
        if (id) dirtyValues[id] = true;
        else setParameterLed(37 + b, buttonBinding(b), null, true);
    }
    sendCC(0xb0, 106, page > 0 ? 3 : 0);
    sendCC(0xb0, 107, page < PAGES.length - 1 ? 3 : 0);
}
function refreshValue(id) {
    for (var cc = 5; cc <= 36; cc++) {
        if (parameterId(continuousName(cc)) !== id) continue;
        if (validValue(id)) sendCC(0xbf, cc, normalized[id] * 127);
        text(cc, 1, parameterText(id));
        if (cc >= 13) setParameterLed(cc, continuousName(cc), id, false);
    }
    for (var b = 0; b < BUTTONS.length; b++) {
        if (parameterId(buttonBinding(b)) === id) setParameterLed(37 + b, buttonBinding(b), id, true);
    }
}
function onMidi(status, cc, value) {
    diagnosticEvents.push([status, cc, value]);
    if (diagnosticEvents.length > 16) diagnosticEvents.shift();
    if (status === 0xb6 && cc === 63) { shift = value > 0; needsLayout = true; if (generic) generic.invalidate(); return; }
    if (status === 0xb6 && cc === 30) {
        surfaceActive = value === 1 || value === 2;
        if (surfaceActive) { if (hardware) hardware.clearLedCache(); resetPickup(); needsLayout = true; if (generic) generic.invalidate(); }
        return;
    }
    if (!surfaceActive) return;
    if (navigator && navigator.onMidi(status, cc, value, shift)) return;
    if (navigator && navigator.busy()) return;
    if (status === 0xb0 && cc === 65) {
        if (!value) { buttonDown[cc] = false; return; }
        if (!deviceExists) return;
        if (!buttonDown[cc]) {
            buttonDown[cc] = true; var nextLock = !locked; locked = nextLock; device.isPinned().set(nextLock);
            pendingButtonFeedback = {name: "Device Lock", state: nextLock ? "Locked" : "Following selection"};
        }
        return;
    }
    if (!activeProfile) { generic.onMidi(status, cc, value, shift); return; }
    if (status === 0xb0) {
        if (value === 0) { buttonDown[cc] = false; if (isPresetButton(cc - 37)) setPresetLed(cc - 37, false); return; }
        if (buttonDown[cc]) return;
        buttonDown[cc] = true;
        if (cc === 106 || cc === 107) {
            page = Math.max(0, Math.min(PAGES.length - 1, page + (cc === 107 ? 1 : -1)));
            needsLayout = true; return;
        }
        if (isPresetButton(cc - 37)) { switchPreset(cc - 37); return; }
        if (cc >= 37 && cc <= 52) {
            var id = parameterId(buttonBinding(cc - 37));
            if (!validValue(id)) return;
            var next = normalized[id] >= 0.5 ? 0 : 1;
            device.setDirectParameterValueNormalized(id, next, 2);
            normalized[id] = next; dirtyValues[id] = true;
            queueButtonFeedback(cc - 37, next);
        }
        return;
    }
    if (status !== 0xbf || !ready) return;
    if (cc >= 77 && cc <= 100) {
        var delta = value - 64;
        var id = parameterId(continuousName(cc - 64));
        if (validValue(id) && delta) {
            var nextValue = Math.max(0, Math.min(1, normalized[id] + delta * (shift ? LCXL3_SETTINGS.fineStep : LCXL3_SETTINGS.normalStep)));
            device.setDirectParameterValueNormalized(id, Math.round(nextValue * 16383), 16384);
            normalized[id] = nextValue; dirtyValues[id] = true;
        }
    } else if (cc >= 5 && cc <= 12) {
        var index = cc - 5, id = parameterId(FADERS[index]);
        if (!validValue(id)) return;
        var target = normalized[id] * 127, previous = lastFader[index];
        if (faderPicked[index] && Math.abs(target - previous) > 3) faderPicked[index] = false;
        if (Math.abs(value - target) <= 2 || (previous !== undefined && (previous - target) * (value - target) <= 0)) faderPicked[index] = true;
        lastFader[index] = value;
        if (faderPicked[index]) {
            device.setDirectParameterValueNormalized(id, value, 128);
            normalized[id] = value / 127; dirtyValues[id] = true;
        }
    }
}
function init() {
    output = host.getMidiOutPort(0); hardware = createLCXL3Hardware(output);
    host.getMidiInPort(0).setMidiCallback(onMidi);
    LCXL3_PROFILES.forEach(function (profile) {
        if (!profile.preset) return;
        var input = host.getMidiInPort(0).createNoteInput(profile.preset.inputName, "000000");
        input.setShouldConsumeEvents(false); presetInputs[profile.id] = input;
    });
    // Keep cursor identifiers and controller UUID stable for existing installations.
    var track = host.createCursorTrack("lcxl3-iroko-track", "LCXL3 Device Profiles", 0, 0, true);
    device = track.createCursorDevice("lcxl3-iroko-device", "LCXL3 Device Profiles", 0, CursorDeviceFollowMode.FOLLOW_SELECTION);
    generic = createGenericLCXL3Controller(device, hardware, function () { return locked; }, stationary);
    navigator = createSupportedPluginNavigator(track, device, {
        hardware: hardware, locked: function () { return locked; },
        invalidate: function () { needsLayout = true; generic.invalidate(); },
        begin: function () { clearDeviceState(); hardware.clearLedCache(); generic.reset(); },
        end: function () { generic.resume(); resetPickup(); buttonDown = {}; pendingButtonFeedback = null; needsLayout = true; generic.invalidate(); }
    });
    device.exists().addValueObserver(function (exists) { deviceExists = exists; reconcileProfile(); });
    device.isPinned().addValueObserver(function (value) { locked = value; needsLayout = true; generic.invalidate(); });
    device.name().addValueObserver(function (name) {
        deviceName = String(name); if (navigator) navigator.selectionChanged(); clearDeviceState(); reconcileProfile();
    });
    device.addDirectParameterIdObserver(function (ids) {
        available = {}; if (navigator) navigator.selectionChanged(); clearDeviceState();
        for (var i = 0; i < ids.length; i++) available[String(ids[i])] = true;
        reconcileProfile();
    });
    device.addDirectParameterNormalizedValueObserver(function (id, value) {
        id = canonicalParameterId(id); normalized[id] = value; dirtyValues[id] = true;
        if (activeProfile && (activeProfile.layoutParameters || []).some(function (n) { return activeProfile.parameters[n] === id; })) needsLayout = true;
    });
    displayObserver = device.addDirectParameterValueDisplayObserver(45, function (id, value) {
        id = canonicalParameterId(id);
        if (String(value)) { displayed[id] = String(value); displayAtValue[id] = normalized[id]; dirtyValues[id] = true; }
    });
    setupHardware();
    if (LCXL3_SETTINGS.diagnostics) host.scheduleTask(exportDiagnostics, 2000);
}
function keepSectionsEnabled() {
    if (!ready) return;
    for (var i = 0; i < ALWAYS_ON.length; i++) {
        var id = parameterId(ALWAYS_ON[i]);
        if (validValue(id) && normalized[id] < 0.5) {
            device.setDirectParameterValueNormalized(id, 1, 2);
            normalized[id] = 1; dirtyValues[id] = true;
        }
    }
}
function flush() {
    if (!surfaceActive || (navigator && navigator.busy())) return;
    if (!activeProfile) {
        if (displayObserver) displayObserver.setObservedParameterIds(null);
        generic.flush(); showLockLed(); showButtonFeedback(); return;
    }
    keepSectionsEnabled();
    if (needsLayout) updateLayout();
    var updates = dirtyValues; dirtyValues = {};
    for (var id in updates) refreshValue(id);
    showLockLed();
    showButtonFeedback();
}
function exit() {
    if (navigator) navigator.dispose();
    if (displayObserver) displayObserver.setObservedParameterIds(null);
    if (output) output.sendMidi(0x9f, 12, 0);
}
