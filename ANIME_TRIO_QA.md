> Historical Bundle 36 / beta.7 evidence below. Current Anime Sama is beta.9; see [the new catalogue repair and fresh counts](ANIME_SAMA_BETA9_QA.md). AniWorld beta.6 remains unchanged.

# Anime trio testing candidates — 12 September 2026

Testing Bundle 36 contains Anime Sama **1.1.0-beta.7** and AniWorld
**1.1.0-beta.6**. AnimeKai is **held**, not included: its candidate rejects most
sampled media and fails One Piece runtime playback resolution. No official
module has been promoted or replaced.

Import: https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json
Minimum supported Player: 8.5.33+95. Preserve installed data; refresh the testing
repository and check the installed module versions above. This community testing
repository is unsigned, as before.

| Module | Sub short AV decode | Dub short AV decode | Total | Overall assessment |
|---|---:|---:|---:|---|
| Anime Sama 1.1.0-beta.7 | 74/82 | 63/73 | 137/155 | PARTIAL testing candidate |
| AniWorld 1.1.0-beta.6 | 83/85 | 67/67 | 150/152 | PARTIAL testing candidate |
| AnimeKai 4.1.0-beta.5 (held) | 8/76 | 0/61 | 8/137 | FAIL / upstream media blocker |

These are one-second host decoder samples requiring both video and audio, not
155/152 complete plays. Unavailable language cases are excluded from those
denominators: Sama 1 Sub + 4 Dub; AniWorld 6 Dub; Kai 5 Dub. Search identity was
unresolved for Sama's Attack on Titan, AniWorld's Demon Slayer, and Kai's Demon
Slayer, Dragon Ball, Fullmetal Alchemist Brotherhood and Sword Art Online.
Those cases are recorded, not silently substituted or counted as playback passes.

Each module has 20 fixed queries and 10 fresh Home selections frozen with seed
2026091201 before testing. Home-to-details/episodes was tested separately:
Sama 9/10, AniWorld 10/10, Kai 10/10. Sama's remaining Home title has no usable
episode list. 112/112 sampled Home/search cover URLs returned image responses;
that does not certify every poster's dimensions or visual identity.

## Repairs

Sama now discovers actual French VF/VF1/VF2 routes, keeps unavailable Dub absent,
maps source episode labels when changing audio, preserves empty source-array
slots, removes fabricated episodes/quality/year/rating/status, and supports real
catalogue pagination. Films, OVAs and alternate cuts appear as separate search
collection entries rather than colliding with ordinary seasons. Saved episode
hrefs remain supported. Ordinary seasons use source-provided episode labels.

AniWorld fixes cross-card link/title/cover association and translated-alias title
selection, derives episode languages from actual flags, stops cross-language
fallback, preserves checked DE/EN Sub alternatives and numbered A-Z pages, and
handles bodyless manual redirects in shipped Flutter bridges.

Both return checked server alternatives and source quality choices with their
own headers, without invented 1080p options. Unsupported or blocked hosters are
not advertised as playable. Not every source hoster has a supported resolver.

## Runtime, S2 and native limits

Exact final ZIPs pass S2 quick: Flutter import, Home/search/details/episodes and
first/middle/latest sample media checks (3/3 each). The 8.5.33+95 source snapshot
also passes targeted real-runtime tests. The actual 8.5.33 repository parser
accepts this index. 17 module regressions, nine S2 fixture tests and two release
policy tests pass. ZIP identities, hashes, bundle membership and upgrade ordering
are checked separately from the old checkout's unrelated registry-audit failures.

Standard S2 on preceding Sama beta.6 and AniWorld beta.5 reported PASS and showed
video position advancement plus seek/pause execution. **Every sampled native
checkpoint also logged an audio-device initialization failure.** Their audited
status is PARTIAL, not fully working native playback. Earlier runs had build
timeouts; one was stopped to avoid another task's simulator. A task-owned
simulator was used for Sama beta.6 and removed after evidence collection.

Final standard native reruns were blocked by disk exhaustion. The exact final
ZIPs are not physically certified. App code, playback engines, accounts,
entitlements and the owner's phone app were not changed.

Spot language evidence: Japanese speech plus visible French burned-in dialogue
for Sama Sub; French Dub speech (Whisper tiny auto-detection fr, 0.923); German
burned-in dialogue and Japanese speech for AniWorld Sub (ja, 0.987); German
speech for AniWorld Dub. These are limited dialogue samples, not language proof
for every matrix entry. No selectable subtitle tracks are claimed for burned-in
captions. Soft captions/markers absent upstream remain absent.

Complete One Piece E1 Sub host downloads passed for both candidates after an
initial disk-full failure. Saved files matched playlist duration (Sama 1500.149s,
AniWorld 1477.976s) and both fully decoded offline with network protocols disabled.
This verifies host downloads/files, **not Player's download manager or offline UI**.

Known failures include Sama Bleach E1 Dub, Death Note E1 Dub, Fullmetal Alchemist
Brotherhood middle Dub and several later/title-specific routes; AniWorld Tokyo
Ghoul S2E12 and S4E12 Sub. Raw matrices retain every failed sample. Universal
reliability, all quality/server switches, phone playback, full app downloads and
background/resume behavior remain unverified.

## AnimeKai hold

The public 4.0.0 baseline can return a normal-looking HLS master whose rendition
points to .image segments. A sampled One Piece segment returned image/png and
PNG magic bytes. The module-only candidate rejects this route for compatibility
with shipped Player. Other authorized source alternatives were attempted; only
8/137 matrix samples decoded. No app normalization, remote service, access-control
bypass or cross-title replacement was introduced. Candidate 4.1.0-beta.5 remains
local for further work; it is not offered in the testing index.

## Owner checks

1. Confirm the two installed candidate versions above.
2. Open titles from Featured/Home and from search; verify posters, correct series
   and long episode lists. For Sama, search also exposes special collections.
3. Try One Piece E1 Sub and Dub; confirm French for Sama and German for AniWorld.
   Check burned-in captions on Sub and try available server/quality choices.
4. Play for several minutes, seek forward/back, pause/resume and change language.
5. Test a completed in-app download offline. Report module/version, title,
   season/episode, language, server and the failure time.

Movie Direct 0.3.0-beta.2 and Mugiwara 1.1.0-beta.5 are parked from the active
index to dedicate this testing task to the trio. Their packages, previous
bundles and all existing URLs remain unchanged. The third slot stays empty
while AnimeKai is held. YASTREAM and other queue work are deferred.
