# AnimeAV1 1.3.0-beta.3 — QA notes (owner testing)

Started 2026-09-11 (Europe/London). Queue item 08. Module-only candidate;
official 1.2.8 remains unchanged. Overall status: **PARTIAL / owner testing**.

**beta.2** (hardening) and **beta.3** (Vidhawk subtitle backbone) build on beta.1.
beta.3 fixes the owner-reported "AnimeAV1 SUB hosts failed for this episode"
(One Piece S1E351 SUB): official 1.2.8's non-standard-port guard used the
browser `URL` global, which the app runtime does not provide, so port-183
routes were passed through instead of rejected — playback received an
unplayable av01 MP4 (`a3.mp4upload.com:183`, 205 MB) and, when the same host
stalled (35–46 s observed), resolution fell through to the exact reported
error. beta.3's regex-based port check works in every runtime; the Vidhawk
backbone then rescues the episode (verified 3/3 live runs, 0.6–2.6 s,
labelled route with its real caption languages).

## Frozen Artifacts

- Baseline: `AnimeAV1-1.2.8.zip`, SHA-256
  `2716d949e3b82a3dd89400b514df627920a140c15fc8f47a4b71768b6518a1ac`.
  Downloaded official release bytes match the local ZIP. Exact source is in
  `baseline/`; it is not the candidate.
- Candidate (beta.1, kept as history): `dev_assets/modules/AnimeAV1-1.3.0-beta.1.zip`,
  SHA-256 `b2fbf162a5838bf094392f87be48fbce90c006572e8c2f1eba9e7cfb3fec85a6`.
  Superseded in-workspace by beta.2 (`379c3c88…`, hardening only, no Vidhawk) and beta.3.
- Published testing candidate (2026-09-26): `modules/AnimeAV1-1.3.0-beta.3.zip`, SHA-256
  `570737ff97ca1bb29753162a4025c513e976f13bc57dabc05e044521cea68782`.
  beta.1 retired from the active index, not deleted; both ZIPs remain reachable.
- Identity unchanged: `animeav1-v1`, `SP-VID-060-ANIMEAV1`, number 60.
- Public testing index: https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json
- No app, platform, account, backend, registry or production-module changes.

## Audit and Changes

The site provides catalogue/episode pages with named external embeds. This
module resolves supported embeds on the device; it has no private resolver.
Protected or unsupported providers are not advertised as playable servers.

1. The old module mixed providers into its quality list, skipped HLS after MP4,
   stopped after two or three results, and provided no explicit server list.
   The candidate checks all site-returned supported embeds with up to four
   concurrent workers and a shared 12-second resolution deadline. It retains
   StreamTape/YourUpload/MP4Upload/HLS preference and each server's own headers,
   language and caption context. Menus require no new requests.
2. Removed invented 1080p/720p metadata. MP4 uses Original when height is unknown;
   HLS uses Auto. Real master-playlist variants can expose declared resolutions.
   Variants with external audio groups remain on the master to avoid losing sound.
   Current sampled HLS routes have one rendition, so no extra quality is invented.
3. Removed the broken LookMovie fallback. It used an undefined JSON parser,
   selected the first search hit/season/episode, and guessed Spanish audio.
   Missing Dub now fails clearly without switching title, language or provider site.
4. URL resolution/port checks work without the browser URL global. Range probes
   resolve redirects explicitly; malformed/nonstandard-port routes are rejected.
   Video MIME alone no longer approves HTML, empty or image responses.
5. Added explicitly labelled VTT/SRT HTML-track forwarding where hosts expose it.
   No selectable caption tracks were found in the 53 sampled modes; they are
   not fabricated. One Piece's sampled frame visibly contains burned-in Spanish
   captions. That is not whole-catalogue subtitle-language proof.
6. Bounded request retries cannot start after their deadline. A bridge request
   already in flight cannot be cancelled by this JS module and may finish later;
   it cannot start subsequent work after the deadline. No polling or stream cache.
7. Packaging uses the existing official icon URL instead of the site's favicon.

**beta.2 (reliability hardening, kept in beta.3):** per-host cooldowns honouring
429/403 + Retry-After (park + skip, no retry storms), widened positive media
classes (TS sync byte without TS content-type, PNG-wrapped TS, wider fMP4 box
set), verified episode flags and multi-server packs with runtime safety.

**beta.3 (Vidhawk backbone, SUB mode only):** a labelled secondary source with
the route's REAL caption set (many languages; Spanish first-class where the
provider carries it). Site routes stay primary; the Vidhawk route surfaces when
the site hosts die and becomes the working primary if they all fail. Dub mode
deliberately skips Vidhawk.

## Verification

- 13/13 module regression tests pass: headers, server separation, missing Dub,
  subtitle labels, honest qualities, fake media, relative URLs, no URL global,
  bridge response shapes, timeout bounds, and missing clearTimeout.
