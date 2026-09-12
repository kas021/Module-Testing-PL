# MegaKino 1.1.0-beta.3 Testing Handoff

12 September 2026. Testing only, not a certified stable release.
Identity preserved: megakino-v1 / megakino_v1 / SP-VID-062-MEGAKINO / 62.
ZIP SHA-256: `4c7669097f0741a84d1646817dd2c438f97c9c6fe1847beafe9771111a81a98b`.

## Repairs

- Confirmed canonical redirect from megakino18.com to megakino19.com; catalogue
  sessions now start on the current host. Known old saved title/episode URLs
  normalize to the new host. Arbitrary numbered domains are not trusted.
- Featured, latest films and latest series retained, with working View All feed
  declarations, numbered category pages and next-page detection from site links.
- Search sends the site's numbered search request. Catalogue page two verified;
  full search pagination across every query is not certified.
- Returns each resolved supported host, per-server headers/captions/qualities,
  and actual HLS resolution labels rather than inventing 1080p or 4K.
- GX uses its checked media playlist when no separate audio group would be lost.
  Its extensionless URLs still require HLS-aware parsing. VOE remains preferred.
- Unsupported Sub still returns no stream instead of silently playing German Dub.

## Automated and Live Evidence

15/15 regression tests passed; final ZIP inspection passed. Original source and
official 1.0.3 ZIP were preserved. No app code or backend changed.

Frozen matrix: 20 homepage entries plus 10 seeded remaining entries from the
homepage/category page two, seed 20260912. 30 distinct catalogue titles, including
three series. First/middle/later episode selection varies deterministically.

- 30/30 primary routes decoded video AND audio for five seconds at 90 seconds.
- 30/30 public poster URLs returned image responses without a catalogue cookie.
- 27/30 cases returned VOE and GX; three series returned VOE only.
- All 30 exposed quality choices. None returned external subtitle tracks.
- Median resolution 879 ms; this excludes catalogue/player startup. One sample
  took 12.286 seconds. Sequential alternative resolution can still delay startup.
- Home: 10 featured, 11 films, 9 series. Films page two: 20 items, next-page true.

The matrix used beta.2. Beta.3 changes only the View All field to the app's
`viewAll: {mode: 'feed', feedId}` contract and the manifest version. Playback
code is identical. Final-package fixtures, runtime checks and supplemental media
checks cover beta.3. PROBE.json retains the interrupted beta.1 run; it was stopped
after the GX fix, not counted as a completed matrix.

The default host detector failed GX on three of the first five matrix cases.
Supplemental beta.3 checks explicitly selected the HLS demuxer, matching the
declared stream type, and decoded all nine returned server routes across five
titles. GX was absent from one fresh result, so no tenth pass is claimed.
Initial failures are preserved; this is not universal player compatibility proof.

Mutiny: all four available quality choices decoded; fresh reads at 10 and 600
seconds decoded. A 30-second saved MKV clip decoded with only the file protocol
allowed. This is NOT the full app download/cache flow, a full movie download,
or a physical-device offline test.

## Audio and S2 Limits

Mutiny dialogue samples at 600 and 1200 seconds were detected as German by local
Whisper small multilingual. Inception at 1200 seconds was German (229 recognized
characters). Its 600-second sample was labelled Spanish with only 39 recognized
characters, so complete language consistency is not certified from those samples.
No 30-title human listening test was done; metadata/title matching and short
decoding do not prove every file contains the correct complete film.

Recorded S2 runs:

- Original 1.0.3 quick: FAIL at Home, run 2026-09-12T21-59-50-242Z_s2_megakino-v1_73b08d68.
- Beta.1 initial Inception run requested Sub by mistake: Home/search/details/
  episodes passed; no stream correctly returned for unsupported Sub. Retained,
  not counted as a Dub playback regression.
- Beta.1 Inception Dub standard: runtime and three media probes passed, simulator
  reported advancement, overall FAIL / LANGUAGE_CONTRADICTION. Its automatic
  transcript was empty, confidence zero, skipped=true; that label is not reliable
  evidence of English speech. Supplemental later samples are recorded separately.
- Beta.3 One Piece Dub quick: PARTIAL, runtime passed, middle/latest media passed,
  first ffprobe failed. Fresh beta.3 rechecks decoded S2 episodes 1, 5 and 8 at
  90 seconds. The original transient failure is retained.
- Final beta.3 Mutiny Dub standard, run 2026-09-12T22-10-10-328Z_s2_megakino-v1_2dc531eb:
  runtime and all three media probes passed. Simulator video advanced for 120.5
  seconds, but every checkpoint reports audio-device initialization failure/no
  sound. Overall S2 FAIL / LANGUAGE_CONTRADICTION: its entire transcript is
  `[MUSIC]` (7 characters), labelled English. This is not spoken-English evidence;
  separate later dialogue samples detect German. The original grade is preserved,
  and the tester was not edited or weakened. Explicit testing-only handoff.

Physical iPhone/Android playback, audible simulator output, long-distance
in-app seeking, background/resume, full downloads/offline and every server/quality
switch remain owner/device QA gates. Do not call this fully certified.

## Evidence

PROBE-final.json, POSTERS.json, SUPPLEMENTAL.json, ONE_PIECE_RECHECK.json,
AUDIO.json and AUDIO-1200.json retain the results. S2 artifacts are under the
project's MODULE_TESTER/reports/runs. Raw S2 logs can contain temporary stream
URLs and should not be published without redaction. No audio/media clips are
included in the public testing repository.
