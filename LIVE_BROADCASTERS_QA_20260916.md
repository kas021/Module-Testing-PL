# Live broadcaster testing candidates

Requires app 9.0.0. Testing publication only; no stable release certification.

## Packages

- DW Live 0.1.0-beta.2: English, Spanish and Arabic. Existing identity 77 preserved. Each play fetches the selected official DW page and validates its current adaptive HLS master and video rendition.
- Tagesschau Live 0.1.0-beta.2: German. Identity 78. Each play fetches the official livestream page and resolves its current HLS. Broadcaster metadata flags possible geographic restrictions; HTTP 403 fails explicitly without bypass.
- No fabricated schedules or additional channel listings. No dub mode. Empty soft-subtitle lists do not promise captions.

## Evidence

DW English S2 quick PASS: 2026-09-16T09-21-49-350Z_s2_dw-live-v1_41919769. Real Flutter runtime and three media probes passed. Short audio-language classifier returned French on this English-labelled official feed; its repetitive transcription is not accepted as spoken-language certification. Owner reports the English channel plays instantly on iPhone. Spanish audio and video passed separately: 2026-09-16T09-23-30-443Z_s2_dw-live-v1_dda674c2.

Tagesschau S2 quick PASS: 2026-09-16T09-24-23-614Z_s2_tagesschau-live-v1_458048f0. Real Flutter runtime and three media probes passed; sampled audio classified German. First unpublished beta failed runtime URL normalization and was repaired before this candidate.

DW fixture tests: five passed. Tagesschau fixture tests: three passed. All four channel resolutions independently returned native HLS from the official broadcaster pages. Quick probes are not physical pause/resume, reconnect or receiver certification.

## Remaining gates

DW Arabic S2 quick PASS: 2026-09-16T09-25-31-004Z_s2_dw-live-v1_d47d8176. Real Flutter runtime and three media probes passed; sampled audio classified Arabic.

New channels need sustained iPhone playback/audio, long pauses, background and network-transition testing. Owner reports DW AirPlay fails. Channel changes during AirPlay are intentionally disabled in current app controls, and the native handoff currently uses saved-position seeks without Live-specific timing semantics. These findings do not prove the initial AirPlay failure's cause; receiver diagnostics are still required. Do not label AirPlay repaired.

Sports remain separate: Streamed's native resolver is incomplete; StreamEx rejected the earlier probe with 403. Neither is included as a working broadcaster candidate.
