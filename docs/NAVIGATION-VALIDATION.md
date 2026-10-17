# Instance navigation validation

Checked 2026-10-17 against Bitwig Studio 6.1.3, controller API 18.

`npm test` passes the existing Iroko and profile regression checks plus the
asynchronous navigation harness. The harness tests:

- Previous/next order, wrapping, duplicates on one track, unsupported tracks,
  generic origins, per-profile page memory, one/no-match cases and empty origins.
- Main-chain scope, signature mismatches and metadata for bypassed devices.
  The host's flattened bank supplies group, collapsed-child, return and master
  rows; navigation reads every row without filtering track types.
- Rapid ordered presses, held-button deduplication, pinned origins that differ
  from UI selection, lock restoration and delayed pin acknowledgments.
- Manual selection changes during discovery and handoff, destination deletion,
  replacement by an identical-looking device, and device reordering.
- Cache/button/pickup reset between identical instances, blocked parameter and
  preset writes during handoff, and restored fader pickup afterward.
- A 35-track project with 21 devices per track, and final device windows whose
  scroll positions are clamped to a full window.

Live checks loaded the installed script and observed its UDP diagnostics. The
project exposed six flattened tracks. With only the real Iroko profile installed,
both directions found the sole Iroko on Audio 2 and stayed there, including when
locked. The cursor reported 196 Iroko parameter values and retained preset routing.

A temporary, empty-control test profile made other existing main-chain devices
eligible solely for API validation. Navigation moved from Iroko on Audio 2 to
Augmented GRAND PIANO on another track and back, retaining the lock in both
directions. On return, all 196 Iroko values were present again. The test profile
and scheduled test commands were removed; the original Iroko selection and
unlocked state were restored. No tracks, devices or real profile bindings were
created or removed for this check.

Duplicate Irokos, large projects, rack exclusion, deletions/reorders and the full
track-type matrix were covered in the harness, not reproduced in the live project.
Physical screen readability and MIDI from the hardware Track buttons still need
normal hands-on use; live commands were injected through the controller's MIDI
handler. Runtime diagnostics are disabled in the final installation.

## Cached navigation and Pigments follow-up

Navigation now retains the discovered plugin catalog. Tests check that repeat
switches visit only the destination track window without another project scan,
track-count changes invalidate the cache, missing destinations rebuild it,
Shift + Track refreshes newly added plugins, and manual selection among identical
profiles uses the correct origin. Delayed cursor-equality callbacks are covered
with a 250 ms acknowledgment delay. Track LEDs, immediate discovery overlays and
plugin/track destination feedback are also tested.

Live diagnostics reproduced a handoff cancellation on the real Pigments instance:
its name/IDs changed before cursor equality reported the destination. Waiting for
the equality acknowledgment completed the handoff successfully. A controlled
round trip between Iroko and Pigments then showed one discovery scan and one
cache hit, with both handoffs complete. Temporary probes and diagnostics were
removed afterward. Physical screen/LED confirmation still requires hands-on use.
