# Alpha Movies 0.1.0-beta.3

## 0.2.0-beta.1 Update (2026-09-18) -- FIRST MULTI-SOURCE BUILD

Current candidate: `Alpha-Movies-0.2.0-beta.1.zip`, same identity 79.
ZIP SHA-256: `d7f8507509af725809420a14ee0f0a5e74e48978f2ca2e49aecaa493c6ec50d8`.
Runtime JavaScript SHA-256: `7776aa8b79d1ddc15ea11b388c42226c918239bee7df626e809c3e8b6a1a121d`.

This is the build the owner asked for: instead of one stream source, the module now
aggregates THREE independent sources behind one pipeline -- Vidrock (as before), Videasy
(api.speedracelight.com, English endpoints) and Stream Unity (streamingunity.vip ->
vixcloud.co, phone-side English HLS). All three are queried in parallel; one source being
down can never remove another source's streams; and every play returns MULTIPLE validated
servers so a dead link no longer dead-ends (the "video failed to start" report).
Each source keeps its own required request headers. English audio only; captions are
offered in any language the sources provide (Cinejoy-first with the existing fallback).
AES-128 encrypted HLS (the vixcloud case) is now validated positively via its key
resource instead of being rejected for lacking a plaintext signature.

Evidence so far: 69/69 mocked regression tests (3 new provider tests, incl. a
videasy payload known-answer fixture and the full Stream Unity chain). Live host run:
Inception -> 10 candidates from all three sources -> 7 validated servers in 2.8 s, with
28 caption languages and English captions hydrated; The Office S1E1 -> 5 servers in 3.2 s.

KNOWN LIMITS (honest): the app-runtime/S2 check has NOT yet been run for THIS package;
physical-device playback, audible-audio and caption synchronisation remain unverified;
the earlier tester-side items (language detector, media-offset intermittency) are
inherited and unchanged; caption labels beyond the sampled titles are not individually
adjudicated; no module artwork icon yet. Recommend testing on titles that FAILED before
(e.g. Chess in Concert, Another World) to see whether a second source now recovers them.

How to test: install this candidate from the testing repository, then
1. Search Inception (2010) and play it; in the play screen, switch between the offered
   servers/qualities -- each should play.
2. Try The Office S1E1 and one title that previously failed for you.
3. Open the caption menu and switch between languages; the list should be longer than
   before (up to ~28 languages on popular titles).
4. Send a playback report for any failure with title, episode and module version.

## Beta 12 Update (2026-09-14)

Current candidate: `Alpha-Movies-0.1.0-beta.12.zip`, same identity 79.
SHA-256: `41090c92bd203ba0152d3f3448d6b96adf58c888a2b98117d001f3359ac2a617`.
Runtime JavaScript SHA-256:
`ef8f9b46a0780eaaff72c66e15525177b20964316ac3cebadcb6187c0ba6e8f9`.

TV category pages are now filled across bounded batches instead of stopping at the
first non-empty batch (observed 3--5 to 11--13 cards, no duplicates). Title ranking
is two-tier so loose matches can never collapse the home rows; poster recovery keeps
the "every missing poster recovered, never substituted" contract with six workers;
caption files get timing-sanity checks (ordering, non-positive durations) while
single-cue files stay valid. The beta.6 Another World loading fix is unchanged.

66/66 mocked regression tests pass. Live: a 12-case journey (Another World 2025,
Silo S2E9, Game of Thrones S8E6 and others) returned exact identities, posters,
episode identities and English captions 12/12; a 30-title sample decoded audio and
video on all 30 with zero corrupt-packet warnings (resolve median 2.67 s, p90 5.1 s);
Avatar's seven routes all decoded 20-second samples from a 30-second seek; a 66.8 MB
episode was downloaded once and decoded offline at three offsets with no warnings.
Another World resolves in ~1.4--1.8 s on the host. Playback paths are unchanged from
the reviewed beta.11 except the feed and caption logic above (108 of 1,899 lines).

S2 note: the current S2 build reports FAIL for this candidate on two tester-side
defects -- its HLS demuxer flags are gated on a URL-suffix check (opaque playlist
URLs are probed without the flags) and its language detector lacks hints for 13 of
the 14 declared caption languages (its `pt` hints even include single letters that
score any Latin text at confidence 1.0). Evidence and a proposed tester repair are
in the module's TESTER_REPAIR_PROPOSAL.md; the production tester was NOT modified.
With those defects neutralised in a scratch tester, the same candidate runs to zero
failure codes.

