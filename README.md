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

## Current V9 Test Bundle

The active TEST catalogue is bundle 136 with 39 modules. It brings across the current published KickAssAnime, Shahiid, Cimacub and Anime4up packages. MovieDB and X-Stream retain the V9 exact-TV fallback metadata on top of their newer published playback code. Historical packages remain for rollback; catalogue removal does not erase installed modules or downloads.

It retains Flux `1.0.3-beta.8`, Synthetiq Anime `1.0.5-beta.3`, AniKoto `5.0.5-beta.3` and AniPM `0.1.0-beta.5`. Three real compatible sets are included: AniKoto/AniPM, Flux/Synthetiq Anime, and MovieDB/X-Stream (TV only). The diagnostic AniPM failure fixture is also retained. Updated Player V9 imports compatible defaults on; a user's explicit Off remains Off. Module updates alone cannot add automatic recovery to an older app binary. Native playback and download reliability remain under testing; this is not a production certification.

## Repository Data

- `repository.json` is the unsigned Player index. Its package URLs point to matching files in this repository when those files are present.
- `catalogue.json` mirrors the current TEST index for authoring and packaging; it defines no default modules.
- `modules/` and `bundles/` retain copied production archives and historical TEST packages/bundles. Bundle 136 retains the metadata mapping pilots and the intentionally failing AniPM fallback fixture.
- `artworkModules` lists separately previewable artwork JSON packages; each descriptor carries a TEST-owned package URL and SHA-256.
- `sources/`, `assets/`, and `docs/` are copied production source, artwork, and documentation. `docs/artwork-pilot-evidence/` contains the Flux pilot's Home/details fixtures and fixture test.
- No production publishing workflow or signing credential belongs in this repository.
