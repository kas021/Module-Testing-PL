# Toonix 1.0.0-beta.5 — QA and known limits

Module: `toonix-v1` · identity `SP-VID-076-TOONIX` · family `toonix_v1` · contractVersion 4
(V4 discovery enabled) · minAppVersion 8.5.33

Package: `modules/Toonix-1.0.0-beta.5.zip`
SHA-256 `f281f24350fb239cb21c8d52db61102f87ed43974d461619aa045deb00bb1c55`

Source: `https://toonix.bond` — a Next.js site whose watch pages embed a signed HLS player
source served by a three-host Cloudflare worker CDN (identical token accepted by all three =
mirror failover), plus `archive.org` MP4 files for some titles.

## What it is

- **213 shows + 103 movies** (the site's own catalogue count, parsed from its search page).
  Search, details, episode lists and streams, plus V4 discovery: Trending Now (20),
  Popular Movies (15), Popular Shows (30) and paged `movies` / `shows` feeds with honest
  `hasMore` (the site itself has no pagination).
- **Audio is mixed and evidence-sampled per title.** Hindi dubs dominate (Ben 10, Doraemon,
  Pokemon, Chhota Bheem, Batman TAS, Adventure Time, Chacha Bhatija, Bandbudh, Roll No. 21,
  sampled movies, Shin Chan), but some titles carry the **English** original (Avatar: The
  Last Airbender sampled `en` 0.643 with clean English dialogue). Route labels therefore carry
  a language word **only for titles that were actually sampled**; unsampled titles show a plain
  `Toonix` label with no language claim. Manifest language: "Hindi + English (mixed)".
- **No captions exist upstream** (the site's player has no subtitle UI) → `subtitles: []`,
  not "unverified".

## Verified before publish

- **17/17** module regression tests; node contract tester **28 PASS / 0 FAIL / 2 WARN**
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
2. **Unavailable upstream, reported as unavailable (never substituted)**: the `[SUB]`-tagged
   titles (4 Doraemon movies + KochiKame) and the sampled anime titles (Attack on Titan,
   Bleach, Death Note, One Piece-Sony) return the worker stub
   "Stream token not set. Open /admin to add one." or have no player source at all.
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
2. Install **Toonix**, then try:
   - `doraemon` (51 hits) → Doraemon → any episode → play (Hindi dub)
   - `chhota bheem` (14) → play
   - `ben 10` (5) → Ben 10 → episode → play
   - `shin chan` (43) → Shin Chan → episode (archive MP4 route)
   - `avatar the last airbender` → plays with English audio (labelled `English · Toonix`)
3. Expect "source unavailable" for the titles in limit 2 — that is the honest upstream state,
   not a module defect.
4. Report back with the exact title/episode, what happened, and whether **sound** played on
   your device.
