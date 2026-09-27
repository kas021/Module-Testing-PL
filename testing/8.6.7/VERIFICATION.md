# 8.6.7 comparison evidence

This is an explicitly requested test-only catalogue, not a production release
or a certification that every title plays. Production indexes are unchanged.

## Baselines

The candidates preserve the identity and source family of these hash-verified
public packages, sampled on 2026-09-27:

| Module | Public baseline | SHA-256 |
|---|---|---|
| Flux | 1.0.2 | 40407a74706eba46aa04b48b2a53197c6c10f9f6fea11c39dcc97624d8ba6dc9 |
| Anime | 1.0.4 | 2a02bfa9bca6310bcf5e512f0d3c143d717094d3c6b29494c07d9b9b307af0b5 |
| AniKoto | 5.0.4-beta.4 | 4815bded4b272d31ca74188dfa2a02e356ca448a22dde5e542d9d888a2ce7f20 |

These public packages already included labelled rescue-provider paths. Those
were preserved, not introduced as an undocumented replacement source.

## Candidate changes

- Prefer asynchronous or object `response.json` values over a misleading body.
- Preserve native byte-validation evidence through response wrappers.
- Accept the known 252-byte wrapped transport-stream format only with the
  native validated marker and sufficient complete response bytes. Do not
  guess from corrupted UTF-8 strings or MIME types.
- Reject truncated/dropped bodies and unknown media rather than declaring
  them playable. Probes remain bounded; no full-video download is a validator.
- Carry normalization requirements and each route's own headers together.
- Do not replace an unavailable requested language with the opposite track.

## Limits

Module probes do not treat the legacy bridge `finalUrl` as reliable redirect
identity. The player proxy patch resolves resources against its own explicitly
followed final playlist URL. Redirect-dependent module probe identity remains
unverified and is not advertised as fixed by these ZIPs alone.

The S2 Node journey currently calls extraction without the requested language;
its media/audio evidence must not be attributed to the Flutter runtime's Dub
request. Runtime language selection and audible language proof are separate.

The initial native-runtime Flux sample (Dr. STONE, episode 1, Sub) passed home,
search, details and episodes, then failed extraction: primary routes returned
502, and rescue segment probes exceeded the old 2 MiB response limit. This
failure was retained as evidence and prompted a bounded probe correction.

## Final candidate results

| Module | Version | SHA-256 |
|---|---|---|
| Flux | 1.0.3-beta.5 | 7f951ce3fac152bdcdf1724bfbda1fbe1adcf453a6420abcfabd955ab0555ffa |
| Anime | 1.0.5-beta.3 | da890816eed976b79a7992d0602da4c0fd3825cca76e84dd2b1eff8fc786b8ac |
| AniKoto | 5.0.5-beta.3 | 225493150ac7b1d58b25fc10a6188b828a260de4c64b3444aa5a99855e420a38 |

Module fixtures: **19 passed**. PL packaging/release-policy fixtures: **10
passed**. ZIP contents were checked against the committed source files, and
the index checksums match those ZIP bytes.

| Module and sample | Real Flutter JS/runtime journey | Media evidence | S2 grade |
|---|---|---|---|
| Flux: Dr. STONE E1 Sub | Import, home, search, details, 24 episodes, extraction and download probe pass after the cap correction | First episode FFmpeg frames/audio/continuity pass; middle/latest episode metadata probes pass | BLOCKED: NO_IOS_SIMULATOR |
| Anime: One Piece E1 Dub | Import, home, search, details, episodes, extraction and download probe pass | S2's separate default-Sub journey has first-episode FFmpeg frames/audio/continuity; middle/latest metadata pass, not Dub language proof | BLOCKED: NO_IOS_SIMULATOR |
| AniKoto: Dr. STONE E1 Sub | Import, home, search, details, episodes, extraction and download probe pass | First episode FFmpeg frames/audio/continuity pass; middle/latest metadata pass | BLOCKED: NO_IOS_SIMULATOR |
| Anime: Dr. STONE E1 Sub | Second-title runtime journey and download probe pass | No additional native player check | Runtime only |
| AniKoto: One Piece E1 Dub | Second-title runtime journey and download probe pass | No additional native player or audible Dub-language check | Runtime only |
| Flux: One Piece, requested Dub | Home/search/details pass; episode listing fails after primary-provider probes time out and return unverified availability | No stream reached in this run | FAILED sample; provider-availability limitation remains |

The failed Flux second-title sample is not a successful playback result and is
not hidden by a fabricated episode list. The runtime logged both language
frontiers as unverified after capped provider requests. This is a remaining
module/provider availability path, not evidence of an app decoder failure.

S2 final run IDs:

- Flux: `2026-09-27T00-23-00-999Z_s2_synthetiq-anime-direct_18392354`
- Anime: `2026-09-27T00-23-00-998Z_s2_synthetiq-anime-v1_3e1b0e74`
- AniKoto: `2026-09-27T00-14-19-393Z_s2_anikoto-v4_dbae15de`

The first-episode analysis sampled frames at 0, 30 and 120 seconds and audio;
it is not 120 seconds of observed native app playback. Middle/latest samples
were ffprobe metadata checks, not watched episodes. A download probe fetched
playlist/sample bytes; no full episode download or offline playback is claimed.

Physical Android/iOS/Windows playback, offline downloads, native seek/resume,
and a same-device 8.6.0+146 versus 8.6.7+147 comparison remain **untested**.
The intended use is owner QA through PL only. Do not promote these candidates
to production based on this report. No signed stream URLs, credentials or raw
runtime logs are included here.

## Rollback

PL root catalogue and bundle files were not edited. Before this isolated
addition, PL main was `1ada2240cc91bf57497f3640b30190eade7adaba`. Revert only
the scoped test-catalogue commit if withdrawing the test. Never reset main or
delete unrelated test modules. In the app, disconnect this nested test index,
back up local data, then restore the corresponding official packages.
