# DW Live beta.3: owner-approved TEST candidate

This change is restricted to Module-Testing-PL. It does not publish to the main
Synthetiq module repository or any app store.

## Identity correction

Private DW beta.2 used identity number 77, already owned by published Flux.
Publishing both would reject the repository due to duplicate identities.
DW beta.3 uses 110 / SP-VID-110-DW-LIVE, checked against the local registry,
626 local ZIP manifests and the current TEST index. The ID `dw-live-v1` and
family `dw_live_v1` are retained. The two packages' index.js bytes are identical;
only the version and numeric/display identity changed.

Artifact SHA-256:
`6068c5f67e3fc64303cd6e39f49141fd153f13f38c32e13fb0b2a0c7d5697cbb`.

## Repository compatibility

Bundle 142 adds DW to the existing 40 modules; their descriptors and ZIP bytes
are unchanged. Old bundles remain available. Bundle 142 requires Player 9.0.90
because older bulk importers only check the bundle minimum version. Individual
DW updates also specify 9.0.90. Existing installed modules are not removed.

The native subtitle declaration is re-signed for the new publication revision.
Its endpoint/configuration and the artwork package are unchanged. The same
verified provider descriptor is included in the new bundle and standalone file.
Source provenance remains community/manual; no fallback ownership is changed.

## Evidence

- Five DW module fixtures pass.
- Repository checksum/identity/catalogue verification passes: 41 modules.
- Eight Node signature regressions and three real Flutter repository-client
  signature/import tests pass.
- The preparation script pins the reviewed ZIP hash and expected provider.
  Local preparation is not publication; all outputs require review and a single
  Git commit before the TEST main reference is advanced.
- S2 standard run `2026-10-16T21-52-59-850Z_s2_dw-live-v1_4b06ed18`:
  real Flutter runtime, module journey and media decoding pass, but the generic
  media_kit simulator harness reports no clock advance. Overall S2 remains FAIL.
  This is not a claim of complete S2 certification. The installed V9 Live host
  uses video_player with opt-in Live clock semantics, not that test harness.
- The separate exact-ZIP SharedPlaybackHost native Live simulator test PASSED.
  Its invocation supplied beta.3 bytes and the SHA above; the test verifies that
  hash before import. Assertions cover 60 seconds of advancing native playback
  without controller replacement, 30 seconds paused, 10 seconds resumed without
  rewind, a fresh Go Live resolution/replacement and 15 seconds further progress.
  This passing app-engine gate supports the owner-approved TEST trial, not an S2
  grade change. The generic media_kit failure remains visible above.

Physical iPhone/iPad video/audio and channel-switching acceptance remain pending.
No TVApp or legacy TheTVApp candidate is included in this change.
