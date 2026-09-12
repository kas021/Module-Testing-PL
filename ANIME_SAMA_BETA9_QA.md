# Anime Sama 1.1.0-beta.9 — catalogue repair, 12 September 2026

Published for owner testing only. Overall PARTIAL. This update changes Anime Sama catalogue discovery only; its playback resolver and shared media helper are unchanged. AniWorld 1.1.0-beta.6 remains unchanged. No app code, app builds, official packages, or existing ZIP bytes changed.

## Catalogue fix

Source Type metadata marks both “After the School Belle Dumped Me, I Became a Martial Arts God” and “After the Moonlight Falls” as Scans. Both return zero live module search results. Mixed Anime/Scans entries remain, including Solo Leveling and The Beginning After the End; Manhwa genre tags do not exclude an anime. The source's type[]=Anime plus type[]=Film filters are an intersection, not a union, so the parser filters actual card Types instead of applying that lossy combined query.

Home, search, catalogue feeds and fallback probes share live availability checks. Active episode-array entries are required; commented panels and empty/unreleased collections are not exposed as playable entries. The older Home failure Everyone Loves Her has only a panneauScan entry. Availability checks inspect at most three source-ordered panels and fail closed: unknown or timed-out cards may be temporarily omitted, without caching them as unavailable. Positive availability is cached for five minutes. Refresh can recover failed cards.

Each Home/search/feed handler shares an 18-second budget, with four concurrent availability checks. In-flight network requests cannot be cancelled by the shipped API; the deadline limits awaiting and further scheduling. Cold host timings: discoveryHome() 3842ms; searchResults(Solo Leveling) 471ms; searchResults(After the Moonlight Falls) 3475ms; discoveryFeed(popular, 1) 1826ms. Never-resolving request injection: discoveryFeed 6002ms; discoveryHome 18000ms; searchResults 18001ms. These are Node bridge timings, not a fresh phone runtime certification.

## Fresh frozen probe

Seed 2026091209, frozen 2026-09-12T09:44:02.854Z; 20 fixed titles plus 10 seeded Home selections. Run 2026-09-12T09:45:09.804Z to 2026-09-12T09:51:25.084Z. Each available language samples distinct early/middle/late episode positions. Success requires a one-second host decode with video and audio. This is not sustained playback, spoken-language identification, every-alternative decoding, app downloading, or native UI QA.

| Language | Short AV decode | Unavailable title-language cases |
|---|---:|---:|
| Sub | 84/85 | 0 |
| Dub | 58/67 | 6 |
| Total | 142/152 | 6 |

Unresolved search identities: Attack on Titan. They were not silently replaced or counted as playback passes. Home details/episode navigation: 10/10 had a nonempty details title and actual episodes; exact values are in the matrix. Every feed alias was checked at pages 1 and 2.

The previous 137/155 result belongs to beta.7 and is historical. Interrupted development probes are retained locally as preliminary files and are excluded from these counts. The owner's report that playback/downloads were good is user-reported; the exact episode was not supplied and is not inferred.

## Source servers, alternatives, quality and captions

The matrix records every source epsN candidate for each sampled episode and requested VF/VF1/VF2 or VOSTFR label, beside the returned servers, URLs, headers and qualities. 151 validated server rows and 282 quality rows were returned across these attempts. Labels observed: 720p, 480p, 1080p, 360p, 900p, 432p, 384p, 402p. HLS numeric labels come from actual playlist RESOLUTION; MP4 Auto does not invent a resolution. Only the primary route was AV-decoded per sample; other returned routes passed the existing media-byte/playlist checks.

| Source host | Candidate occurrences | Current handling |
|---|---:|---|
| video.sibnet.ru | 135 | Supported; only validated results returned |
| ansembed.net | 166 | Supported; only validated results returned |
| lpayer.embed4me.com | 70 | Unsupported; omitted |
| minochinos.com | 42 | Unsupported; omitted |
| sendvid.com | 59 | Unsupported; omitted |
| oneupload.to | 14 | Unsupported; omitted |
| smoothpre.com | 35 | Unsupported; omitted |
| dingtezuni.com | 8 | Unsupported; omitted |
| movearnpre.com | 3 | Unsupported; omitted |
| uqload.is | 34 | Unsupported; omitted |
| vk.com | 1 | Unsupported; omitted |
| vkvideo.ru | 1 | Unsupported; omitted |

Supported does not mean every candidate worked: supported routes can be absent because resolution/media checks fail or the shared resolver deadline expires. Exact per-source failure attribution is not inferred from provider names. Independent one-embed-per-host HTTP checks are in host-results.json; HTTP 200 is not playback proof. The dub audit saw Sibnet 403, Sendvid 502 and missing ansembed 404 examples, alongside accessible ansembed and embed4me responses. No bypass or new host resolver was added.

Transport deduplication retains URL, headers and caption context. Regression coverage verifies that identical routes dedupe while different headers remain separate. Existing resolver code is unchanged.

Dub caption inspection: 10 embeds, 4 accessible HTTP 200 responses and 2 valid HLS playlists. Found 0 explicit embed track declarations and 0 HLS subtitle declarations. Blocked/missing responses cannot establish caption absence. No soft subtitle tracks were invented for burned-in captions. Results apply only to these samples.

## Validation and remaining gates

25 regression tests pass, including medium filtering, unreleased collections, retry after transient failures, bounded handler work, language separation and transport deduplication. Static S2 package inspection passes with two root entries and no issues. Testing release-policy tests and exact bundle membership pass; every prior package/bundle byte is preserved. No fresh Flutter/native certification or app rebuild was performed in this follow-up, as requested. Existing native/audio/offline limitations remain.

Module ZIP SHA-256: 2cf3f85e0e187d3d2d9e03172f5feb48a8dc3a7034500e62798911d9454e9504

See QA/anime-sama-beta9/ for the frozen plan, final matrix, summary, live catalogue checks, timing injection, caption audit and host probes.
