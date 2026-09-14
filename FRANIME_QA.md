# FRAnime Direct 0.1.0-beta.1 — QA and known limits

Module: `franime-direct` · identity `SP-VID-080-FRANIME-DIRECT` · family `franime_direct_v1` ·
contractVersion 4 (V4 discovery enabled) · minAppVersion 8.5.33

Package: `modules/Franime-Direct-0.1.0-beta.1.zip`
SHA-256 `756408c0c8b94bd70ef7f0f4896dc2945ca76f34e3949453acb367fae58bae6d`
Runtime JavaScript SHA-256 `5149defd1daf12c98d5434ac15feadb270ba64b1e99686b7465320ad244f2798`

Source: `https://franime.fr` — French anime (VOSTFR / VF). The module uses the site's
public API and decodes its obfuscated player tokens locally in pure JavaScript (the
Cloudflare-protected player page is never loaded); Sibnet / Vidmoly / Uqload / SendVid
embeds are then resolved on-device to physical MP4 / HLS routes and probed before playback.

## What it is

- The full provider catalogue (~2 500 titles) with French descriptions, ratings, and
  episode lists carrying per-episode subtitle/dub availability. V4 discovery rows:
  À la une (hero), Top de la semaine, Les plus aimés, Derniers ajouts, Derniers épisodes
  and Cette saison, plus feeds with honest `hasMore`.
- **Both versions**: `VF` routes carry French audio; `VOSTFR` routes carry the original
  audio with French subtitles inside the release file itself. An episode's VF/VOSTFR
  availability comes from the provider's own data and is exposed as flags; a route label
  always names the version it actually carries — never the requested one.
- **No separate caption tracks exist** (the releases are muxed with their French
  subtitles) → `subtitles: []`, not "unverified".

## Verified evidence (2026-09-14)

- 15/15 local regression tests; live harness journey across VF and VOSTFR.
- 10-title sweep (classics, recent series, films, long-runners): sub 10/10, dub 10/10,
  mid-episode 10/10 — every route probed with real bytes (MP4 `206 ftyp`, HLS `200 m3u8`).
  Median resolve ≈ 1.1 s.
- S2 quick PASS: 30 home cards in 1.2 s in-app, 1 197-episode list for One Piece, stream
  in 1.97 s, playability + download probe OK, first/middle/latest media samples decoded
  (Sibnet CDN MP4 1280×720 H.264 + AAC).
- S2 standard PASS: simulator video advanced 4.6 s → 125 s including seek; screenshots
  captured. The simulator reported "could not open audio device" at every checkpoint, so
  **audible sound is NOT verified**.
- Release gate ALL_PASSED (Package / Home / Search / Details PASS, 3/3 streams
  segment-OK on the first attempt).

## Known limits

- **Audible playback, physical-device, download-to-disk and offline checks are
  incomplete.** These are the top remaining checks.
- SendVid is in a site-wide outage (HTTP 502 on its embed endpoints). Its routes fail
  gracefully; re-verify when the host recovers.
- Host coverage across all (episode, language) entries: Sibnet 97 %, Vidmoly 85 %
  (union ≈ 98 %), Uqload ≈ 16 %. **Not resolved in this beta:** filemoon/Byse
  (proof-of-work + domain-gated API), VK, Dailymotion/YouTube embeds, and
  `TELECHARGEMENT` download-only entries — an episode with none of the supported hosts
  reports "source unavailable" honestly.
- One sampled entry (One Piece's live-action season) carries English audio because that
  entry's "original version" is the English-language Netflix show; anime entries carry
  Japanese audio with French subtitles.
- The first home load downloads the ~10.5 MB provider catalogue (≈0.3 s on a fast
  connection; cached for 10 minutes in-app).

## How to test

1. Add this repository in Player (accept the community-repository prompt), then check
   for updates and install FRAnime Direct.
2. Open Home — check the hero row and the other rows load; open a title and check the
   French description and the episode list.
3. Play an episode on **Sibnet** in VOSTFR, then switch the same episode to VF (or the
   reverse). Check audio and subtitles, pause/resume and seek.
4. Try a film (e.g. Kimi no Na wa) and a long series (e.g. One Piece, Boruto).
5. Report any failure with the title, episode, module version and what you saw — a
   spinner that never resolves, wrong language and missing sound are all useful reports.
