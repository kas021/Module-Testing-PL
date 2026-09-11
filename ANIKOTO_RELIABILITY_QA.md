# AniKoto Reliability Candidate

Date: 2026-09-11
Version: 5.0.1-beta.3
Module identity: anikoto-v4 / SP-VID-036-ANIKOTO / 36
App target: existing 8.5.33+95, without app changes.
Release status: TEST CANDIDATE ONLY. Native release verification is incomplete.

## Root Cause

The reported Nisekoi entry is the 12-episode second season, AniList 20876,
not the first-season AniList 18897 entry. Its primary MegaPlay route returned
an HLS-looking playlist whose segment was actually a PNG image. Rejecting
that stream was correct. The old fallback resolver did not understand some
currently returned player types and therefore ran out of working routes.

This is not evidence that users need to restart their phones. Provider
availability and device/network behavior are separate failure categories.

## Module Changes

- Resolve supported EchoVideo public player endpoints and validate media.
- Use fresh Vidhawk Flow/Zuri tickets as a bounded fallback, using only the
  exact AniList identity attached to AniKoto's current player.
- Retain the published primary routes and the existing matched AniKage/Otaku
  fallback. No fuzzy wrong-title or wrong-season substitution is introduced.
- Enforce exact episode and Sub/Dub identity; missing Dub stays unavailable.
- Keep checked server alternatives, quality variants, available caption
  languages, and genuine provider intro/outro markers.
- Reuse identical media checks only within one extraction and with matching
  headers. No persisted media URL or ticket cache.
- Bound the entire playback lookup to 26 seconds. Expired work cannot launch
  subsequent requests or append results after returning. Already-dispatched
  Flutter transport requests cannot be aborted by this module API.
- Return the existing structured-error shape instead of throwing through the
  shipped app's broken error wrapper. No app-code patch is included.
- Never accept dropped binary bodies, PNG placeholders or HTML as media.

## Evidence

- 25/25 module regression tests passed.
- Candidate ZIP inspection passed: two entries, no safety/contract issues.
- Real Flutter runtime passed for Nisekoi Sub and Naruto Dub: import, home,
  search, details, episode identity, stream resolution and download probes.
- Nisekoi at 180 seconds: Japanese dialogue detected (101 characters) and
  a frame with burned-in English dialogue captions visually checked.
- Naruto Dub at 180 seconds: English dialogue detected (115 characters).
  Its English soft-caption file returned 302 timed cues, not HTML.
- Naruto Sub at 180 seconds: Japanese dialogue detected (33 characters);
  its English soft-caption file also contained 302 timed cues.
- Re:Zero Dub at 180 seconds: English dialogue detected (216 characters).
- Naruto Shippuden Dub at 180 seconds: English dialogue detected (237
  characters). Seven caption files returned timed cues; the Arabic-labelled
  track contained Arabic text, while the English-labelled track did not.
- A real Flutter negative test for Nisekoi Dub returned the intended
  "Dub is not available for this episode" exception, not `_pack is not
  defined`: `2026-09-11T18-02-26-813Z_s2_runtime_anikoto-v4_22f92a2c`.
  That test intentionally fails the positive playback harness and is not
  counted as a successful video playback.

These are sampled-language checks, not full-episode or all-title language
certification. Twelve-second FFmpeg decoding is not native playback proof.

### S2 Runs

- `2026-09-11T17-54-44-367Z_s2_runtime_anikoto-v4_a62acbd7`: beta.3 Nisekoi
  Flutter runtime PASS; 12-episode identity preserved.
- `2026-09-11T17-55-18-784Z_s2_runtime_anikoto-v4_030077bc`: beta.3 Naruto
  Dub Flutter runtime PASS.
- `2026-09-11T18-05-27-862Z_s2_anikoto-v4_8ac40cc5`: beta.3 Naruto Sub
  quick S2 PASS, with first/middle/latest media decode, Japanese audio and
  English caption checks. This quick profile does not test native playback
  and does not supersede the separate Dub flag or missing native gate.
- `2026-09-11T17-57-35-376Z_s2_anikoto-v4_551957d8`: beta.3 quick S2 FAIL,
  `LANGUAGE_CONTRADICTION`. First/middle/latest media decode all passed.
  The opening audio sample was detected as Japanese; a later dialogue sample
  detected English. An untranslated opening song is a possible explanation,
  not a reason to silently discard the automated result. Native testing was
  not part of this quick run.
- `2026-09-11T17-36-59-037Z_s2_anikoto-v4_c3af5a49`: beta.2 standard S2 did
  not complete native playback. The build was cancelled as the Mac's free
  internal space dropped below 400 MiB. Its language flag also had empty
  transcription with confidence zero; do not treat that as speech proof.

### Matrix

The frozen 30-title list has 20 selected regression titles and 10 seeded
discovery titles, each requested in Sub and Dub. Missing Dub is reported
separately from broken playback, never counted as a video pass.

Beta.2 initial run: 60 requests; 50 resolved; 46 decoded video and audio;
8 correctly unavailable Dub; 2 no working route; 4 decode failures with
HTTP 429. These counts belong to beta.2, not the final candidate.

Beta.3 final run: 60 requests; 52 resolved; 51 decoded video and audio;
8 correctly unavailable Dub; 0 no-route failures; 1 stalled decode on
Bocchi the Rock! Sub episode 1. There were no HTTP 429 decode failures in
this run. The previous no-route cases (Mebius Dust and La Maison en Petits
Cubes) both decoded in this run. Do not erase the earlier failure evidence.

The final run used a four-second pause between cases, versus 1.2 seconds
in beta.2. Both code and pacing changed; the absence of HTTP 429 cannot be
attributed to the memoization change alone. No distributed-load or regional
reliability claim is established by this single-machine run.

Beta.3 final records are summarized separately in ANIKOTO_RELIABILITY_PROBE.json.
Private signed URLs, transcripts, audio and frames are not published.

Bocchi Sub decoded successfully on a later fresh-link attempt (about six
seconds to resolve). Its first-attempt failure remains in the matrix.

Caption availability probe: 128/129 unique advertised files returned timed
cues within the 512 KiB diagnostic limit. One English track on Chained
Soldier season 2 Dub was 1,845,700 bytes. Its HTTP 206 range began with real
WebVTT cues; the size-limit result is not evidence that captions are absent.
The separate full follow-up (2 MiB cap) returned HTTP 200 and 5,310 WebVTT
cues. Thus all 129 sampled files were eventually parsed, with the initial
size-limit result retained. Large-track rendering performance is unverified.
Full sync/translation and native caption rendering remain unverified.

## Candidate Integrity

ZIP SHA-256:
`85149352185162a0d4afac390d2e27d2b45137c4da65e6c444162550f0326739`

index.js SHA-256:
`1a8b8e48e125ae9beee40171c5a93a9b738b3d68463678d5954754d38dcd894d`

## Release Gates Still Open

- Complete native iPhone and Android playback, seek, server switching,
  lock/resume, caption display, downloads and offline checks.
- Verify dialogue language beyond opening songs on the sampled provider
  routes; retain the raw S2 failure and supplementary evidence separately.
- Confirm the remaining matrix failures and provider rate-limit behavior.
- The module cannot fix the separate app-side saved-copy/retry lifecycle bug.
- No module can guarantee availability for every user, every upstream title,
  every region or every network. Unsupported/blocked sources fail explicitly.

Do not replace the official stable module based solely on these probes.
