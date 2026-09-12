# STCine 1.1.0-beta.3: owner testing

Date: 2026-09-12. Overall: PARTIAL, not production-certified.
Identity: stcine-v1 / SP-VID-056-STCINE / 56.
SHA-256: 46c2e8e25fe3823dc2a18d7337a560ec288e14872a3f6227b4a031300949d391.

## Changes

- Featured and paginated movie/TV browsing. Page two returned 20 new cards.
- Bounded concurrent catalogue and season loading; removed eight-season and
  500-episode truncation. Metadata failures no longer invent S1E1. Failed seasons
  do not silently produce an incomplete series list.
- Explicit checked providers and qualities with their own headers and captions.
- Source subtitle languages retained; two alternative releases per language,
  rather than hundreds of indistinguishable English entries. No paid subtitle API.
- No global caption fallback across providers with different tracks. Current app
  default selection can choose a different provider/quality than the first entry.
- Slow endpoints no longer discard already-returned provider results. Unchecked,
  image/HTML, failed and ambiguous wrong-season routes are rejected.
- Dub is not advertised or substituted with an unverified route.

No app/backend/account changes. Official STCine 1.0.5 remains unchanged.

## Final-package results

14/14 regression tests passed. Matrix: 20 fixed + 10 seeded Home cases,
seed 2026091256. Exact movie/TV IDs and requested episode presence checked.

- 28/30 short host audio/video decodes (93.3%). This is not 30 full-device watches.
- 20/20 fixed cases decoded; 8/10 seeded cases decoded.
- No stream: Tomorrow Is Ours S1E1 (TMDB 72879), House Rules S1E1 (TMDB 49847).
- Median resolution: 4,705 ms, excluding player initialization.
- 45/45 sampled English/Arabic caption URLs returned valid timing cues.
  This proves retrieval/format, not full-film synchronization or every language.
- 90-second seek probes: Inception and The Matrix passed; Interstellar hit a TLS
  read timeout. Initial result remains 2/3, even if a fresh-source retry works.
- Separate fresh-source Interstellar retry: both Videasy 2160p and LookMovie
  480p decoded at 90 seconds (1,892 ms and 958 ms). This does not erase the timeout.
- Featured/Top10/movie poster samples: 3/3 valid JPEG responses.

Rage of Stars failed the earlier beta.1 FFmpeg extension whitelist, but decoded
in the final run using HLS allowed_extensions ALL / extension_picky 0. The final
test still decodes actual video and audio; HTTP success alone is not counted.

## S2 and limitations

Final standard run: 2026-09-12T20-29-18-196Z_s2_stcine-v1_220cfbfd, PARTIAL.
Flutter runtime and three media probes passed. Simulator video advanced for
about 120 seconds, but telemetry reports audio-device initialization failure:
"Could not open/initialize audio device -> no sound." Audible sound is NOT verified.
Spoken-language transcription was skipped (confidence zero).

S2 only examines global caption arrays, so the final run did not certify the
nested server tracks. Their URL/timing checks are recorded separately above.
Earlier beta.1 run 2026-09-12T20-23-11-741Z_s2_stcine-v1_85cc319b failed
LANGUAGE_CONTRADICTION: English/Arabic matched, but the tester's nine-language
word-hint detector mislabeled visibly Polish text as Portuguese and Vietnamese
text as Spanish. That failed report is preserved, not silently converted to PASS.
Unsupported-language labels were not changed to satisfy the detector.

Full downloads/offline, physical-device audio, subtitle synchronization, and
all server/quality transitions remain unverified. The current app does not fully
carry captions per quality; test cross-provider changes through Servers separately.
No claim that app-side quality-switch behavior was fixed by this module update.
Catalogue entries can still lack an upstream playable source.

See the [final redacted 30-case matrix](STCINE_MATRIX.json) for per-title results.

## Phone checks

1. Update STCine to 1.1.0-beta.3 from this testing repository.
2. Inception: confirm sound, open Servers, compare LookMovie and Videasy where
   available; check English and Arabic captions on the provider exposing them.
3. Interstellar: seek beyond 90 seconds and test a longer jump.
4. Breaking Bad S3E7 and The Office S9E1: verify correct episode and resume.
5. Scroll beyond the first Home/feed page; try a download and offline playback.

Do not use Tomorrow Is Ours S1E1 or House Rules S1E1 as known-good test cases.
