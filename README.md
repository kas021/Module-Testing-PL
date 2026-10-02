# Module Testing PL

Public community testing mirror for Synthetiq Player modules. The module packages and catalogue baseline are copied from the production repository, `kas021/Synthetiq-Modules`, so tests can run against the same module identities and package bytes as production.

Add this repository in Player only when you intend to use a community testing source:

`https://github.com/kas021/Module-Testing-PL`

Direct index:

`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json`

This repository is unsigned and is not the official production repository. Keep Player's normal community-repository trust confirmation and package verification enabled. The production repository and its signing key are not modified or used here.

## Testing Policy

The production-mirror testing direction supersedes the former three-candidate policy. There is no three-candidate limit, automatic promotion, or automatic retirement when a module appears in production. Production packages remain a baseline for comparison; testing-only packages are separate additions that must be explicitly identified and reviewed before they are made available.

Adding or selecting a test package must not silently install it. Present its identity, version, source, and package details for explicit confirmation. Do not change production module identities, package bytes, or runtime endpoints as part of catalogue preparation.

## Artwork Packs

In Player, open **Settings → Artwork & Metadata**, enter the TEST repository URL below, and select **Load packages**. Choose **Flux Featured Artwork**, inspect its preview and package details, then explicitly confirm installation. Adding the repository does not install the artwork pack; there is no background or automatic artwork installation. The pack is data-only JSON and matches Flux entries by module ID and source series ID.

`https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json`

`artwork/flux-featured.json` is a snapshot of the first eight items returned by Flux's public AniList trending query. Poster and backdrop URLs are used only as artwork metadata; this package does not change AniList access or any playback endpoint in the app.

## Flux Artwork Pilot

The active TEST catalogue selects `synthetiq-anime-direct` version `1.0.3-beta.7` in bundle 131; both require Player `9.0.53` or newer. Its JavaScript adds seven artwork metadata fields to Home cards and AniList details; stream resolution and extraction logic are unchanged. See [Flux beta.7 artwork pilot QA](docs/FLUX_BETA7_ARTWORK_PILOT_QA.md). Full stream and download certification are not claimed.

## Repository Data

- `repository.json` is the unsigned Player index. Its package URLs point to matching files in this repository when those files are present.
- `catalogue.json` is the production catalogue metadata baseline under the TEST repository identity; it defines no default modules.
- `modules/` and `bundles/` retain copied production archives, plus the TEST-only beta.7 metadata package and bundle 131 pilot selection.
- `artworkModules` lists separately previewable artwork JSON packages; each descriptor carries a TEST-owned package URL and SHA-256.
- `sources/`, `assets/`, and `docs/` are copied production source, artwork, and documentation. `docs/artwork-pilot-evidence/` contains the Flux pilot's Home/details fixtures and fixture test.
- No production publishing workflow or signing credential belongs in this repository.
