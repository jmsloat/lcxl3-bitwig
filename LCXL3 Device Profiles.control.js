loadAPI(18);
load("lib/settings.js");
load("lib/profile-registry.js");
load("lib/hardware.js");
load("lib/generic.js");
load("profiles/iroko-parameters.js");
load("profiles/iroko.js");
load("profiles/pigments-parameters.js");
load("profiles/pigments.js");
load("profiles/mcrocklin-parameters.js");
load("profiles/mcrocklin.js");
load("lib/navigation.js");
load("lib/controller.js");

// Preserve the original UUID so port assignments survive the refactor.
host.defineController("Local", "LCXL3 Device Profiles", "0.3", "9a5a363a-6c13-488f-b340-ab237bd79da3", "Local");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["LCXL3 1 DAW In"], ["LCXL3 1 DAW In"]);
host.addDeviceNameBasedDiscoveryPair(["LCXL3 1 DAW Out"], ["LCXL3 1 DAW In"]);
