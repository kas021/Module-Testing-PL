# AniPM Automatic Fallback QA Pair

TEST-only fixture for exercising the Player's real v1 catalogue mapper and
fallback recovery after a deliberate module stream failure. Both packages are
included in TEST bundle 132. The production module repository is unchanged.

## Modules

| Role | Module ID | Version | Source family | Identity |
|---|---|---|---|---|
| Real catalogue/stream source | `anipm-v1` | `0.1.0-beta.4` | `anipm-v1` | `SP-VID-084-ANIPM` |
| Deliberate QA failure source | `qa-fallback-anipm-v1` | `1.0.0-beta.1` | `qa-fallback-anipm-v1` | `SP-VID-997-QA-FALLBACK-ANIPM` |

| Package | SHA-256 |
|---|---|
| `modules/AniPM-0.1.0-beta.4.zip` | `c4bfb910ee4d3cc4c9883993fcdad62c777166a08ebd74cb9c255092846ebed3` |
| `modules/Fallback-Test-AniPM-1.0.0-beta.1.zip` | `fc2408262bfefe4daa17115068135f5d6278c0e4ed7ca53f8ac9d022b91e4d24` |

The test module keeps AniPM beta3 search, details, and episode code and routes,
but its exported stream handler throws a deterministic QA error before network
access. It must never be described as playable. It is marked Testing only and
`recommended: false`. Its ID/family/identity are separate from AniPM, so the
same numeric AniPM catalogue identity does not imply source identity.

Both packages declare `config.catalogueMapping` v1 with namespace
`qa:anipm-catalogue-v1`, absolute numbering, series template `anipm:{id}`, and
episode template `anipm:{id}:e{episode}`. Only the QA module declares a
`sourceFallbacks` group, with real AniPM as its sole alternative; real AniPM
does not suggest or include the deliberate-failure module. The group uses the
runtime-normalized manual identities `manual:qa-fallback-anipm-v1` and
`manual:anipm-v1`; no trusted stamp or signed publisher is claimed. The app
must retain its normal unsigned community-package confirmation and signature
checks.

Before allocation, identity number 997 was checked against the app registry,
live TEST index, local TEST ZIP manifests, and historical
`docs/modules/catalogue-audit-20260924/module_inventory.json`; no other 997
identity was found. The coordinator has since added the exact 997 entry for
this QA module to the current app registry. The live/historical
`testing-123-v1` fixture occupies 998, which this package does not reuse.

## Build And Unit Test

Run from the repository root:

```sh
node --test scripts/qa_fallback_anipm.test.cjs
node --check sources/anipm-v1/index.js
node --check sources/qa-fallback-anipm-v1/index.js
```

The Node tests use mocked catalogue JSON to check search/details/episodes,
package/source equality, mapping/fallback metadata, and zero fetch calls from
the QA stream handler. They are not live network or app-runtime tests.

Runtime evidence: the app imported and queried both packages, and real AniPM
resolved and passed stream-reachability checks for One Piece episode 101.
This is not device playback evidence. The
global `module_identity_audit.py` is not claimed as passing; it currently has
pre-existing historical duplicates and missing live entries outside this
fixture.

## Player Test Sequence

The live catalogue was checked for these exact test cases:

| Title | Episode | Canonical episode ID |
|---|---|---|
| One Piece | 101 | `anipm:1642:e101` |
| Naruto Shippuden | 1 | `anipm:1498:e1` |
| Death Note | 1 | `anipm:1610:e1` |
| Jujutsu Kaisen | 1 | `anipm:1103:e1` |

1. Install both packages explicitly from the TEST community repository and
   adopt the unsigned fallback definition in Settings. Do not add trusted
   publisher stamps.
2. Probe the preselected AniPM cases: One Piece episode 101, Naruto Shippuden
   episode 1, Death Note episode 1, and Jujutsu Kaisen episode 1. Confirm both
   modules return the same AniPM series ID and episode IDs for each available
   absolute episode; record missing titles/episodes without substituting a case.
3. Start an episode from `Fallback Test (AniPM)` and confirm its local handler
   fails with `QA fallback failure: stream resolution is deliberately disabled;
   no stream request was made.` On the failure screen, explicitly tap **Try
   next source** (or **Try fallback**, depending on the player view). Confirm the app maps the same series, absolute
   episode, and audio to AniPM; real AniPM stream resolution should begin only
   after that user action.
4. Record mapping and playback outcomes separately. A successful mapping alone
   is not playback evidence. Never claim that the QA module resolved or played
   a stream.

These deliberately failing cases are a recovery harness, not certification of
unrelated fallback groups. AniPM beta4 must be installed for exact mapping;
beta3 has no matching route declaration. If AniPM is missing or disabled,
recovery must not silently choose an unrelated module.
