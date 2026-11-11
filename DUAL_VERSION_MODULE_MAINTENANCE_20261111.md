# Dual-version module maintenance — 2026-11-11

## Current Scope: V9 Only

**FLUTTER RESERVED — SYNTHETIQ PLAYER (2) explicitly returned the slot to module
maintenance after all app tests/analysis exited. Serialized V9-only native/S2
checks may resume here. App commits844e41fb and456bf959 change subtitle/navigation
UI, not the module bridge/player engine/fallback algorithm. Source version remains
9.0.106+286; the owner's installed286 predates those local commits. No app build,
legacy work or app-data changes are authorized by this handoff.**

Owner changed scope during this work: repair/test V9 modules only.8.6.7 is
working for the owner and must be left alone. No further legacy repair,
packaging, runtime tests or backport publication will run. Existing private
legacy candidates and results below are preserved as historical evidence, not
remaining task requirements. Do not infer a legacy release from them.

Status: IN PROGRESS, V9 ONLY. TEST158 published for AniKoto-only promotion; exact
public read-back PASS. Miruro/MovieDB repairs remain private, with explicit failed gates.

## Current Delivery

| Module | Current result | Release decision |
| --- | --- | --- |
| AniKoto5.0.6-beta.3 V9 overlay | Native V9 and warm standardS2 PASS; paired Frieren dialogue/frame equality | Published in TEST158; public exact-byte read-back PASS, limits retained |
| Miruro4.1.3-beta.10 | Episode recovery fixed and native/media/audio checks pass; simulator cold timeout | Private; needs completed warm simulator gate |
| MovieDB0.1.0-beta.27 | Deadline defect fixed; real playback still intermittent | Private; diagnostic trace pending Flutter slot |
| Anime1.0.5-beta.9 | Already TEST157; exact current V9 runtime PASS | Keep existing TEST package unchanged |
Official/main publication is prohibited; historical legacy candidates stay private.
No app/player/fallback algorithm, backend, TestFlight, Discord or user-data edits.

## App Versus Module Matrix

Historical matrix requested before the V9-only scope change; retained unchanged.

Source pins: legacy `main`/`8.6.7` at
`aaee1e1b4c59b3683e13ecf88d761ec947281ecd`, pubspec8.6.7+152;
V9 `/Volumes/ZX20/.codex-worktrees/player-v9` at initial inspection
`3db9ad882efb5cd9ff331d212345e352c8493929`, private9.0.106(286).
The legacy source pin is available; it is not proof of the exact App Store binary.
Desktop's older8.5.x test checkout is not the legacy8.6.7 lane.

| Surface | 8.6.7 source contract | Current V9 contract | Maintenance decision |
| --- | --- | --- | --- |
| JS handlers | `searchResults`, `extractDetails`, `extractEpisodes`, `extractStreamUrl(episode,lang[,fresh])` | Same basic handlers and fresh argument | One shared resolver core; no invented V9-only JS |
| HTTP bridge | Native `fetchv2(url,headers,method,body,options)` | Same interface, newer transport/cancellation internals | Preserve bounded standard bridge usage and TLS; test both runtimes |
| Package/identity/caps | V2+ importer; V3 identity validation; max5MiB response and30s configured caps | Same caps/identity foundation, additional fallback validation | Stable ID/family/identity number; manifest lane overlay only where needed |
| Streams | URLs, route headers/cookies, qualities, server alternatives, Sub/Dub, caption/intro/outro fields | Same fundamental stream model; newer validation/queue handling | Shared output shape; validate playable bytes/audio, not labels |
| Download | Runtime test has reachability/sample-download probe | Same, plus current app download orchestration | Module supplies valid route/headers; sample probe is not a completed offline download |
| Catalogue/fallback metadata | Unknown optional config retained; no V9 group UI implied | Validated `sourceFallbacks`, `catalogueMapping`, source preparation and user Off semantics | Preserve current TEST overlay exactly; no fallback algorithm changes |
| Optional content identity | Do not require an unverified/new identity extension | Preserve existing verified canonical IDs where supplied | Never guess title/episode/audio IDs; no unsupported identity fields invented |
| First-party subtitles/Calendar | Do not assume newer native declarations/features exist | Separate native signed repository declarations and adapters | Keep repository-level, not duplicated in module JS; legacy degrades independently |
| Version floor | Public module descriptors currently8.0.0-compatible | TEST bundle floor9.0.0; older V9 import snapshots tested | Never gate all old V9 builds on a beta patch; preserve per-module floor |

