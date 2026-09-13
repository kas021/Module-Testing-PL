# DramaFun 4.0.0-beta.5 - owner testing

Published for explicit owner testing, not promoted to the official repository.
Identity: dramafun-v3 / SP-VID-035-DRAMAFUN / 35. Minimum app: 8.5.33.

## Changes

- Featured row, real paginated discovery, corrected lazy-loaded poster URLs.
- Current site mapping with preserved legacy episode links and season numbers.
- Fresh provider links on each retry; concurrent identical requests coalesced.
- Validated alternative servers with their own headers, quality and captions.
- Removed guessed stream addresses, image/HTML media and empty caption placeholders.
- Preferred healthier alternatives to older Vidspeed uploads where available.
- No app-code or backend changes; the website remains required for episode mapping.

## Evidence and limitations

Final frozen 30-title test (20 fixed plus 10 seeded entries from a 50-title pool):

| Check | Result |
| --- | --- |
| Regression tests | 35/35 |
| Stream resolution | 30/30 |
| Clean six-second host video/audio decode | 26/30 |
| Posters | 30/30 |
| Multiple servers | 26/30 |
| Three designated long-seek samples | 3/3 |

Failed decodes: Al Fondo Hay Sitio S11E1, Luz de Luna S2E71, Mehmed Fetihler
Sultani E42 and Gelin E233. These Vidspeed-only routes returned 403 after the
initial playlist/range checks. A resolved URL is not a playback pass.

S2 standard run 2026-09-13T13-21-02-419Z_s2_dramafun-v3_58329a0f reported PASS
for runtime/media/simulator checks. Manual screenshot review found advancing
video with an audio-device initialization error. Sound is NOT certified.

Valentina Valiente E1 completed a 235732488-byte host download/remux at 360p:
H.264/AAC, 3221.366 seconds versus 3221.300 seconds in the source playlist.
Local-only start/seek decoding passed with network protocols disabled.
This is not certification of Player's Downloads UI or reward accounting.

Super Mario Bros. 2023 decoded; Titanic 1997 did not resolve. Not every upstream
host has a working resolver. Source audio is preserved; separate dub is not
available. No genuine external captions were found in the sampled streams.
Automatic language detection on music is inconclusive; do not infer language
from the app's Sub label. Full phone/Android, sound, subtitles, background/resume,
server/quality switching and app offline testing remain open.

The testing ZIP uses the repository-required root layout. index.js and
module.json are byte-identical to the locally certified folder-layout candidate.
JavaScript SHA-256: ce1fcb6dcb04d934851165e602d9da682f5e08d6290fa9b31a702337e71dae02.
The repository index records the new root-layout ZIP checksum.

## Test on your phone

Update/install DramaFun from this repository and confirm 4.0.0-beta.5.
Check Home, Featured, several feed pages, search and first/middle/latest episodes.
Try Valentina Valiente E1, Tuzlu Kahve E2 and Senora del Destino E53, then verify
sound, seek far ahead, change server/quality, background/resume and download.
Report the title, episode, selected server and Player playback report for failures.
