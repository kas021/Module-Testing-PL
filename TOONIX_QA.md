# Toonix 1.0.0-beta.6 — QA and known limits

Module: `toonix-v1` · identity `SP-VID-076-TOONIX` · family `toonix_v1` · contractVersion 4
(V4 discovery enabled) · minAppVersion 8.5.33

Package: `modules/Toonix-1.0.0-beta.6.zip`
SHA-256 `ca11c37b642a0235d60cd525474cd5ebf1d596a805024fe7350e27a035d82eca`

Source: `https://toonix.bond` — a Next.js site whose watch pages embed a signed HLS player
source served by a three-host Cloudflare worker CDN (one token accepted by all three = mirror
failover), plus `archive.org` MP4 files for some titles.

## New in beta.6

- **Featured row added to the home screen.** A discovery-enabled module owns the *whole* home
  screen: the app's own "Featured" hero carousel only renders on the legacy (non-discovery)
  path, so a discovery module must emit the hero itself. Toonix now outputs a `Featured`
  `hero` section first (the site's Trending row, 8 items), which also places Continue Watching
  under it as the app intends. Hero art is requested from TMDB at `w780` for a full-width
  banner (the site exposes **no backdrop images**, so hero art is poster art — cropped by the
  app, same as the legacy path).
- Covered by a new regression test; **18/18** pass. No other behaviour changed.

## What it is

- **213 shows + 103 movies** (the site's own catalogue count, parsed from its search page).
  Search, details, episode lists and streams, plus V4 discovery: **Featured (hero)**,
  Trending Now (20), Popular Movies (15), Popular Shows (30) and paged `movies` / `shows`
  feeds with honest `hasMore` (the site itself has no pagination).
- **Audio is mixed and evidence-sampled per title.** Hindi dubs dominate (Ben 10, Doraemon,
  Pokemon, Chhota Bheem, Batman TAS, Adventure Time, Chacha Bhatija, Bandbudh, Roll No. 21,
  sampled movies, Shin Chan), but some titles carry the **English** original (Avatar: The
  Last Airbender sampled `en` 0.643 with clean English dialogue). Route labels therefore carry
  a language word **only for titles that were actually sampled**; unsampled titles show a plain
  `Toonix` label with no language claim. Manifest language: "Hindi + English (mixed)".
- **No captions exist upstream** (the site's player has no subtitle UI) → `subtitles: []`,
  not "unverified".

## Catalogue availability — measured, not assumed

Random sample of **40 shows** (seed 11, each title's S1E1, probed 2026-09-12):

| outcome | count | share |
| --- | --- | --- |
| resolved to a valid VOD playlist | 21 | **52%** |
| worker stub → reported unavailable | 17 | **42%** |
| no player source at all | 2 | **5%** |

**Roughly half of the catalogue has no working stream on the source site itself.** The stub is
`Stream token not set. Open /admin to add one.` (HTTP 503, 45 bytes) and the site's own player
receives exactly the same response — so this is upstream content state, not a module fault, and
the module deliberately reports *unavailable* instead of exposing it.

Where a title is dead, it is dead throughout: **Ninja Hattori-Kun Returns** returned the stub
for seasons 1–4 and for every episode tried, on all three CDN mirrors (v1/v2/v3). The owner's
device report for `/show/ninja-hattori-kun-returns/1/14` reproduces this exactly (`503`, 45
bytes → module error `Source unavailable for this episode (upstream stream token missing)`).

## Verified before publish

- **18/18** module regression tests; node contract tester **28 PASS / 0 FAIL / 2 WARN**
  (One Piece 118/1156 and Bleach 51/366 — the source itself holds fewer episodes than the
  series totals).
- **S2 quick PASS** and **S2 standard PASS** on the app's real playback stack (iOS simulator):
  media decode 3/3 (hls, 1401.8 s, h264 1920×1080, 2× AAC tagged `hin`, continuity clean) and
  a seek that rendered the episode frame.
- **Release gate ALL_PASSED**, 4 titles, every one on the first attempt:
  `doraemon` + `ben 10` + `chhota bheem` (HLS `ts_media`) and `shin chan`
  (archive MP4 `mp4_bytes`). Package SHA in the gate matches the ZIP above.
- Language evidence: whisper sampling across 12 targets (tiny → base → small, forced-language
  cross-checks); ffprobe reads the worker audio streams as `language: hin`.

## Known limits (read before judging it)

1. **Audible playback is not proven.** The simulator run logs
   `Could not open/initialize audio device -> no sound` at every checkpoint: video advance and
   seeking are proven, sound and physical-device playback are not. Please check sound on your
   device.
2. **About half the catalogue is unavailable upstream** (see the table above). The `[SUB]`-tagged
   titles (4 Doraemon movies + KochiKame) and sampled anime titles (Attack on Titan, Bleach,
   Death Note, One Piece-Sony, Fairy Tail, Yo-Kai Watch, Mr Bean, Simpsons, Zatch Bell, Looney
   Tunes, many more) answer with the stub or have no source. Reported as unavailable, never
   substituted with something else.
3. **archive.org routes depend on archive.org**: it answered 502/503 for every item (including
   a control item) during part of the audit and recovered. Those routes are validated at
   runtime (redirect resolution + ranged probe + `ftyp`/content-type) and report unavailable
   rather than exposing a broken URL.
4. **Episode lists cap at 400 per series.** Upstream totals measured: Doraemon 1095,
   Pokemon 1032, Chhota Bheem 580, Shin Chan 409, Ben 10 52.
5. **Offline/download and physical-device playback are untested.**
6. **ffmpeg-8 quirk (disclosed):** the CDN's segment URLs are extension-less
   (`/a/<id>`), which ffmpeg 8's default HLS policy rejects; the module appends an
   `&ext=.m3u8` shape hint so HLS-aware consumers handle the endpoint. The CDN ignores the
   parameter (byte-identical response) and the app's bundled player (mpv 0.36.0 /
   libavformat Lavf60.3.100, ffmpeg 6.0) needs no hint.
7. **Icon** is served from the source site (`https://toonix.bond/logo.png`, public PNG) — same
   external-icon pattern as YASTREAM.
8. **Testing capacity**: the testing repository allows three active candidates; Toonix is the
   third (X-Stream, YASTREAM, Toonix). A fourth candidate will fail the CI build until one is
   retired.

## How to test

1. In Player, add the testing repository
   `https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json`
   (or open <https://github.com/kas021/Module-Testing-PL>), accept the community-repository
   confirmation, then Check / download.
2. Open Toonix and confirm the **Featured** carousel now leads the home screen, above Trending
   Now / Popular Movies / Popular Shows.
3. Then try:
   - `doraemon` (51 hits) → Doraemon → any episode → play (Hindi dub)
   - `chhota bheem` (14) → play
   - `ben 10` (5) → Ben 10 → episode → play
   - `shin chan` (43) → Shin Chan → episode (archive MP4 route)
   - `avatar the last airbender` → plays with English audio (labelled `English · Toonix`)
4. Expect "source unavailable" for the titles in limit 2 — that is the honest upstream state,
   not a module defect. If a title you expect to work fails, report it and it can be re-probed:
   the source's availability does change over time.
5. Report back with the exact title/episode, what happened, and whether **sound** played on
   your device.