Physical-phone playback, audible sound, subtitle-language review and offline checks
remain outstanding. Another World's original phone hang is fixed on host/simulator
evidence only -- re-test on your phone. Old package and bundle URLs are retained.


## Beta 5 Pagination And Poster Fix (2026-09-13)

Current candidate: `Alpha-Movies-0.1.0-beta.5.zip`, same identity 79.
SHA-256: `e67934735db4d8aaee2f65adc7060cd63abde10f8c2ea2291b7f98f54e3579b8`.
Index SHA-256: `24ba2f8451ac98be8b839e602e2cb6ae0f772671a12ad908dbe1178cabb56ba4`.

The old `viewAll` string did not match the app's object contract, disabling
scrolling. Correct feed descriptors and real MediaWiki cursor pages replace
the capped full-pool feed. Failed identity lookups preserve the next page;
concurrent calls and page revisits retain stable title identities.
Missing posters use the exact TMDB canonical page as a fallback. No unrelated
image is substituted when both metadata sources lack artwork.

39/39 mocked regression tests passed. A live development snapshot returned
20 home cards in 2.442s, recovering five of six missing images. Movie pages
two/three returned 17/17 additional cards; TV pages returned 2/1. All four
pages had no duplicates and offered continuation. These are host checks,
not a physical-device scroll certification or unlimited catalogue coverage.

Another World (2025), TMDB 1470329, is correctly matched. Its beta.4 baseline
returned two servers and simulator video advanced to 113 seconds, but audio
initialization failed and a host continuity check timed out with corrupt-packet
warnings. Its phone loading issue is still unresolved. No playback fix is
claimed by this catalogue update. Overall certification remains experimental;
full phone/audio/offline checks and subtitle language review are outstanding.
Final beta.5 S2 standard `2026-09-13T12-20-32-083Z_s2_alpha-movies_524f4157`:
BLOCKED. Flutter compilation failed copying its test cache with errno 28,
No space left on device; runtime timeout followed without module results.
No beta.5 native playback pass is claimed. This remains the owner's experimental
testing channel, not a stable release or Synthetiq Movies replacement.

Exact beta.5 host recheck: Home 2.003s, 20 cards, one missing image. Movie
continuation pages returned 17/17 and TV pages 2/1 additional cards with no
duplicates. Both Another World servers decoded 20-second host samples when
explicitly treated as HLS, but both emitted packet-corruption warnings. These
warnings do not establish the cause of the phone hang. Playback code is
unchanged from beta.4. No complete download, offline or phone QA is claimed.

Update to beta.5, reopen Alpha Movies, scroll beyond the initial Home rows and
open View All. Check poster recovery, then send the phone playback report for
Another World if it still hangs. Do not reset account data or remove other sources.
Old package and bundle URLs are retained. No official module or app changes.

## Beta 4 Homepage Hotfix (2026-09-13)

Current testing package: `Alpha-Movies-0.1.0-beta.4.zip`, same identity 79.
Package SHA-256:
`c503a8b91e3051caf25540f999d7bd7fbf86b00cf3830e32a8e655f5f4478275`.
JavaScript SHA-256:
`18588a43149534ab1bbc131debb7817eb9300639d5bcf4b0220f4bd9ee91d8b3`.

The previous real discovery-home path made 23 requests in an observed cold-module
run, including many sequential SPARQL batches, before returning any sections.
The older S2 home check used the smaller `searchResults('')` path, missing this
expense. Catalogue failures could also be cached as an empty success.

The first screen now uses two small category requests, two direct entity batches
and one poster batch (five successful-path requests). It does not query SPARQL,
pageview statistics, complete feed pools or video providers during initial home.
Only unambiguous TMDB-backed identities are returned; these are catalogue entries,
not a promise every title has a playable provider stream. Home calls coalesce and
share a short snapshot. Failed lookups are retryable and one failed category does
not discard the working rows. Poster failures retain title cards.

