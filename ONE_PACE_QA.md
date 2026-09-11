# One Pace 3.0.4-beta.1

Module-only candidate derived from official 3.0.3. Not published.
SHA-256: `1766de33ac5adda215f44016b823faa2642041f23520a2758d3c70d100cf13e7`.

## Fixes

- CC files are English Dub with Closed Captions according to the live source watch page. Never use CC as Japanese Sub fallback. CC-only episodes advertise Dub, not Sub. Legacy saved payloads follow the same rule.
- List metadata cache now expires after ten minutes instead of staying stale indefinitely within the runtime.
- Accept parsed-object JSON responses as well as asynchronous JSON methods.

## Evidence (2026-09-11)

- Live watch page: https://onepace.net/en/watch. 179 unique list links.
- Actual candidate catalogue: 485 grouped episodes.
- 30 evenly spaced episodes, 60 requested-language slots: 30 Sub and 12 available Dub routes returned MP4 header evidence; 18 Dub slots unavailable; zero failures among the 42 available sampled routes.
- This broad probe checks the first listed quality only. It is not sustained playback, spoken-language or full-download proof.
- 16 sampled routes exposed multiple quality options; labels across the sample: 480p, 720p, 1080p.
- Five regression tests pass, covering CC/Sub separation, missing Dub rejection, JSON response compatibility, quality/audio separation and cache expiry.
- S2 quick PASS: `2026-09-11T18-36-27-656Z_s2_onepace-v3_445130ed`. Real Flutter runtime passed; first/middle/latest media passed; sampled audio detected Japanese.
- S2 standard FAIL: `2026-09-11T18-37-14-104Z_s2_onepace-v3_445f0247`, `SIMULATOR_TIMEOUT` and `SIMULATOR_SUMMARY_MISSING`. Runtime and all three media probes passed, but the simulator log ended at `Running Xcode build... No tests ran.` Native playback did not begin; this is not evidence of a media playback failure. Candidate is not release-certified.

## Remaining Limits

No physical-device, complete download/offline, full-episode subtitle or broad Dub speech certification. Single upstream Pixeldrain remains a dependency. No new servers, soft subtitle files or intro/outro timestamps were fabricated. Legacy positional episode IDs and catalogue grouping remain unchanged; their stability across upstream reorderings is not certified.
