# Owner testing candidates - 2026-09-10

Published for owner-requested testing only. Neither candidate is approved for the official repository. Existing frozen ZIP bytes are unchanged.

## Latest quick recheck (after the original notes below)

- **Synthetiq Anime beta.5:** new seed 2372910688, 30 titles. Sub 30/30 resolved
  and decoded; Dub 30/30 resolved, 29/30 decoded. Total 59/60 short media samples
  passed, with Naruto E1 Dub failing. This random selection has no Bocchi case.
  242/242 caption files loaded across 23 declared language codes. S2 quick Naruto
  passed. The independently confirmed Spy x Family E1 Japanese-on-Dub failure
  is still unresolved; decoded media is not proof of correct spoken language.
- **An1me Greek beta.4:** 10 frozen titles, 10 audio-mode attempts across 9 titles
  with episodes. Corrected startup probe: 9 links resolved and all 9 decoded;
  Pokemon XY Dub returned no stream. Gintama season 4 separately had no episodes.
  Eight of ten selected titles therefore have a decoded stream; One Piece
  passed both modes. The separate Flutter Death Note stream check still FAILED,
  although Sub-only availability was read correctly.
- The preliminary Greek 3/10 decode count is INVALID: the quick harness lacked
  S2's HLS demuxer settings and rejected .jpg segment filenames before decoding
  their real media. The corrected run used the same cases, required video
  frames and audio, and did not change module bytes. Corrected seeking and
  physical-device playback remain unverified.
- Tests used the default route, not every server. They are short Mac-based
  media probes, not full native-device or offline certification. Greek is not
  release-ready. Both packages remain available only for requested owner testing.

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
