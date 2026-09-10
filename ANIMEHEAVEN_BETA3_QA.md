# AnimeHeaven 4.1.0-beta.3

Module-only server discovery update. Official 4.0.6 and previous immutable ZIPs are unchanged.

## Changes

- Return all unique player-source URLs that pass preliminary media checks in the app's servers array, retaining required headers.
- Prefer explicit source elements; do not count a separate download link as another server.
- Use Range bytes=0-1 GET rather than beta.1's single-byte probe or beta.2's hanging HEAD checks.
- Preserve Sub-only declaration and reject false Dub requests. Burned-in captions unchanged.
- No fabricated quality options. Sampled mirrors contain the same 720p media, not different resolutions.

## Evidence

Ten module regression tests pass, including server output, headers, deduplication, failed mirror exclusion and two-byte probe behavior.

Live site research: Dandadan and Death Note have three distinct player mirrors with H.264/AAC 1280x720 media. Naruto's two fallback mirrors returned 404 and are omitted; its primary decodes. A duplicated download URL is not an extra server. No selectable track elements were found. No quality attributes were found on the source elements; the research JSON's generic `res` matches are cookie-expiry JavaScript, not resolution labels.

Final five-title first-episode probe: Dandadan, One Piece, Death Note, Naruto, Attack on Titan all resolve and expose video/audio to ffprobe. Search-through-resolution 0.6-1.4 seconds in the Node shim. PROBE.json and SERVER_RESEARCH.json are sanitized evidence.

S2 standard run 2026-09-10T13-37-22-599Z_s2_animeheaven-v2-1_988ef626: PARTIAL, no failure codes. Real Flutter runtime and first/middle/latest media checks pass. Supplementary journey passed with three servers on Dandadan first/middle/latest, approximately 2-3 seconds each. Simulator video advanced for 120 seconds; audible playback remains unverified because the simulator reports audio-device initialization failure. Spoken-language detection was skipped.

## Limitations

The before-each-probe deadline is not an interrupt for an in-flight network request. timeoutMs is only a hint, ignored by the shipped native bridge; future upstream outages may still delay resolution. No guarantee of globally fast mirrors.

Media metadata is not audible or full-episode playback certification. Physical device switching, long seeks, downloads/offline and full caption accuracy remain owner QA. Long-series partial catalogues remain. No app code or testing harness changes.
