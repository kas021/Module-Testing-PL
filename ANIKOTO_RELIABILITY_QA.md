# AniKoto 5.0.4-beta.3 — QA notes (owner testing)

Started 2026-09-26 (Europe/London). Owner request: “apply everything we have and
fix Anikoto fully” + “publish module after a more thorough check”. Module-only
candidate; official 5.0.2 remains unchanged. Overall status: **published to this
testing index 2026-09-26; device playback pending owner testing.**

5.0.4-beta.3 is the full fix pass:

- megaplay's player hosts now encrypt the descriptor they return; the module
  decrypts it locally (pure ES5 AES-CBC, site-published constants, no browser
  globals) so the site's own servers (HD-1 / Vidstream) resolve again for every
  episode — the root fix for “episode 1 plays, later episodes don't”.
- The Vidhawk rescue (same hosted-extraction provider family as Synthetiq
  Anime/Flux/Aniworld and the AnimeAV1 candidate) now keys by MAL id when the
  watch page has no AniList banner id: the site's own episode-list AJAX carries
  `data-mal` per show. Measured rescue reach on the frozen matrix: **14/30 → 30/30**.
- AniKage fallback quota discipline: resolved routes and slugs are cached
  (repeat resolves cost zero quota); a 429 stops the sweep with a precise
  “retry in a minute” message; broken routes are dropped, never exposed.
- Subtitle `lang` values are now language tags (en / it / pt / ru / es ...)
  derived from the provider's display labels (“Portuguese (- Portugues(Brasil))”)
  instead of copying the raw label — matches how the app's subtitle
  auto-selection matches codes ('en', 'en-…') and removes a certifier
  LANGUAGE_CONTRADICTION that a raw label caused.

## Verification (2026-09-26, frozen candidate bytes)

- Unit suite 33/33 (new test covers label→tag derivation); `node --check` clean.
- House tester: **33 PASS / 0 FAIL / 0 WARN** — Solo Leveling live: 9 subtitle
  tracks, sub 1080p first, 626 KB range download OK.
- Release gate: **ALL_PASSED** — streams 3/3 first attempt (Solo Leveling,
  Iceblade, One Piece; segment ts_media each).
- Real Flutter app-runtime harness: **All tests passed** — import, home 32,
  search “iceblade”, details 45 ms, 12 episodes, **stream 816 ms via HD-1 with
  0 fallback routes**, playability HTTP 200 HLS, download probe 43 KB with
  segments.
- Frozen-matrix sweep 30 titles × [sub, dub] = 60 cases: **51 resolved + decoded
  live; 8 dub-availability (legit); 1 remaining gap** — vs the pre-repair run
  50/60: **Mebius Dust recovered (FAIL → OK), zero regressions.**
- Forced-rescue diagnostics (primary hosts blocked): chain engages every run;
  Vidhawk resolve+play API returns 200×4 (AniList + MAL forms); **at publish time
  Vidhawk's media hop was broken provider-side** (proxy.vidhawk.buzz → 502;
  its upstream hls.1embed.buzz gets a Cloudflare-WAF 403, all titles/servers —
  affects beta.2 identically; outside module control) — module fails closed and
  never exposes such a route; AniKage delivered routes in these runs (Nisekoi:
  EchoVideo route, 12 s decode OK).
- S2 quick (canonical certifier) — **sub**: no failure codes after the lang fix
  (all 9 subtitle tracks analyze clean, 0 contradictions); grade reads PARTIAL
  only because (a) the quick profile does not run the simulator-playback leg
  (simulator unavailable here — disk headroom), and (b) the certifier's language
  detector has no Russian hints, so the Russian track detects as “unknown”
  (content verified Cyrillic). Both are detector-side notes, not module defects.
- S2 quick **dub** (`--expected-audio-language english`): LANGUAGE_CONTRADICTION
  on the audio item because the sampled opening 20 s is the **Japanese opening
  song** (normal for anime dubs). Closed with a later-window check: the dialogue
  window at 150–175 s transcribes **English** (“Let’s die! …”) — the dub
  declaration is correct; this retires the old “verify dialogue beyond opening
  songs” gate. Certifier proposal on file: sample a later window or skip
  music-only openings (tester-side; requires owner approval, not applied).

## Frozen Artifacts

- Published testing candidate (2026-09-26): `modules/Anikoto-5.0.4-beta.3.zip`,
  SHA-256 `620625d46079a66641b39413c21c058fc7c0d877ef9addd4a8b40043fb5a3a1f`
  (index.js `d6dff1103454415e5959bb208ff18a9c655f9c943e9eed091889a142ce2b243c`).
  rev1 of beta.3 (pre-lang-fix, SHA `df98e808afedf546698236e0024b38e96a57f0ef413111bb084fd0399e243537`)
  is kept in the module workspace as `Anikoto-5.0.4-beta.3-rev1-pre-s2langfix.zip`;
  it was never published.
- Baseline: official Anikoto 5.0.2 (unchanged, live on the official index).
- Retired from this index: the 5.0.1-beta.3 testing build (ZIP kept reachable).
- Identity unchanged: `anikoto-v4`, `SP-VID-036-ANIKOTO`, number 36.
- Public testing index: https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

## Known Limits

- “La Maison en Petits Cubes” (short film) has no working route at any layer:
  the site's own player offers no supported host, Vidhawk's catalogue returns
  404 for it, and its AniKage embed is dead (404). Persisted across both matrix
  runs; an availability gap at source, not a regression.
- Vidhawk media-proxy outage (above) is provider-side and intermittent.
- AniKage quota is shared per network with the AniKage module; the caching
  softens it but a busy network can still hit 429s (clear message provided).
- Certifier notes/limits listed under S2 above; device playback (iPhone +
  Android), seek, server switching and caption rendering remain owner testing.
- No module can guarantee availability for every title, region or network.

---

# Previous review — 5.0.1-beta.3 candidate (2026-09-11)

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
