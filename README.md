# Module Testing PL

Public, opt-in Synthetiq Player testing repository. Maximum three active modules.

Add this repository in Player:
https://github.com/kas021/Module-Testing-PL

Direct index:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

This is a community-format testing index, not signed with the official production key. Accept the community-repository confirmation only if you intend to test these candidates.

**STCine 1.1.0-beta.3 is available for owner testing.**
Updated paginated discovery, complete season mapping, explicit provider choices,
checked qualities and source-specific multilingual captions. 14 regression tests
pass. Final S2 standard is PARTIAL: runtime/media checks and simulator video
advancement passed, but audible sound, spoken language, full offline playback and
cross-server/quality caption behavior are not certified. See [STCine QA](STCINE_QA.md)
for the exact matrix and known failures. This is not a production release.

**X-Stream 1.3.1 is now released in the official repository (Bundle 119).**
The owner approved promotion with the PARTIAL QA limits below. Its JavaScript
is identical to beta.4. The beta is retired from active testing; its old ZIP
and bundle URLs remain available. Toonix 1.0.0-beta.6 remains active and unchanged.
Explicit provider servers, source-specific captions/headers, expiring link cache
and singleton-provider retry repairs. Final-package Flutter runtime/media checks
passed; S2 is PARTIAL, not stable certification. The broader resolver study decoded
27/30 short host samples. See [X-Stream QA and known limits](XSTREAM_QA.md).

**New active testing: Toonix 1.0.0-beta.6.** (published 2026-09-12)
Cartoons, anime and movies from toonix.bond (213 shows, 103 movies) with V4 discovery and a Featured hero row.
Signed HLS through a three-host CDN mirror set with automatic failover, plus validated
archive.org MP4 routes for some titles. Audio is evidence-sampled per title: Hindi dubs
dominate, but some titles carry the English original (Avatar: The Last Airbender), so a
route label names a language only where sampling evidence exists and the manifest declares
"Hindi + English (mixed)". 17/17 regression tests, node contract tester 28 PASS / 0 FAIL,
S2 quick and S2 standard PASS on the app's simulator stack (seek verified), and the release
gate ALL_PASSED 4/4 titles on the first attempt (three HLS titles + one archive MP4 title).
Not a certified stable release: audible playback, offline/download and physical-device
checks are incomplete, the episode list caps at 400 per series, and several anime and
[SUB]-tagged titles have no upstream source. See [Toonix QA and known limits](TOONIX_QA.md).

**Deferred candidate retained: YASTREAM 1.0.1-beta.2.**
Owner has paused YASTREAM because playback remains inconsistent, including
Abra-ca-Empty S1E2. Do not treat it as reliable. Latest local fallback repairs
have not been published. The retained beta below is unchanged.
Adds Featured and byte-verified handling of MPEG-TS chunks mislabelled as PNG.
Backdoor episode 3, Parasite and Train to Busan passed short host AV checks
at the start and 90 seconds. This is not iPhone playback certification.
Owner-requested testing only, not a certified stable release. Search, episode
identity and provider-header handling were updated; 11 regression tests passed.
Broader live QA was interrupted by disk exhaustion. Some provider streams are
rejected and metadata can contain upstream errors. Native playback, download,
offline and language certification are incomplete. See [YASTREAM QA](YASTREAM_QA.md).
AniWorld 1.1.1 and Anime Sama 1.1.1 are now in the official repository; their betas are
retired here with all old ZIP URLs preserved. AniWorld's expanded checks decoded
234/249 host samples; known coverage gaps and incomplete native sound certification
remain documented in the [official release notes](https://github.com/kas021/Synthetiq-Modules/blob/main/docs/ANIWORLD_1_1_1_RELEASE.md).
See [historical Anime Sama beta9 QA](ANIME_SAMA_BETA9_QA.md)
and [historical trio QA, exact counts and test instructions](ANIME_TRIO_QA.md).
AniWorld remains PARTIAL: broad host media checks pass, but individual streams fail and
native sound/physical-device/in-app offline checks remain incomplete.

**AnimeKai is deferred to the end of the queue**, with only 8/137 short matrix samples decoded.
The owner requested temporary removal from the official active catalogue as well;
it is not in this testing index. Movie Direct and Mugiwara are parked; all old ZIP/bundle URLs
are preserved. AnimeAV1 was already inactive in the preceding live index.

**Synthetiq Anime 1.0.2** and
**An1me (Greek) 1.1.1** were promoted to the official repository at the owner's
explicit request. Their former beta ZIP URLs remain reachable but are retired
from the testing index and bundle.

Use the [official repository](https://raw.githubusercontent.com/kas021/Synthetiq-Modules/main/repository.json)
for these releases. They are not active testing candidates.

See [recorded candidate evidence and limitations](CURRENT_CANDIDATES_QA.md) and
the [public release notes](https://github.com/kas021/Synthetiq-Modules/blob/main/docs/ANIME_GREEK_OWNER_RELEASE_20260910.md).
Promotion does not mean the known audio-language or Flutter runtime failures
were fixed or fully certified.

**JustAnime 1.1.0-beta.4 is withdrawn**, not promoted: owner phone testing found a freeze around 11 seconds into One Piece episode 1 and missing Featured/endless home browsing. It is deferred to the end of the module queue. See [JustAnime QA](JUSTANIME_QA.md). **KickAssAnime 4.1.0** and **AnimeHeaven 4.1.0** remain available from the official repository.

The previous 4.0.7-beta.1 package remains reachable for cached-index compatibility but is not active. `retired-packages.json` excludes retained old package URLs from the active build. Failed beta.1/beta.2 multi-server experiments were never published.

Released Miruro 4.1.0, YFlix 1.1.0 and Synthetiq Movies 1.2.5 remain retired from testing. Old packages stay archived for rollback.

AniKage is no longer active here. StreamUnity has been retired from testing at the owner's request, not newly promoted to production. Old ZIPs and QA notes are archived for rollback, not listed as installable candidates.

## Maintenance

The Movies candidate uses StreamUnity English/Sub routing, Cinejoy-first subtitles, Wyzie fallback only when needed, and bounded subtitle caching. See [baseline QA notes](SYNTHETIQ_MOVIES_QA.md).

Add one root-manifest module ZIP under modules/, then run `node scripts/build.mjs` and commit the generated index and bundle. Never add credentials or other modules implicitly. Keep module IDs stable. Never modify an already distributed version's bytes.

Every owner-requested test fix must be versioned, pushed here and verified at its public index/package URLs before being described as available. Local-only work is not a delivered test update.

When promoting a candidate to the official repository, retire it from this active index in the same release operation and verify both indexes. The daily/manual cleanup is a fallback: it retires equal or older candidates once the same module has an equal or newer stable version. It never promotes a test ZIP automatically. Archived files and immutable old bundles remain for rollback and cached-index compatibility; only the current index and bundle define active testing modules. This does not uninstall modules from phones. Keep the official repository linked for stable releases.

When no candidates remain, the index is disabled and empty. Existing Player versions may reject an empty repository; add it again when testing resumes. No app-code changes are made here.
