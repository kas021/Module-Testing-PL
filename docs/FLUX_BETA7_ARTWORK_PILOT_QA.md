# Synthetiq Flux beta.7 artwork pilot QA

## Result

Metadata-only candidate: **PASS**. Full stream certification: **not run**.

The live AniList fixture check passed for four Home cards and details for AniList
ID `210482`. It verified `backdrop`, `backdropUrl`, cleaned `description`, and
`tags`, preserved legacy identity/image fields, and confirmed missing metadata
is safe for both Home and details. The fixtures and runner are retained in
`docs/artwork-pilot-evidence/` in this repository.

## Real Flutter Runtime

Follow-up active V9 real-runtime run: **PASS, 2 tests**, including the artwork package; parent-reported log label `qa223-real-package-runtime`. This does not supersede the explicitly skipped stream and download checks below.

The command below was run in the parent app checkout. Its absolute paths are
local provenance references, not paths provided by this TEST repository. The
Home/details fixture inputs and fixture runner are included in
`docs/artwork-pilot-evidence/` for review.

Exact command used:

```sh
perl -e 'alarm 90; exec @ARGV' flutter test --no-pub test/module_app_runtime_test.dart '--dart-define=MODULE_ZIP=/Volumes/ZX20/BuildCaches/player-artwork-pilot-20261002/Synthetiq-Flux-1.0.3-beta.7.zip' '--dart-define=MODULE_QUERY=One Piece' '--dart-define=MODULE_CHECK_HOME=true' '--dart-define=MODULE_CHECK_STREAM=false' '--dart-define=MODULE_CHECK_DOWNLOAD=false'
```

Outcome: `1` Flutter test passed. Import/load passed. Home returned `24` items;
search returned `24`; details passed for `ONE PIECE` (`sadirect:a21`, description
length `1559`); episodes returned `1180`. `stream`, `playability`, and
`downloadProbe` were each explicitly skipped. This verifies the app runtime
contract for the exercised handlers, not stream playback.

Two episode-frontier requests logged after runtime disposal and were swallowed:

```text
ClientException: Connection closed before full header was received, uri=https://vidhawk.buzz/api/stream/resolve?episode=1180&audio=dub&fast=1&server=flow&anilistId=21&malId=21
ClientException: Connection closed before full header was received, uri=https://vidhawk.buzz/api/stream/resolve?episode=1180&audio=sub&fast=1&server=flow&anilistId=21&malId=21
```

Each was followed by the same JS console message:

```text
[fetchv2] Error: null is not an object (evaluating 'result.ok')
```

The runtime test still passed; these late provider errors are not evidence of
stream success or failure. No full S2 video certification was run.

## Diff Boundary

Against the production beta.4 baseline, `index.js` only adds four metadata
properties in `mediaCard` and three in AniList details. No existing JS line was
changed or removed. Manifest identity remains `synthetiq-anime-direct` /
`synthetiq_anime_direct_v1` / `SP-VID-077-ANIME-DIRECT` / `77`; only version and
the artwork-test description changed. The beta.5 pilot was superseded after
checking the 8.6.7 snapshot, whose highest existing Flux version was beta.6.

## SHA-256

Retained output files:

| Path (relative to this directory) | SHA-256 |
|---|---|
| `Synthetiq-Flux-1.0.3-beta.7.zip` | `77ff42f18da7783a0ef266c40f04e2191293f1dfcb80f79fa50f93fe4fe2add0` |
| `source-beta.7/index.js` | `711ca8f601daab90813e6d20f6765ee0bdc70769838589cc560b7cca116ac91a` |
| `source-beta.7/module.json` | `296f1fd796da73c0904cd01284ccc9f3c5279f731779dc635ea6541f2e047189` |
| `baseline/index.js` | `04bec727564c1279e3b787587e173b7538cbc8ca800e2635f76814d569409ae7` |
| `baseline/module.json` | `38c503df2570d8231639dc0f476c37caeecad4c60a5f3b2e50137947bb2a0596` |
| `docs/artwork-pilot-evidence/home.json` | `5473e075cf3900d155e9817d575b740f82de07229b8015670fad008324ae5375` |
| `docs/artwork-pilot-evidence/details.json` | `6119d4fe195fe43bac742c05785ec09c0a5d358708d2485aed157ec3ab342e71` |
| `docs/artwork-pilot-evidence/metadata_fixture_test.js` | `aad9760b66cbf75e48e70759a80eda1d692272b07e871f3148569454253c9504` |
| `superseded-beta.5/Synthetiq-Flux-1.0.3-beta.5.zip` | `582adff4cea5943b8f678012e401ace221df01ed2a186c9b2193707b256ceb03` |
| `superseded-beta.5/source/index.js` | `711ca8f601daab90813e6d20f6765ee0bdc70769838589cc560b7cca116ac91a` |
| `superseded-beta.5/source/module.json` | `b3b814c911581b3c760234f4c582875f098db05a748a8a70c8f1bba256f3275a` |

Read-only production beta.4 ZIP SHA-256:
`0be9b5ff36ab62c77b5c4b902ac6aff8191dee2afcbd894c91cab14d847fc7bd`.
