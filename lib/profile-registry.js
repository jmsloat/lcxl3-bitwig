var LCXL3_PROFILES = [];
function registerLCXL3Profile(profile) {
    if (!profile.id || !profile.name || !profile.parameters || !profile.matchNames || !profile.matchNames.length) throw new Error("Profile identity, matcher and parameters are required");
    if (LCXL3_PROFILES.some(function (p) { return p.id === profile.id; })) throw new Error("Duplicate profile: " + profile.id);
    if (!profile.pages || !profile.pages.length || !profile.faders || profile.faders.length !== 8 || !profile.buttons || profile.buttons.length !== 16) throw new Error("Profile needs pages, 8 faders and 16 buttons: " + profile.id);
    profile.pages.forEach(function (page) {
        if (!page.name || !page.rows || page.rows.length !== 3 || page.rows.some(function (row) { return row.length !== 8; })) throw new Error("Invalid encoder page: " + profile.id);
    });
    if (profile.shiftButtons && profile.shiftButtons.length !== 16) throw new Error("Invalid Shift buttons: " + profile.id);
    Object.keys(profile.parameterSteps || {}).forEach(function (name) {
        var count = profile.parameterSteps[name];
        if (!profile.parameters[name] || typeof count !== "number" || !isFinite(count) || count < 2 || count % 1) throw new Error("Invalid stepped parameter: " + profile.id + "/" + name);
    });
    if (profile.preset) Object.keys(profile.preset.buttons).forEach(function (key) {
        var index = Number(key), action = profile.preset.buttons[key];
        if (index < 0 || index > 15 || index % 1 || !action || action.cc < 0 || action.cc > 127 || action.cc % 1) throw new Error("Invalid preset button: " + profile.id);
    });
    Object.keys(profile.buttonActions || {}).forEach(function (key) {
        var index = Number(key), action = profile.buttonActions[key];
        if (!isFinite(index) || String(index) !== key || index % 1 || index < 0 || index > 15 || !action || !profile.parameters[action.parameter] ||
            typeof action.steps !== "number" || !isFinite(action.steps) || action.steps % 1 || action.steps < 2 ||
            typeof action.value !== "number" || !isFinite(action.value) || action.value % 1 || action.value < 0 || action.value >= action.steps ||
            typeof action.label !== "string" || !action.label.trim() || profile.buttons[index] ||
            (profile.shiftButtons && profile.shiftButtons[index]) || (profile.preset && profile.preset.buttons[index])) {
            throw new Error("Invalid fixed button action: " + profile.id + "/" + key);
        }
    });
    (profile.pickupResetParameters || []).forEach(function (name) {
        if (!profile.parameters[name]) throw new Error("Invalid pickup reset parameter: " + profile.id + "/" + name);
    });
    LCXL3_PROFILES.push(profile);
}
function findLCXL3Profile(name, available) {
    for (var i = 0; i < LCXL3_PROFILES.length; i++) {
        var profile = LCXL3_PROFILES[i];
        if (!profile.matchNames.some(function (n) { return n.toLowerCase() === name.toLowerCase(); })) continue;
        if ((profile.requiredParameters || []).every(function (n) { return profile.parameters[n] && available[profile.parameters[n]]; })) return profile;
    }
    return null;
}