Evidence: read-only comparisons of `lib/services/client_module_runtime.dart`,
`js_service.dart`, `module_contract_v2.dart`, `module_storage.dart`,
`lib/models/module.dart`, `stream_source.dart`, and both revisions'
`test/module_app_runtime_test.dart`. Fundamental handlers/models are shared;
native recovery/validation differences are app behavior, not permission to fork
every module's resolver.

## Work Queue And Gates

Historical dual-lane plan below is superseded by current V9-only scope: omit
items4 and all further legacy actions in6–7. Existing shared tooling may be used
for V9 but is not permission to resume legacy maintenance.

1. AniKoto: paired baseline/candidate actual dialogue windows; distinguish intro
   detector flag from wrong Dub and native-host reachability. Keep all real FAILs.
2. Miruro: reproduce empty Sub episodes despite Dub pass; exact title/episode/
   language identity and transient errors must remain distinguishable.
3. MovieDB: inspect actual request/deadline chronology; no blind budget increase.
4. Animebeta9: stage the same narrow retired-relay repair for legacy with its
   existing official manifest (no TEST fallback overlay); exact shared JS bytes.
5. Deterministic shared-core plus explicit manifest-overlay packaging; compare
   script hashes across lanes and retain originals. Native services stay separate.
6. Serialize native8.6.7 source-snapshot and V9 runtime tests; independently record
   import, extraction, download probe, decode/audio/captions, fresh reopen and
   simulator results. Physical phone acceptance belongs to owner testing.
7. Commit coherent module/tooling/evidence changes. Publish only tested TEST
   candidates with signed declaration/hash/bundle/query-free read-back gates.
   Legacy/main candidates remain private for approval.

Three independent bounded workers investigate AniKoto, Miruro and MovieDB in
separate private directories. Lead owns contract evidence, common-core/lane
integration, native test serialization, final decisions and sole TEST writes.

Private evidence root:
`/Volumes/ZX20/.codex-worktrees/player-v9/dev_assets/modules/_development/dual-maintenance-20261111/`.
Prior exact hashes/failures and TEST157 receipt remain in `TEST_SYNC_20261111.md`.
Flutter slot: RESERVED by module maintenance following the explicit app-chat
handoff. The earlier reservation and already-completed8.6.7 snapshot tests are
historical only.

Initial private findings (not release certification): MovieDB has a reproducible
stalled-primary-page deadline defect: the shared15s overall budget can expire
before fallback begins. A narrow outer page wait at the existing10s video
deadline lets fallback start; synthetic baseline red/candidate green. No deadline
increased. Miruro guards reject HTTP-error/partial episode-shaped payloads, but
that does not yet establish the cause of the reported empty list; further bounded
request tracing requested rather than claiming it fixed.

## Package Lanes

The deterministic packager validates pinned input hashes and stable identity,
uses identical `index.js` bytes in both lanes, keeps TEST catalogue/fallback
overlays, reuses exact existing ZIP bytes where possible, and rejects conflicting
overlays. Ten focused packaging tests passed, including required identity fields,
number binding, and rejection of unknown
lane-only metadata rather than silently dropping it. It does not sign native services
into each module or alter deadlines/identity to make a test pass.

| Source | Version | Legacy ZIP SHA256 | V9 ZIP SHA256 |
| --- | --- | --- | --- |
| Anime |1.0.5-beta.9|`b2da8a78f2a3d344a53f802dfac6c4d76cea0b325c005339aba51a653bbe8e29`|`413ca29d5755d5b309f1f5beff00d3ddae5c93469a792590786d69650957c613`|
| AniKoto |5.0.6-beta.3|`58c85822abc9bb59430ff8c9f8e6d2580973f43628a2828b50822fcc0ce72d4e`|`9b8806589bf7c0f3e408088b16be218d548b2cadaed6534ec91de105dcea9a27`|

