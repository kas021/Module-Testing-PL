# Owner testing candidates - 2026-09-10

Published for owner-requested testing only. Neither candidate is approved for the official repository. Existing frozen ZIP bytes are unchanged.

## Synthetiq Anime 1.0.1-beta.5

- 16 module regression tests passed.
- Fresh 30-title probe, seed 2370605283: Sub 30/30 resolved and short decoded samples advanced. Dub 29/30 resolved (one title has no Dub); 28/29 short decoded samples advanced.
- Resolution/short decoding is not native playback certification or proof of correct spoken language.
- Spy x Family episode 1's supposed Dub is Japanese on both Flow and Zuri, independently audio-checked. Naruto Dub was independently identified as English.
- 246 caption files returned cues across 23 declared language codes. Multiple tracks were returned in 18/30 Sub and 12/29 available Dub samples. This is not full-episode subtitle rendering certification.
- A fresh audio check at 600 seconds still identifies Spy x Family episode 1's alleged Dub as Japanese. Naruto's Sub/Dub samples correctly identify Japanese/English. Do not confuse decode success with correct audio language.
- Fresh S2 quick Naruto PASS: real Flutter runtime and three media samples. This does not clear the separate Spy x Family failure or native device/offline gates.
- Naruto Dub's short seek sample stalled; a longer sample advanced. Native seeking remains unverified.
- Physical iPhone/Android, completed downloads/offline and full-episode playback remain unverified.
- Source repair commit: 3c64a91affbf2d61e3eab63f0efa19f2cd255943.

## An1me (Greek) 1.1.0-beta.4

- Fix: all episode paths now send explicit Sub/Dub availability based on the current title's language classification. Generic page descriptions and inactive navigation links do not enable Dub. Unknown metadata no longer invents Dub.
- Fifteen regressions passed. No app changes, no per-episode metadata request fan-out, and playback resolver bytes unchanged from beta.3.
- Death Note 37 episodes and Naruto 217 episodes are now Sub-only; One Piece retains the site's Sub/Dub classification. Live old/new Node runs resolved all three series on both versions.
- These are title-level catalogue flags. The episode-list API does not prove individual episode Dub coverage or stream health.
- Flutter correctly read Death Note firstSub=true/firstDub=false, but its stream test FAILED twice. The old beta.3 failed the same Flutter stream check; Node resolution succeeded on both. This is an open pre-existing/runtime-path problem, not a passing playback certification.
- Prior beta.3 first/latest media samples decoded; middle failed upstream HTTP 5xx. Keep that partial evidence and do not turn it into a full native pass.
- Greek Dub, burned-in Greek subtitles, sustained playback, native seeking and download/offline behavior remain unverified.

No app code, account data, backend or official module catalogue is changed by this publication.
