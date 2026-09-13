# Alpha Movies 0.1.0-beta.3

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