Anime shared script hash:
`8f5dd88a6535cc5c209d688d3ac63d6199b74956fdbf001d5face0d12122f267`.
AniKoto shared script hash:
`5c48379a7fe81e96a5b43df650e7c4a0f9d90d732ae2c8aeadf70321c3ff97ed`.
MovieDB private draft is being amended after review; do not certify its earlier
draft ZIP by a later source file. Miruro remains under root-cause investigation.

## Current Runtime Evidence

Animebeta9 legacy exact ZIP: native8.6.7 snapshot PASS, One Piece E1 Dub,
2026-11-11T18:33:10Z. Import/load/home/search/details/episodes/extraction passed;
stream resolved9037ms, playability and sample-download probes passed. This uses
unchanged8.6.7 source and its existing177-package resolution under current
Flutter, not an installed8.6.7 iPhone binary. V9 fresh paired runtime now running.
V9 fresh paired runtime PASS18:34:36Z, resolved9049ms with playability and
sample-download probes passed. V9 exact ZIP retains the prior standard S2 PARTIAL
limits recorded in TEST_SYNC.15 retired-relay guard regressions reran PASS.
Legacy candidate stays private; already-published TESTbeta9 bytes unchanged.

AniKoto later dialogue on the exact previously flagged Frieren route detected
English at~300s and~900s; intro metadata0–89s overlaps S2's20s opening sample.
This supports a detector-window artifact, not proof that every Dub is correct;
formal earlierS2FAIL retained. A fresh exact-beta7 paired control is requested,
and real8.6.7 native candidate validation is running before V9 standard rerun.

AniKoto legacy native Frieren Dub PASS18:35:40Z, exact official beta3 ZIP,
import/load/catalogue/details/episodes/stream and sample-download passed; stream
1837ms. Current V9 exact merged ZIP standard One Piece Dub rerun is in progress;
decoded audio detected English. Earlier Frieren FAIL remains in the record and
is not retroactively renamed PASS by choosing another title.

V9 AniKoto One Piece Dub cold run
`2026-11-11T18-36-14-079Z_s2_anikoto-v4_f0167b2b`: native extraction, English
audio/caption detection and decode passed, but formalFAIL
`SIMULATOR_TIMEOUT`/`SIMULATOR_SUMMARY_MISSING` after a124s cold Xcode build.
Warm standard rerun `2026-11-11T18-47-44-365Z_s2_anikoto-v4_e24caab1`:
**S2 PASS**, no failure codes, same exact V9 package hash; English audio/caption
language, native extraction, decode and simulator controls passed with120454ms
advancement. Physical acceptance, audible simulator output (known audio-device
warning), full-episode caption meaning/timing and whole-catalogue coverage remain
unverified. Earlier Frieren and cold-run failures remain above/under raw reports.

Miruro's beta8 strict index-equality draft was rejected: real One Piece has1182
announced indexes but1180 available records. Lead's separate private beta9
fix preserves10s caller budget, shares the still-pending native episode request,
allows a retry to adopt its late result, and reports still-loading rather than a
false empty list. HTTP errors/malformed IDs never become cached episodes;
mapping/episode429 honor Retry-After; cached canonical mapping avoids retry
search failures.15 fixtures pass including concurrent retries and late rejection.
Fresh real One Piece payload has1180 valid unique explicit provider IDs. Native
V9 and S2 tests are still required; no release claim from these fixtures.

MovieDB final private beta27 ZIP:
`2c1fa5d344afcc005d65fda26eac7d75d3dda97bf9c4803609bcd50aa065abd0`;
script `baa37442144b78ce27b012e9102fb4441dbaeb99c8206d4e983c19139a3ef8d7`.
Old26 retained. Lead reran deadline/late-result/timer/invalid-media fixtures;
current native V9 TRON: Ares check running. Prior direct provider trace reached
late primary responses and fallback DNS/401 failures—not live playback proof.

MovieDBbeta27 nativeV9 results: TRON: Ares FAIL10564ms (honest no-playable-stream,
not old budget exhaustion); The Mentalist PASS4123ms with sample-download probe,
then a fresh standardS2 native run FAIL3007ms, `RUNTIME_PROCESS_FAILED`/no playable
stream. This is real intermittency, not stable success; module-only request tracing
is continuing before any promotion. Earlier private26 ZIP retained.