34/34 mocked regression tests pass. A preliminary fresh-module live run returned
20 titles in three sections in 1.031 seconds and five requests, versus the earlier
23-request run at 6.047 seconds. These are this connection's observations, not
guaranteed phone timings. The full View All feed path is unchanged and can still
be slower. Playback, audio and caption certification limitations below remain.
Old beta.3 package/bundle URLs are retained for cached-index compatibility.

Repeated side-by-side live discovery checks (fresh module context each time):
beta.3 took 23.454s and 82.157s, with 23 requests and 57 row entries each;
beta.4 took 1.026s and 1.059s, with five requests and 20 row entries each.
The smaller initial page is intentional; View All retains the larger feeds.
Source-hashed evidence: `home-2026-09-13T11-56-02-543Z.json` in the local review.
Final-package Flutter runtime home returned 20 entries in 960ms. Search and
the runtime contract passed. These do not constitute physical-phone UI proof.

Final beta.4 S2 standard run `2026-09-13T11-56-01-488Z_s2_alpha-movies_5aa229d1`:
runtime and all three host media checks passed. Simulator video advancement and
seek checks passed this time, but telemetry reported audio-device initialization
failure (no sound). Overall S2 remains FAIL for subtitle-language contradictions.
Do not interpret this intermittent playback result as an audio/physical-device
certification or a repair of the untouched playback resolver.

Test this fix by updating to beta.4, switching to Alpha Movies, loading Home,
opening a Featured title, then returning to Home. Search and other modules should
remain unchanged. If Home still fails, share a support report with module version
and whether Search also fails; do not reset app data.

## Earlier Beta 3 Evidence

Owner-approved experimental testing release, 2026-09-13. This is NOT a stable
release or a replacement for Synthetiq Movies. Install it as a separate source.

Identity: `alpha-movies` / `alpha_movies_v1` / `SP-VID-079-ALPHA-MOVIES` / 79.
The unpublished prototype used 78, already owned by Drama Direct. First public
testing distribution uses 79. Existing official modules are unchanged.

Playback JavaScript is byte-identical to reviewed beta.2:
`59df3508e2922dbe8018448721f80b0ddcb7bd9ed942001101bb88945a39bda9`.
Beta.3 changes only package version, identity and testing description.

## Evidence And Limits

- 28/28 mocked regression tests passed.
- Final beta.2 fixed-ID resolution: 6/6 titles returned streams, English caption
  files and Arabic options. Other advertised languages were not all verified.
- An earlier exploratory source snapshot resolved 18/20 titles. Game of Thrones
  and Severance timed out; successful calls reached 42 seconds. This was NOT a
  20-title device playback test or exact final-package certification.
- Beta.2 S2 standard: FAIL. Flutter import/catalogue/episodes/resolution and
  three host media checks passed for Inception. Simulator playback failed with
  `tcp: ffurl_read returned 0xffffffc4`; pause/seek completion was not proven.
- S2 also flagged Persian subtitles as Arabic. Sample inspection found Persian;
  the tester has no Persian classifier. The correct Persian label was preserved.
- Spoken audio, physical-device playback, complete downloads, offline playback
  and full subtitle synchronization remain unverified. Multiple server names
  still depend on one provider, not independent providers.

Final beta.3 package SHA-256:
`bcc468dea865e43efe42b18d4d8b707e6658b058fbaa806e6f5c4d1df85179b0`.
Final-package S2 quick run `2026-09-13T11-44-07-337Z_s2_alpha-movies_2421776d`:
Flutter runtime passed; all three media checks passed; overall FAIL for
`LANGUAGE_CONTRADICTION`. The detector flagged several additional caption
languages beyond Persian. These have not been individually adjudicated; do not
assume all captions are correctly labelled. Quick does not retest the unresolved
simulator failure. Owner requested experimental testing with known failures.

## Owner Test

1. Select Alpha Movies, search Inception (2010), and play Movie.
2. Check video and audible dialogue, then pause/resume and seek forward/back.
3. Try each offered server and quality. Check that audio continues.
4. Select English, then Arabic where available; verify the displayed language.
5. Try Breaking Bad S1E1 and Silo S1E1, then one title of your own choice.
6. Send the playback report for a failure, including title, episode and module
   version. A returned link or successful download alone is not a playback pass.

Do not migrate favourites or remove Synthetiq Movies for this test.
