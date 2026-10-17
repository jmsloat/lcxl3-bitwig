var LCXL3_PROFILES = [];
function registerLCXL3Profile(profile) {
    if (!profile.id || !profile.name || !profile.parameters || !profile.matchNames || !profile.matchNames.length) throw new Error("Profile identity, matcher and parameters are required");
    if (LCXL3_PROFILES.some(function (p) { return p.id === profile.id; })) throw new Error("Duplicate profile: " + profile.id);
    if (!profile.pages || !profile.pages.length || !profile.faders || profile.faders.length !== 8 || !profile.buttons || profile.buttons.length !== 16) throw new Error("Profile needs pages, 8 faders and 16 buttons: " + profile.id);
    profile.pages.forEach(function (page) {
        if (!page.name || !page.rows || page.rows.length !== 3 || page.rows.some(function (row) { return row.length !== 8; })) throw new Error("Invalid encoder page: " + profile.id);
    });
    if (profile.shiftButtons && profile.shiftButtons.length !== 16) throw new Error("Invalid Shift buttons: " + profile.id);
    if (profile.preset) Object.keys(profile.preset.buttons).forEach(function (key) {
        var index = Number(key), action = profile.preset.buttons[key];
        if (index < 0 || index > 15 || index % 1 || !action || action.cc < 0 || action.cc > 127 || action.cc % 1) throw new Error("Invalid preset button: " + profile.id);
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
