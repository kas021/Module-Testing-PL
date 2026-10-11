# SoloLatino 0.1.0-beta.6 — new TEST source

11 October 2026. Target device builds verified: Player **8.5.33+95** and the **V9 line (9.0.71+250)**.

## What it is

- New source: **sololatino.net** — Spanish-Latino movies, series and anime.
- Module `sololatino-v1`, identity `SP-VID-067-SOLOLATINO` (video #67), contract 4 with `discovery_v1`.
- Home rows + paginated series/movies feeds, keyless search on the site's own JSON API.

## What was verified

- **House tester: PASS** (28 pass / 0 fail; two explainable warnings — the site's "One Piece" is the 2023
  live-action series with 16 episodes, while the generic fixture expects the anime's 1156+).
- **Release gate: ALL_PASSED** — "Mr. Robot" (44 episodes) and the movie "Hugo 24"; both streams
  byte-verified (real MPEG-TS segments) on the **first attempt**.
- **App runtime, both lines: ALL PASS** — home (40 cards), search, details, 44 episodes, ~1 s stream
  resolve, playable HLS (`application/vnd.apple.mpegurl`), download probe 206 with real playlist depth.
- **S2 quick: grade PASS** — runtime PASS; media sample decoded with real frames (0 s and 10 s);
  audio detector: **Spanish, confidence 1**. Two samples recorded transient TLS `Broken pipe` probes and
  were hand-verified byte-clean minutes later (master 200 in 0.07 s, TS sync `0x47`).
- Manual breadth sample: El Señor de los Cielos T10E52 → `Latino · Vidhide · 720p` (ffprobe: h264
  1280×720 + AAC).

## How it works, in one paragraph

Search and episode lists come from the site's own pages/API. Playback decodes the site's embedded player
**inside the module**: a client-side proof-of-work unlocks AES-encrypted server links (all in plain JS),
then the Vidhide-family server is resolved to a signed HLS playlist and reported with its real quality
label (e.g. "720p"). Everything the app shows is derived from bytes the source actually serves.

## Known limits (worth testing around)

- **PREMIUM player is not used.** The site's premium host answered "No hay servidores disponibles" for
  every title sampled — playback relies on the "Servidor 1" family.
- **Streamwish/Voe mirrors are not resolved yet** (obfuscated loader / human-check wall). If Vidhide is
  down for a title, that title has no fallback server yet.
- **Spanish (Latino) audio only**; the source serves no caption tracks, so subtitles will be empty.
- Testing-only: nothing is published to the production repository.

## How to test

- In Player: Settings → Media & Sources → **Check**, install "SoloLatino" from the "New source available"
  card (if an older copy is installed, delete it first), or import the ZIP manually.
- Good first tries: search **Mr. Robot** (44 episodes, 4 seasons), a movie like **Hugo 24**, and a current
  show like **El Señor de los Cielos T10E52**.

## Update — 11 October, same day

The first package (`0.1.0-beta.5`) reused identity number **61**, which `animeunity-v1` already owns, and
the app rejected the **whole TEST repository** with "Repository contains duplicate module identity
numbers". The package was re-cut as **0.1.0-beta.6** with identity **`SP-VID-067-SOLOLATINO`** (verified
free in the local registry and both live indexes), and `0.1.0-beta.5` was withdrawn from the index,
catalogue and bundle (its ZIP stays in `modules/` for rollback). Nothing in the module code changed.
`scripts/verify_repository.mjs` now also fails on any duplicate identity number, so this cannot ship
again unnoticed.
