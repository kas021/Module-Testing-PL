# Synthetiq Flux 1.0.2 — Testing Candidate QA

## Why this build exists (owner-reported CODE RED)

Synthetiq Flux 1.0.1 was fully dark during the Vidhawk media-relay outage (2026-09-26):
its primary provider (Vidhawk flow/zuri via `vidhawk.buzz`) answers tickets, but the media
relay `proxy.vidhawk.buzz/hls.m3u8` returns 502 for every track/title/server/header variant
(upstream `hls.1embed.buzz` → Cloudflare 403 — provider-side). Flux had no second source:
`flow:not_hls_502, zuri:not_hls_502` → "No verified playable source".

## What changed in 1.0.2

1. **AniKage rescue source (labelled).** When the primary chain has no verified media, the
   module resolves through AniKage's JSON API; routes are labelled `AniKage · <player> (<provider>)`.
   This is the ONE designated exception (`opts.allowRescue`) to Flux's independence denylist —
   the primary chain and everything else still refuse those hosts. Rescue routes pass the same
   positive byte validation.
2. **MegaPlay descriptor decrypt** ported (AES-CBC site-published scheme constants, pure ES5 —
   the `enc` field is the modern getSourcesNew shape).
3. **Byte-cap + validated probes:** `maxBytesHint` (2 MB) forwarded to the app bridge for
   segment/init probes; validateHls is rescue-aware (master/variant/audio/segment/init all
   honour the rescue exception where applicable).
4. **Fair sweep rotation + stalled-request caps** (same as Synthetiq Anime 1.0.4): per-provider
   time-boxing (~3.2 s), rescue budget 12 s, `anilist()`/`jikan()` capped at 9 s,
   `providerResolve`/`providerPlay` capped at 10 s — one stalled TCP read can no longer hang
   a call (house-tester episode-walk timeouts were reproduced on the shipped 1.0.1 too).
5. **Parallel orchestration** identical to the Anime module: rescue fired alongside the
   primary chain, first verified route wins (measured in-app 1.7 s), halted when the primary wins.

## Evidence (exact certified bytes)

- ZIP: `modules/Synthetiq-Flux-1.0.2.zip` — SHA-256 `40407a74706eba46aa04b48b2a53197c6c10f9f6fea11c39dcc97624d8ba6dc9`
- House tester: **MODULE PASSED** (episodes 12, streams, 9 captions, segment download, 3/3 integrity fixtures).
- Release gate: **ALL_PASSED** — Solo Leveling / Death Note / One Piece, 3/3 `ts_media`, first attempts.
- S2 quick (Flutter app runtime): stream OK **1.7 s**, failureCodes: none (PARTIAL only for the
  optional whisper-language leg); frames + audio artifacts produced.
- Node probes: SL E1/E12 sub, SL E1 dub (9 subs), Death Note E1 — all ~1.1–1.9 s via
  `AniKage · MegaPlay (koto)`, after `flow/zuri` reject with `not_hls_502`.
- Baseline contrast (1.0.1, same windows): empty streams, no media download, integrity walk timeout.

## Rollback

- Testing repo rollback: retire this candidate (`retired-packages.json`), re-run `scripts/build.mjs`.
- Superseded build of this same candidate (pre-cap bytes) is not retained — certified bytes are the above SHA.
- Official repo: untouched by this candidate.

## Not claimed

- Not a stable/official release — device QA on a real phone still required.
- Episodes not carried by the rescue providers, or whose provider entries are stale
  (wave's echovideo 404s, koto episodes without a working MegaPlay descriptor), stay
  unavailable with an honest message.