Miruro lead beta9 final private ZIP:
`45fe94d10623bf77982a2e07be0d348692b027a77325f21e87c93a0db7319266`;
script `bd770d0611a381f6f8d1d0457d9903bb787b67f786068fb2981afa46d2e98001`.
18 regression fixtures pass. Additional review fixes: shared uncached mapping
requests handle late429, only exact normalized title/base+season/part matches are
accepted, mapping TTL is not refreshed by reads, malformed/duplicate/missing
provider IDs fail before caching. NativeV9 standardS2 One Piece Sub now running;
this does not claim the repeated-retry fixture has passed through native VM yet.

Real V9 same-session retry test then reproduced the delayed response: beta9
first call11006ms still-loading error with1 native HTTP request alive; retry
5711ms returned1180 episodes; third reopen81ms returned the cached list. No
runtime reset or guessed episode list. Raw `miruro-recovery/native-retry-*.json`.
The first harness attempt accidentally retained Flutter's HTTP400 override;
that failure is retained, then the real-network fixture explicitly cleared the
override just like the existing runtime tester. No app code changed.

This measured~16.7s valid native response justifies a narrow episode-list budget
of18s, not a blind global increase. New beta10 caps the overall episode operation
at28s (under V9's30s invocation), retains shared pending work and all identity/
HTTP/rate-limit checks, and keeps all other request budgets unchanged.19 fixtures
pass. Beta9 ZIP retained; final beta10 ZIP
`543eeb2393a5824c3380b1c51bb81ee51816fab167d6e08348ed055163c2a6f7`,
script `fef58b92c36088a61df7bd287870fde07cadef67f0948d72e46dfe0662711098`.
Current beta10 standardS2 native/media/simulator check is running.

### V9 Checkpoint Before App-Test Handoff

- AniKoto beta3: warm standardS2 PASS plus currentV9 native Frieren Dub PASS;
  earlier opening-audio detector flag is supported as an intro artifact by paired
  identical English dialogue/frames, not silently removed. Ready for TEST
  promotion with explicit sample/device/caption limits once release gates finish.
- Miruro beta10: exactZIP native runtime PASS,1180 episodes, stream and download
  probe PASS; Japanese audio detection and decoder checks PASS; English hardcoded
  captions visually seen in30s evidence frame. Formal standardS2 **FAIL** only
  `SIMULATOR_TIMEOUT`/`SIMULATOR_SUMMARY_MISSING` on cold simulator run
  `2026-11-11T19-08-40-753Z_s2_miruro-v3_27567c0b`. Private, warm simulator gate
  pending a later Flutter reservation; no false PASS or gate suppression.
- MovieDB beta27: concrete deadline defect fixed in fixtures, but fresh native
  requests remain intermittent. Private trace.2 instrumented ZIP ready for next
  native diagnostic: `8db645539f71fe3350be31d75d5a03d52c7426ce0f41cec97e8610342d3eb45e`.
  Diagnostic ZIP is not a release package. Full stream/subtitle S2 gate pending.
- TEST157 and official feed still unchanged in this maintenance task so far.

New inspection: MovieDB TESTbeta15 lost `catalogueMapping`/`sourceFallbacks`
present in retained TESTbeta14; X-Stream's reciprocal TV mapping remains.
Do not assume missing metadata is healthy. A future V9 MovieDB overlay must
explicitly restore/revalidate these known TMDB TV templates against current
`mdb:tv:{id}:{season}:{episode}` output, not blindly copy old manifests or count
another module's playback as MovieDB success. No overlay published yet.

### TEST158 Pre-Push Gates

Query-free feeds rechecked: official162 unchanged; TEST157 exactly matched local
baseline. Only AniKoto eligible. Its new manifest differs from installed TESTbeta7
in `moduleVersion` only: all identity, contract, caps, fallback and catalogue
fields remain equal. This preserves the import surface already exercised in the
earlier45-source V9.0.0/.55/.81 fixture imports; those native fixture imports were
not rerun for158 after the app-test Flutter handoff and are not claimed as new
158 runtime evidence. Current V9 exact candidate import passed through S2.

Prepared158 retains45 sources,44 unaffected module descriptors byte-for-byte,
the9.0.0 bundle floor, artwork and both native provider payloads. Subtitle and
Calendar signatures re-bound to revision using the existing TEST key; community
source provenance and explicit Off semantics are unchanged. Repository verifier
PASS and38 Node signature/compatibility/packaging tests PASS. No Flutter used
after handoff. Historical module ZIPs and Bundle157 remain retained.

Fresh paired Frieren control completed: beta7 and beta3 matched exact title,
episode and Dub provider route. Both~300s encoded samples and decoded WAV hashes
match; Whisper detected English dialogue on both. Both~600s PNG hashes match
the same scene. One-title paired result does not certify every title. Raw evidence
remains private under `anikoto/paired-result.json` and `PAIRED-REPORT.md`.

### TEST158 Publication Receipt

TEST-only tooling commit `f15c5a4`; release commit `d74d402`. Query-free public
read-back completed2026-11-11T19:37:54Z:45 module ZIP hashes and all46 bundle
members match; repository, catalogue, subtitle envelope and checksum files match.
Both native declaration signatures passed. Private machine-readable receipt:
`dual-maintenance-20261111/release-stage/public-readback.json`.

- Bundle158 SHA256: `cc3add123100b217f1702e42ceb581bed36b90fc074a79669b2ec96306d2c750`.
- Index SHA256: `78be254c285d2591ac6a63560c0b3121d38aa27c72cdeae94d2f1cf7abb295f0`.
- AniKoto ZIP SHA256: `9b8806589bf7c0f3e408088b16be218d548b2cadaed6534ec91de105dcea9a27`.

Query-free old Bundle157 and AniKoto TESTbeta7 downloads still match their
original hashes, preserving rollback files. The official index remains exactly
equal to the pre-maintenance snapshot. No official/legacy publication occurred.

App chat explicitly returned Flutter ownership after its tests. Fresh Miruro
beta10 S2 run `2026-11-11T19-36-51-860Z_s2_miruro-v3_fa20fd57` is in progress;
not a PASS yet. Independent review identified unbounded metadata/mapping before
the claimed episode-operation cap and cross-title429 cooldown races; focused
private beta11 fixtures/repair requested. Neither Miruro candidate is published.

## Reproducible Update Process

1. Re-read query-free official and TEST indexes; pin source versions/hashes and
   download/verify only the changed packages. Do not compare bundle numbers as
   app versions or copy an official index over TEST.
2. Write a private input JSON like `dual-maintenance-20261111/inputs.json`: each
   module has stable `id`, explicit `version`, pinned `core`, `legacy` and `v9`
   input paths/SHA256 plus an output directory. Core is the reviewed resolver;
   each baseline is that lane's actual current package, not an old source folder.
3. Run `node --test scripts/dual_module_package.test.cjs`, then
   `node scripts/dual_module_package.cjs <pinned-inputs.json>`. Check
   `packages.json`: identical shared script hashes, explicit manifest differences,
   no lost identity/mappings. Re-running cannot overwrite different staged bytes.
4. Run `node scripts/dual_runtime_20261111.cjs <legacy|v9> <id> <query> <sub|dub>`
   serially. Legacy snapshots unchanged pinned source with its resolved packages;
   V9 uses the real current worktree. Logs and exact hashes stay in private QA.
   `overrideZip` can select a precise older control; never conflate that with the
   candidate. Record failed stages, fresh opens and sample-download limits.
5. Run current S2 standard on exact final V9 ZIP; inspect actual language,
   dialogue-window, subtitle and simulator evidence. Retain previous FAILs and
   explain any title-specific/PARTIAL result; no weakening of gates or ID guessing.
6. Update only eligible TEST descriptors/packages and bundle. Preserve all extra
   sources, user Off defaults, mappings, artwork and native provider payloads;
   sign subtitle AND Calendar declarations for the new revision. Run repository,
   client signature/import/floor tests, then query-free public hash read-back.
7. Keep legacy candidate ZIPs private for review. Original published ZIPs/bundles
   and release commits remain rollback evidence; installed clients do not silently
   downgrade merely because an index points back to a lower version.

The packager intentionally rejects a newly encountered lane-only field or
conflicting overlay. Review that contract explicitly instead of silently dropping
it or indefinitely leaving TEST on an obsolete playback script.
