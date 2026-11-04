# Track-first navigation validation

The navigation rule is one target per track: the first device with a supported
profile in forward device-chain order, including one level inside a single-slot
Chain. Track left/right changes tracks, not instances on the same track.

## Automated checks

Run `npm test` for syntax, navigation and all profile/preset regressions. The
navigation harness covers:

- Track order in both directions, unsupported-track skipping, wrap, one/no-match
  cases, generic and empty origins, and later supported plugins being ignored.
- Selecting a Chain automatically resolves its first supported child without
  MIDI input, including startup, renamed/paged Chains, identical names, delayed
  metadata, bypass preservation, quiet no-match behavior, manual cancellation,
  locking during discovery and unlock-triggered resolution.
- First-match early exit: no later containers or unrelated tracks are searched
  after the destination is found. There is no project-wide instance catalog.
- Forward device order even during reverse track navigation, renamed Chains,
  unselected UI slots, empty slots, one-level scope, and clamped device paging.
- Isolated `FIRST_DEVICE` discovery cursors, target assignment before pin
  acknowledgment (including unassigned cursors), delayed slot entry, and
  selection-following cursor behavior modeled
  by the host fixture rather than assumed harmless.
- Ordered rapid presses, held-button deduplication, profile page memory, lock
  restoration, and delayed destination-equality and pin acknowledgments.
- Genuine manual-selection cancellation, destination deletion, identical-looking
  replacements and reordering, without selecting stale identities.
- Button/feedback/pickup reset and blocked parameter/preset writes during handoff.

A 35-track fixture exercises flattened group, collapsed-child, return and master
rows, with 21 devices per track. Simulated scheduler timings are not measurements
of Bitwig or hardware latency.

## Live validation status

On November 2, 2026, the installed Bitwig 6.1.4 controller received physical Track
button presses but initially failed with `Chain slot unavailable`. The fixture
had incorrectly made the first slot available without UI selection.

A subsequent explicit-slot-entry revision reached nested Iroko and loaded its
196 parameters, but discovery canceled with `Selection changed` despite no
manual selection. Investigation identified selection-following private cursors
moving before pin acknowledgment as an unsafe path. The current revision uses
isolated cursors and stops at the first match; successful live completion of this
revision still needs confirmation. Profile activation alone is not proof of a
completed navigation handoff.

The first track-first live retry exposed `Cursor pin timed out`: Bitwig silently
ignores pin requests when the cursor has no target. Private cursors now position
in isolated mode before pinning; empty origins do not require a nonexistent
device to be pinned. The harness models the no-op and target auto-pinning.

A controlled real-host retry then exposed retained follow modes on old private
cursor IDs. The factory's mode argument applies only when a cursor is first
created. Private discovery IDs now use a versioned namespace; the main controller
IDs, user-selection observer and controller UUID are unchanged. A saved-mode
fixture verifies the upgrade path rather than testing only fresh cursor state.

After that migration, a controlled real-Bitwig next/previous round trip completed
successfully: Iroko inside a Chain on Audio 2, then Iroko inside a Chain on Audio
3. Both results completed without cancellation or timeout; the final profile
was ready with 196 parameter values. These calls used a temporary synthetic MIDI
callback, not physical button input. All probes and diagnostics were removed,
and the installed script files were verified against the source afterward.
Physical button and screen confirmation remains pending.

On November 4, 2026, automatic selected-Chain resolution was added as a separate
operation sharing the guarded child search and handoff. It does not use ordinary
track navigation as a fallback.
No-match attempts retain the selected container's identity and keep the first
recognized-but-unready child's page observed for later parameter metadata,
without polling repeatedly. Disposal invalidates pending automatic requests.

A controlled real-Bitwig parent-selection test then observed `Chain` followed by
`Iroko`, with the Iroko profile ready and the automatic operation completed on
Audio 3. No MIDI or Track-button callback was invoked. Host-enabled state was
unchanged before and after selection. All temporary probes were removed and
diagnostics were disabled afterward. This verifies the selection-to-profile
path in the actual host, not physical button/display operation.

For a live retry, check that both Track directions choose the first supported
plugin on the next eligible track, keep the lock when enabled, and report a
completed result rather than a cancellation. Confirm that later supported
plugins on the same track are ignored. Restore temporary diagnostics afterward.

Earlier revisions' instance-catalog, retained-reference and cached-switch timing
results do not apply to this track-first implementation.
