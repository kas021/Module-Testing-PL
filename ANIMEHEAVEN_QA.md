# AnimeHeaven 4.0.7-beta.1 - owner testing

Published at owner request, testing only. Official 4.0.6 remains unchanged.

This is the earlier immutable candidate, not failed 4.1.0-beta.1 or beta.2.
SHA-256: 3ace4487375df68bc24caded65e31e13b804a7f1b6c57cb8e8cc4350d3626ee7

## Scope

- Reject explicit Dub instead of relabelling a Sub stream.
- Reject HTML/image/empty unknown probe responses.
- Return no stream when all probes fail, rather than returning the first failed URL.
- Stop probing once a working primary is found. The later expanded server-list changes are NOT included.

## Verification

S2 standard result: PARTIAL, run 2026-09-10T12-46-13-957Z_s2_animeheaven-v2-1_a2b5782f.
Package hash matches the tested artifact exactly. Flutter runtime and media decode passed.
Simulator video advanced for 120 seconds, but the log reported audio-device initialization failure. Audible playback is NOT certified.

No claims of full spoken-language, full-episode captions, physical iPhone/Android or completed offline playback verification.
Only one selected source is returned. No invented quality levels or selectable subtitle tracks are added.
Partial long-running catalogues remain, including One Piece.

## Owner QA

Check Dandadan episode 1: video, audible original audio, readable subtitles, seeking, resume and a download.
This is newer than official 4.0.6, but deliberately older than the unshipped failed 4.1.0 experiments.
No application code was changed.
