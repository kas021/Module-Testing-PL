# StreamingUnity private candidate QA

Date: 2026-09-10
Candidate: 1.1.0-beta.2
Baseline: 1.0.4
Scope: module-only; no app changes or public publication for this task.

## Changes

- Preserve full HLS masters and their external audio groups. Check requested audio and video rendition transport availability before returning a candidate.
- Return checked server alternatives with their associated headers and captions, within a bounded resolution budget.
- Resolve relative rendition URLs against the actual playlist, preserving signed query strings.
- Unwrap complete single-segment VOD subtitle playlists to verified WebVTT files. Omit broken or unsupported caption routes rather than returning unusable tracks.
- Normalize caption language and forced-track metadata.
- Remove unsafe provider-ID/title-ID fallback and first-search-result substitution; preserve discovered title slugs for numeric references.
- Preserve module identity, contract and historical language mapping: Sub requests English; Dub requests Italian.

## Evidence

All 13 fixture regression tests passed with node --test module.test.cjs.

Exact candidate live checks (LIVE_QA-beta.2.json):

| Case | Resolution | Servers | Captions | Decode |
| --- | --- | --- | --- | --- |
| Inception, Sub/English | 2932 ms | 3 | 4 | Non-silent AAC and H.264 |
| Inception, Dub/Italian | 2954 ms | 3 | 4 | Non-silent AAC and H.264 |
| Breaking Bad S1E1, Sub/English | 4525 ms | 3 | 8 | Non-silent AAC and H.264 |

Each live decode seeks to 180 seconds and decodes five seconds with FFmpeg. Seek-and-decode command duration was 9.2-11.4 seconds, including startup; this is not native player seek latency. Spoken language was not independently verified.

S2 quick run: 2026-09-10T02-25-10-943Z_s2_streamingunity-v1_1d089b15.
Result: PARTIAL; Flutter runtime passed, media checks passed, failureCodes empty. Inception is one movie, so first/middle/latest checks do not represent three different episodes. Native playback and audio-language verification remain untested. English caption classification passed; Italian classification was low confidence and does not independently establish spoken or subtitle language accuracy.

## Limits and next gate

- The original missing-audio issue has not been reproduced: baseline Inception already supplied AAC audio. Obtain the user's failing title, device and streaming/download path before claiming that specific defect fixed.
- Keep quality Auto: provider variants are video-only and require audio groups from the full master. No safe quality-filtered master was established.
- Three returned server routes may share upstream infrastructure; they are not evidence of three independent providers.
- No verified intro/outro markers were found; none are invented.
- Multi-segment/live captions are omitted, not truncated. Masters without explicit requested-language audio metadata are conservatively rejected, including potentially playable muxed-audio masters.
- Native iPhone/Android playback, server switching, sustained playback, downloads and offline playback remain unverified. S2 standard and owner QA are required before release.
- Official module, registry and public repositories were not updated by this task.

## Frozen artifact

StreamingUnity-1.1.0-beta.2.zip

SHA-256: 3e21c03f93090c054b3704a3b3007647bb63084c585457845c7d3863635cd787
