# Shahiid 2.1.0-beta.5 - Home and episode-list repair

Historical candidate: owner approved official Shahiid 2.1.1 on 2026-09-12.
JavaScript is unchanged; release metadata only. Beta.5 is retired from the active
testing index. Its original ZIP remains reachable. The PARTIAL evidence and
known failures below are not resolved by publication.
SHA-256: 7748ea01a4cbdfe574577d1d795695ac1555882d7292d18c1d518fa3b80bbb55

## Corrections

- Home now uses series/movie catalogue entries, not individual episode links.
- Featured/latest feeds and blank search also return title entries.
- Nested poster markup is supported; episode cards cannot fill the catalogue limit.
- Long episode lists follow the site's `?epp=N` pagination as well as path pagination.
- Unrelated report links cannot be interpreted as season links.
- Different episode hrefs are preserved even when numbers repeat.
- Special episode numbers are read correctly through Arabic special wording.
- Search caches successful results for 60 seconds, at most ten queries, and coalesces
  identical in-flight requests. No errors or stream URLs are cached.

## Limits

The exact reported One Piece special 3 has only a Google Drive source. That file
returns HTTP 403 and a Terms of Service removal message. The website's download
button refers to the same file. It has NOT been restored or replaced by another episode.

Cold WordPress searches still take roughly six seconds. The faster AJAX endpoint
returned five suggestions and omitted the main One Piece anime, so it was rejected.
Cached search gains apply while the module runtime remains alive.

Three titles on the source catalogue explicitly have no episodes on their own season
pages: Migawari Reijou..., Hua Xianzi: Mofa Xiang Dui Lun, and Suterare Seijo....
Some details artwork is still absent despite populated catalogue image URLs.
Long-list bounds remain 25 pages per season, 15 seasons, 800 total episodes.
Do not call those bounds complete coverage of very long shows.

## Current Evidence

15 deterministic regressions pass, including Home -> details -> episodes,
pagination, stable identities, language guards, cache lifetime and removed media.
Real Flutter runtime for beta.5: import/Home/search/details/episodes/stream passed.
Boruto returned 288 episodes in about 15 seconds, instead of the previous 20.
Live Hunter x Hunter Dub returned 148 instead of 20.

Final beta.5 live Home matrix: 51 unique entries checked; 48 episode lists loaded,
including 45 multi-episode shows and three movies. The three empty shows above
were independently checked on their actual season pages. All 78 Home placements
have catalogue image URLs and none links directly to a single episode.
Regular One Piece episodes 1 and 251 each resolved two servers; the primary route
short-decoded video AND audio. The 25-page bound currently returns 500 episodes
for that season: this is still not the entire One Piece catalogue.
Full search took 7243ms; immediate repeat returned cached results in 0ms (Node).

S2 beta.5 run: 2026-09-12T01-46-27-128Z_s2_shahiid-v1_5b52a5eb.
Automated grade says PASS, but manual evidence review classifies this PARTIAL:
Boruto first/latest resolved and decoded (2/3 episode positions); middle episode
150 failed with Share4max HTTP 404. The grader omitted this failure from its
media summary. Simulator video advanced for 120 seconds and seek/pause passed,
but audio-device initialization failed, so audible output is NOT certified.
Japanese speech was independently detected in a media sample, not in simulator output.
The removed Drive file can still produce a generic module error in the app;
the added specific-error matcher did not recognize the live HTML-wrapped message.
No claim is made that the reported special or Boruto E150 is fixed.

Known prior limitation remains: some Lulustream/tnmr backup links pass HTTP checks
but fail decoder playback. Arabic Dub speech, hard-caption language, physical iPhone/
Android, full downloads/offline and every server are not certified.

Replaces only Shahiid beta.3 in the active testing index. Old ZIPs and bundles remain
reachable for cached indexes. Movie Direct and Mugiwara remain active. No app changes.

## Historical beta.3 Evidence (Not A New beta.5 Playback Matrix)

Owner requested upload. Not a stable release.
SHA-256: 74cd02fe125889497bfb37dc0bcb67a9ee8aa7046427083bd8e285516ce6281e

Fixes: poster parsing, correct Sub/Dub catalogue feeds, explicit server options,
honest unknown-quality labels and additional HTTP media validation.

Eight regression tests pass. Twelve sampled episodes (six Sub, six Dub) each
had a primary stream decode video and audio. All twelve detail posters were
populated. Of 26 returned routes, 14 decoded and 12 backup routes failed.
HTTP probes still do not guarantee playback: some tnmr/Lulustream alternatives
return 403 to the media decoder. No soft subtitle tracks were found in this sample.

S2 standard Boruto run 2026-09-12T01-16-42-977Z_s2_shahiid-v1_7a65adce:
automated PASS for runtime, first/middle/latest media and simulator video/seek.
Manual logs show an audio-device initialization failure: audible simulator output
is not certified. Japanese speech was detected separately in the media sample.
Arabic Dub speech, caption identity, physical devices, downloads and offline
remain unverified. Overall handoff: PARTIAL.

AnimeAV1 1.3.0-beta.1 was temporarily removed from the active testing list to
respect the three-module cap. Its original ZIP and historical bundles remain
available; it has not been promoted to stable or deleted.
