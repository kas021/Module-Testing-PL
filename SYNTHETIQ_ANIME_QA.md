# Synthetiq Anime 1.0.4 — Testing Candidate QA

## Why this build exists (owner-reported)

During the Vidhawk media-relay outage (2026-09-26), Synthetiq Anime 1.0.2 was fully dark:
every play went `vidhawk resolve 200 → play 200 → proxy.vidhawk.buzz/hls.m3u8 502`
(the relay's upstream `hls.1embed.buzz` answers Cloudflare 403 to all header variants —
provider-side, not module-side). The module's only secondary path (anicrowd) was dead at
DNS level, so the chain had no way around the outage.

## What changed

**1.0.3 → 1.0.4 changes vs 1.0.2 (cumulative):**

1. **AniKage rescue source (labelled).** When the primary chain has no VERIFIED media, the
   module resolves the same episode through AniKage's JSON API (`anikage.cc`, providers
   koto/wave/zen/dib/neko) and returns routes only after the same byte-level media check
   as the primary path (master → variant → real segment bytes: TS sync 0x47 / fMP4).
   Routes are labelled `AniKage · <player> (<provider>)` — never disguised as the primary.
   Language is guarded: a rescue answer must match the requested audio (slug + episode +
   subType), so no cross-language substitution.
2. **Byte-first segment classifier.** The old probe rejected segments by suffix/header
   (`.jpg`-named real MPEG-TS on the MegaPlay CDN was thrown away). It now classifies by
   the bytes (`0x47` TS / `styp|moof` fMP4 / PNG-wrapped TS) and rejects only on positive
   error evidence (HTML/JSON/image magic). Verified live: `seg-1-f1-v1-a1.jpg` is a real
   MPEG-TS (0x47 sync at 0, 188, 376) served with `content-type: image/jpeg`.
3. **App-bridge byte-cap fix.** The app bridge caps binary responses at 512 KB by default;
   these CDNs ignore `Range` and send ~0.5–0.6 MB segments, so the probe was silently
   dropped in-app (worked in Node). Probe requests now pass `maxBytesHint` (2 MB) through
   `fetchv2` — drops gone in the app runtime.
4. **Outage-resilient orchestration.** The rescue starts in parallel with the primary chain
   (one wait, not the sum), stops the moment the first verified route exists (measured
   in-app: route at ~1.3 s), and is halted immediately when the primary chain wins.
   Result delivery avoids the app JS engine's known starvation of reactions chained onto
   already-settled promises (plain field + short poll instead).
5. **1.0.4: fair sweep rotation.** One provider's hung embed can no longer eat the whole
   rescue budget (koto once ate 8 s of a 10 s budget while wave/zen carried the episode);
   each provider is now time-boxed (~3.2 s) and the sweep rotates; budget 12 s.
6. **1.0.4: stalled-request caps.** A single stalled TCP read no longer hangs a caller:
   `anilist()`/`jikan()` capped at 9 s, the vidhawk pair resolve capped at 10 s (stall ⇒
   rescue engages within the bounded wait). This fixed repeated house-tester episode-walk
   timeouts seen on BOTH candidate and shipped baseline in the same windows.

## Evidence (exact certified bytes)

- ZIP: `modules/Synthetiq-Anime-1.0.4.zip` — SHA-256 `2a02bfa9bca6310bcf5e512f0d3c143d717094d3c6b29494c07d9b9b307af0b5`
- House tester: **MODULE PASSED** (streams, 9 captions, segment download, 3/3 integrity fixtures).
- Release gate: **ALL_PASSED** — Solo Leveling / Death Note / One Piece, 3/3 `ts_media`, first attempts.
- S2 quick (Flutter app runtime): stream OK ~9.0 s, failureCodes: none (PARTIAL only for the
  optional whisper-language leg); frames + audio artifacts produced.
- Node probes: SL E1/E12 sub, SL E1 dub, Death Note E1 — all ~1.1–1.5 s via `AniKage · MegaPlay (koto)`.
- Baseline contrast (1.0.2, same windows): house tester fails streams + download + integrity walk.

## Rollback

- 1.0.3 ZIP retired into `retired-packages.json` (still fetchable in the repo).
- Pre-publish 1.0.2 baseline archive kept in the module's development folder.
- Testing repo rollback: retire this candidate, re-run `scripts/build.mjs`, commit.
- Official repo: untouched by this candidate.

## Not claimed

- Not a stable/official release — device QA on a real phone still required.
- Episodes the rescue providers themselves do not carry stay unavailable (fail closed, honest
  message). Wave's echovideo entries are stale for some titles (provider-side 404s).