- Baseline quick S2 PASS:
  `2026-09-10T23-04-10-342Z_s2_animeav1-v1_420459ae`.
- Initial unpublished candidate failed its Flutter home check because the
  runtime lacks clearTimeout. Fixed with a capability guard and regression.
  Failed run retained: `2026-09-10T23-14-57-650Z_s2_animeav1-v1_499d7d1f`.
- Final candidate One Piece Sub S2 quick PASS:
  `2026-09-10T23-16-06-445Z_s2_animeav1-v1_73587a23`.
- Final candidate Naruto Dub S2 quick PASS:
  `2026-09-10T23-18-04-181Z_s2_animeav1-v1_2d7595bc`.
  Both pass real Flutter import/home/search/details/episodes/stream and separate
  download-range checks, plus first/middle/latest media probes. No complete
  download or offline playback was tested.
- Thirty-title frozen live matrix, seed `2375843803`: 30/30 search identities,
  details and episode lists; 53/53 requested modes resolve (30 Sub, 23 Dub).
  **52/53** eight-second video AND audio samples decode at 90 seconds.
  All 30 titles have at least one decoded mode; this does not mean every mode
  or every title's semantic identity/language is certified. Two backup probes pass.
  Fifteen modes return two verified servers. Median resolution 376ms, p95 645ms,
  max 705ms from this Mac/network; these are not phone startup guarantees.
- Naruto E1 Dub: independent 15-second dialogue samples at 300 seconds identify
  Spanish on StreamTape and HLS. S2's initial Japanese sample includes the
  opening, so it does not establish the spoken dialogue language. Evidence in
  `dialogue-probe.json`; no transcript or signed URLs are committed.
- Sample matrix: `live-probe-2375843803.json`. Reproducible probes and tests are
  adjacent. Runtime raw evidence remains under `MODULE_TESTER/reports/runs/`.
- **Owner-reported defect fixed (2026-09-26, module-side reproduction):**
  official 1.2.8 returned the port-183 route in 2/5 probes (the reported
  "HTTP 206, 33 bytes" MP4Upload request) and threw "AnimeAV1 SUB hosts failed
  for this episode" in 3/5 (same host stalls 35–46 s). beta.3 rejects the
  port-183 route in every runtime and resolves the same episode
  (One Piece S1E351 SUB) 3/3 via the Vidhawk backbone — HLS primary,
  606 / 840 / 2622 ms, captions EN (labelled).
- Workspace tests 21/21 (13 base regressions + 4 reliability + 4 Vidhawk);
  25-title sub/dub matrix parity with the shipped build; Flutter app-runtime
  test pass (JJK, sub+dub).

## Remaining Gates

- **Your Name / Kimi no Na wa, Sub, first episode:** resolves, but the 90-second
  seek sample returned zero frames/audio. The same title's Dub sample passes.
  Follow-up metadata identifies a 6376.8-second AV1/AAC HLS movie, not an empty
  response. Its seek/native compatibility remains unresolved; do not erase the
  original failure or call this a full pass.
- Standard iOS simulator run not attempted for this candidate: only about 3GiB
  internal disk was free and earlier module simulator builds exhausted storage.
  No simulator or physical iPhone/Android playback claim. No app build/reinstall.
- Full episodes, accurate identity across all holdouts, all spoken languages,
  complete Spanish-caption coverage, native switching/seek/resume, downloaded
  playback and offline operation still need owner/native QA.
- Voe/UPNShare/Mega embeds exist but have no verified direct extractor here.
  Only working supported alternatives appear in the server picker.
- The Vidhawk rescue is fail-closed: one observed chain aborted inside its
  internal 9 s budget during a slow run (re-ran clean). If Vidhawk is
  unreachable the result is the honest site-only outcome, never a substitute.
  For the reported episode its captions are English (labelled), not Spanish.
- Episode-list language flags remain title-sampled from the first episode.
  Resolution checks the actual requested episode's group before playing.
- Git diff check for scoped candidate files passes; full-checkout diff check
  reports pre-existing whitespace in ONE, EV01 and tvOS files, left untouched.

## Owner Test

Use the beta from Module Testing PL. Test **One Piece S1E351 SUB first** — the
2026-09-26 report: expected route is labelled `Vidhawk · subs: …` (the site's
hosts are dead/unsupported for this episode; the rescue is the fix). Test
Naruto E1 Sub/Dub (Spanish Dub), both servers, large timeline seeks,
pause/resume, download then offline playback. Test One Piece, Death Note, and
Your Name Sub specifically. Auto/Original is expected when the source supplies
only one rendition. Do not promote to stable until owner approval; keeping
1.2.8 available provides rollback.
