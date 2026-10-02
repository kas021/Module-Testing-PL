# AniKoto / AniPM Fallback Metadata QA

## Candidate Pair

| Role | Module ID | Candidate version | Module family | Identity |
|---|---|---:|---|---|
| Primary/alternative | `anikoto-v4` | `5.0.5-beta.3` | `anikoto-v3` | `SP-VID-036-ANIKOTO` |
| Primary/alternative | `anipm-v1` | `0.1.0-beta.5` | `anipm-v1` | `SP-VID-084-ANIPM` |

Both module scripts are byte-identical to the preceding TEST packages. AniKoto
bumps beta.2 to beta.3; AniPM bumps beta.4 to beta.5. These packages change
metadata only: catalogue routes and reciprocal source-fallback declarations.
No playback handler, stream URL, or provider logic was edited.

## Mapping Contract

Both candidates declare `config.catalogueMapping` version 2 in the shared
`anipm:anime` namespace with absolute episode numbering. AniKoto keeps its
native slug as its series ID, matching its details href and saved-history
shape. Its episode IDs also retain the shared numeric catalogue ID:

```text
series:  {slug}
episode: {id}|{slug}|{episode}
```

AniKoto search and details hrefs are slug-only. The v2 mapper must retain that
series ID rather than synthesize a numeric compound ID. For cross-module
matching it can derive numeric identity only from a real episode ID, then
require the episode's slug to match the source series slug. No ID is inferred
from a title or fabricated without a matching episode.

AniPM keeps its native IDs:

```text
series:  anipm:{id}
episode: anipm:{id}:e{episode}
```

The numeric `{id}` is the shared explicit key measured in the paired live
catalogue audit. It is not a title-derived or fuzzy alias. Target-side mapping
must perform bounded title search, select the exact candidate with the same
numeric key, verify details, then require a unique matching real episode and
requested audio. No episode may be manufactured from the number alone.

AniPM beta5 also retains its existing
`qa:anipm-catalogue-v1` route (same v1 template) in its v2 route list so the
existing v1 `Fallback Test (AniPM)` package remains mappable across the route
version boundary. The QA package itself is unchanged. Its deliberate failure
is not an alternative in either real module's group.

Each real module declares one reciprocal alternative in a separate unsigned
manual group. The existing QA module continues to point only to real AniPM.
No trusted publisher stamp is asserted; community install confirmation and
group adoption remain required. There are no additional source groups in this
candidate.

## Evidence And Denominator

The persisted audit summary is
[`anikoto-anipm-10-title-evidence.json`](anikoto-anipm-10-title-evidence.json).
It was captured from AniKoto `5.0.5-beta.2` and AniPM `0.1.0-beta.3` before
these metadata updates. Ten titles were predeclared. For each title both
modules returned one exact normalized-title candidate, exact details, and an
episode list. The modules exposed the same numeric ID and the same episode
count in **10/10 titles**. First/middle/last raw episode-ID samples matched in
**30/30 pairs**. The lists contained 2,526 episode rows per module in total;
the saved audit sampled 30 IDs, so it does not claim a complete per-episode
identity comparison across all 2,526 rows.

Both module manifests declare English Sub/Dub. The 10-title audit did not
preserve per-episode audio flags, so it does not establish 10-title language
parity. A separate One Piece episode 101 sample recorded SUB and DUB available
on both modules. Keep requested-audio verification mandatory at runtime; do
not generalize the single episode result.

This is catalogue mapping evidence, not a claim of 80%/85% population coverage,
independent provider failure domains, AniKoto playback certification, or
playback success. The coordinator separately reported AniPM One Piece 101
stream resolution and reachability passing. App-side v2 parser/runtime tests
remain coordinator-owned; this repository task does not run Flutter/S2.

## Final V9 Coordinator Verification

Bundle **133** requires **9.0.55 or newer** for the new real mapping packages.
The combined device candidate is **9.0.57+227** on the app's private V9 branch.
The app's real Flutter client runtime verified the final beta3/beta5 packages
against ten live catalogue pairs: **122/122 eligible episode/audio samples**,
61 in each direction, with zero wrong numeric/episode identities. Each
direction included 31 Sub and 30 Dub mappings; two unavailable-Dub source
samples were explicitly excluded. This is sample coverage, not population or
decoded-playback certification.

The app also imported these actual ZIPs through ModuleStorage and reconciled
their unsigned groups through the same ownership helpers used by ModuleState.
They remain unusable until explicit adoption, then offer the real alternative
in both directions. The QA fixture remains one-way to AniPM and neither real
group recommends it. That integration plus mapping/observer checks passed
33/33; repository packaging tests passed 15/15 and the repository verifier
passed 38 modules, one artwork package and bundle 133.

Retained app-side evidence: `docs/qa/V9_PHASE7_MATCHING_MATRIX.md` and
`docs/qa/fallback-evidence/v9-real-mapping-beta3-beta5.sanitized.json` in the
Synthetiq-Player feature branch. The live production module repository is not
changed by this TEST publication. Physical fallback playback is still required.

## Focused Checks

Run from the repository root:

```sh
node --test scripts/anikoto_anipm_mapping.test.cjs scripts/qa_fallback_anipm.test.cjs
node --check sources/anikoto-v4/index.js
node --check sources/anipm-v1/index.js
node --check sources/qa-fallback-anipm-v1/index.js
```

These checks verify both package/source pairs, byte-identical playback scripts,
v2 route templates and the retained QA v1 namespace, one-and-only-one
reciprocal real-module alternative, and the fixed 10-title denominator. They
do not replace the app's v2 mapper tests or runtime validation.
