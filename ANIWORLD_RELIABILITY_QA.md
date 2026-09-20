# Aniworld 1.2.0-beta.4

## 1.2.0-beta.4 (2026-09-20) — FIRST ANIWORLD CANDIDATE ON THIS REPO

Current candidate: `Aniworld-1.2.0-beta.4.zip`, identity `SP-VID-050-ANIWORLD` (unchanged).
ZIP SHA-256: `b35a0c82b30a8883fd68ce0f798150410a732478f2cb074ab3011df4d2921df9`.
Runtime JavaScript SHA-256: `a48358dbf7531bb46dc8257f7ff187850934e13fcff03aac0c8faa796d4c1243`.

Owner report addressed: users say Aniworld "works sometimes, doesn't sometimes" (a ~50/50 feel).

Root cause, measured before any change (10 titles x sub/dub x 2 rounds live):
- Every episode lists four hosts (VOE / Doodstream / Filemoon / Vidmoly). The old module could
  resolve only Vidmoly and VOE, tried them one at a time in fixed order, with no retries.
- VOE is currently Cloudflare-walled (4/4 embeds challenged during testing), so in practice the
  module ran on a single working host: when Vidmoly hiccuped for a user, the play dead-ended.
  That is the coin-flip users feel; app-side resets cannot change it.

What this build changes:
- **First-verified host race**: up to three resolvers run concurrently; the first route that passes
  the existing byte-level validation leads, the rest keep filling the Servers list for ~3.5 s.
- **Cooldowns + one smart retry**: hosts answering 429/403/5xx are retried once, then parked
  (Retry-After honoured, 10 min for media hosts, 60 s for the AniList lookup). The catalogue site
  itself is never parked; its per-URL failures (e.g. a dead redirect link) can not freeze the module.
- **New Doodstream resolver** (the site's `playmogo` host): pass_md5 token flow, validated by the
  same playlist+segment probe (a genuine third working host).
- **Vidhawk subtitle backbone** (the same provider the Synthetiq Anime/Flux modules use): in SUB
  mode only, when the German hosts leave fewer than two verified routes, a labelled fallback joins
  — real caption languages forwarded (German first where the provider carries it, e.g. Jujutsu
  Kaisen; English elsewhere), so an episode with every German host dead can still play. Its audio
  is not German and it is never offered as German dub.
- Verified-result cache (4 min) and short dead-end cache (20 s) so double-taps do not re-burn hosts.

Evidence:
- 9/9 mocked reliability tests (race, park + skip, single retry, Doodstream token flow, Vidhawk
  engage + caption labels, Vidhawk skipped when coverage is fine, dub isolation, cache, movies).
- Live matrix: 17/20 resolutions in every round — identical legitimate misses (episodes that carry
  no hosters for the requested language), successes now 0.3–1.6 s (was up to 7 s).
- App-runtime harness: all tests passed (home, search, details, 226 episodes, stream, playability,
  download probe).
- S2 quick certification: all gates passed (audio gate: Japanese detected, no contradiction).
- Release gate: ALL_PASSED — Streams 3/3 on the first attempt (Naruto / One Piece / Jujutsu Kaisen).
- The gate also caught a bug during certification: an early build parked the catalogue site after a
  dead redirect link; fixed (site never parked) — this ZIP is the fixed lineage.
- beta.4 is beta.3 plus the presentation block only; the runtime JavaScript is byte-identical
  (hash above is the certified code).

KNOWN LIMITS (honest):
- Vidmoly remains the workhorse; if Vidmoly itself degrades site-wide, quality of experience
  depends on VOE/Doodstream/Vidhawk. VOE's Cloudflare wall is external and may lift or worsen.
- Filemoon was probed and deliberately skipped (pure JS app, no scrapeable source); it stays in the
  site's host list but is never attempted.
- Vidhawk fallback is subtitle-first: German *audio* still requires a working German hoster.
- Physical-device playback check is still needed from the owner (simulator/S2 and harness only).

How to test (owner): Naruto and Jujutsu Kaisen, Sub and Deutsch; a movie entry; then a title where
the Servers list shows a Vidhawk entry (Jujutsu Kaisen Sub) and play it — captions should offer
German. Double-tap retries should reuse the cached verified route instead of re-resolving.
