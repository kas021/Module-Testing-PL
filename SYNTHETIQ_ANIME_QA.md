# Synthetiq Anime 1.0.3 — Testing Candidate QA

## Why this build exists (owner-reported)

During the Vidhawk media-relay outage (2026-09-26), Synthetiq Anime 1.0.2 was fully dark:
every play went `vidhawk resolve 200 → play 200 → proxy.vidhawk.buzz/hls.m3u8 502`
(the relay's upstream `hls.1embed.buzz` answers Cloudflare 403 to all header variants —
provider-side, not module-side). The module's only secondary path (anicrowd) was dead at
DNS level, so the chain had no way around the outage.

## What changed in 1.0.3

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

## Evidence (exact certified bytes)

- ZIP: `modules/Synthetiq-Anime-1.0.3.zip` — SHA-256 `d77246ca141158754aeda8fb4328153912dc9361e83e988a1af281ce876f60b0`
- House tester: 31 PASS / 0 FAIL (streams + 9 caption tracks + 626,040-byte segment probe).
  Baseline 1.0.2 fails 2 (empty streams) in the same window.
- Release gate: ALL_PASSED — Solo Leveling / Death Note / One Piece, 3/3 `ts_media`
  (three different CDNs), 2 routes each.
- S2 quick (Flutter app runtime): stream OK in ~9.0 s, media decode OK (h264 1920×1080 +
  AAC), 9 subtitles; failure codes: none (PARTIAL solely for the optional whisper-language
  leg). Frames + audio sample artifacts produced.
- Multi-title Node probes: Solo Leveling E1 sub/dub, E12 sub; Death Note E1 sub — all served
  via `AniKage · MegaPlay (koto)` after Vidhawk failed all probes.

## Rollback

- Pre-publish archive of 1.0.2 baseline kept in the candidate folder (`Synthetiq-Anime-1.0.2-baseline.zip`).
- Testing repo: retire this candidate (move ZIP to `_module_history/`, re-run `scripts/build.mjs`).
- Official repo: untouched by this candidate (Synthetiq Anime 1.0.3 is testing-only until device QA).

## Not claimed

- Not a stable/official release. Device QA on a real phone is still required.
- Rescue route subtitles are the provider's own caption tracks (mapped labels); the primary
  chain's caption set is unchanged.
