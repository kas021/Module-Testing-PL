# TEST Bundle 136 Catch-Up

9 October 2026. Target device build: Player 9.0.72+252.

## Changes

- KickAssAnime 4.2.0 and Shahiid 2.1.2 replace their older TEST versions.
- CimaClub 1.2.0 and Anime4up 1.0.0-beta.10 join the TEST catalogue.
- X-Stream 1.3.4-beta.1 uses production 1.3.3 playback code plus the existing
  TEST exact-TV fallback metadata.
- MovieDB 0.1.0-beta.14 uses production beta.13 playback code plus the existing
  TEST exact-TV fallback metadata.
- All other TEST packages, artwork configuration, QA failure fixture, and the
  three real fallback sets are retained. No extra compatibility groups are
  asserted merely because a module is in the catalogue.
- The authoring catalogue is synchronized with the import index, and bundle
  136 contains the same 39 package versions and hashes as both files.

## Verification

- Four unchanged production archives match their published SHA-256 hashes.
- The two merged candidates preserve production JavaScript byte-for-byte and
  retain production identity/configuration except the two compatibility keys
  (`catalogueMapping`, `sourceFallbacks`) and version/release metadata.
- S2 structural inspection passed for all six packages: ZIP safety, manifest,
  and required JavaScript handlers. Initial missing local Node dependency was
  resolved using the existing module tester dependency directory.
- Real V9 ModuleStorage batch installation passed for all 39 packages.
- Index, catalogue and nested bundle contents/hash agreement passed.
- Real AniKoto/AniPM/QA imports and all three real reciprocal fallback pairs
  passed: defaults on, no adoption required, explicit user Off retained.
- Combined focused Flutter test run: 3 passed.

Certification remains PARTIAL. No new native playback, semantic language,
download or broad reliability run was performed for this catch-up. Published
production fixes were mirrored; existing upstream failures are not claimed
fixed. See `production/RELEASE_EVIDENCE.md` for known limitations.

Only the TEST repository is changed. All older archives remain available for
rollback. Neither the production repository nor owner device data is modified.
