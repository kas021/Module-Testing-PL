# Owner testing candidates - 2026-09-10

Published for owner-requested testing only. Neither candidate is approved for the official repository. Existing frozen ZIP bytes are unchanged.

## Synthetiq Anime 1.0.1-beta.5

- 16 module regression tests passed.
- 30-title probe: Sub 30/30 resolved and short decoded samples advanced. Dub 29/30 resolved (one title has no Dub); 28/29 short decoded samples advanced.
- Resolution/short decoding is not native playback certification or proof of correct spoken language.
- Spy x Family episode 1's supposed Dub is Japanese on both Flow and Zuri, independently audio-checked. Naruto Dub was independently identified as English.
- 245 caption files returned cues across 22 declared languages. This is not full-episode subtitle rendering certification.
- Naruto Dub's short seek sample stalled; a longer sample advanced. Native seeking remains unverified.
- Physical iPhone/Android, completed downloads/offline and full-episode playback remain unverified.
- Source repair commit: 3c64a91affbf2d61e3eab63f0efa19f2cd255943.

## An1me (Greek) 1.1.0-beta.3

- Six regression tests passed. Browse page 2 returned 21 cards and a following page.
- Flutter runtime passed; first/latest sampled media decoded. Middle sample failed with upstream HTTP 5xx on a Google-hosted MP4.
- Treat this as PARTIAL: 2/3 media samples, not a 30-title certification, regardless of the tester's headline PASS.
- Greek Dub, burned-in Greek subtitles, sustained playback, native seeking and download/offline behavior remain unverified.

No app code, account data, backend or official module catalogue is changed by this publication.
