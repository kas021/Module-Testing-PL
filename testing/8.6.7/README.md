# Player 8.6.7 Comparison Sidecar

This nested PL test index is isolated from the root `repository.json`, root bundle sequence, and manual refresh workflow. The builder writes only this directory and preserves module ZIP bytes. See [VERIFICATION.md](VERIFICATION.md) for evidence and outstanding device checks; these packages are not production-certified.

To reproduce packaging from the reviewed candidate ZIPs, run from the PL checkout:

```sh
TMPDIR=/Volumes/ZX20/tmp node scripts/build-867.mjs \
  --flux /absolute/path/to/Flux.zip \
  --anime /absolute/path/to/Anime.zip \
  --anikoto /absolute/path/to/AniKoto.zip
```

Inputs must contain exactly these module IDs and intended versions: Flux `synthetiq-anime-direct` `1.0.3-beta.5`, Anime `synthetiq-anime-v1` `1.0.5-beta.3`, and AniKoto `anikoto-v4` `5.0.5-beta.3`. The build creates `modules/`, a flattened three-ZIP `bundles/Testing-1.zip`, `repository.json`, and `module-caps.json` here. Bump `--bundle-version` for a changed bundle; existing package and bundle URLs are immutable. No source tree is copied or edited by the builder.

The index and all three module entries use `minAppVersion: 8.6.0` for the comparison baseline. This remains an unsigned community index (`signature: ""`), following PL conventions; do not use production signing keys. The Player import URL is:

```text
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/testing/8.6.7/repository.json
```

The builder requires valid ZIPs with root `module.json` and `index.js`, unique package names and module identities, positive integer `config.caps` values, and rejects `live_discovery_v1` because that capability requires Player 9.0. It copies `homeMaxResults`, `maxResponseBytes`, `timeoutMs`, and `maxConcurrentRequests` unchanged into `module-caps.json`; this is a declaration audit, not proof that a Player runtime enforces those limits.

## Current Official Baseline Caps

Snapshot from hash-verified official ZIPs dated 2026-09-27. These are baselines, not the unpublished Hermes candidates.

| Module | Version | Home results | Response bytes | Timeout ms | Concurrent requests |
|---|---:|---:|---:|---:|---:|
| Flux (`synthetiq-anime-direct`) | 1.0.2 | 40 | 2,500,000 | 25,000 | 4 |
| Anime (`synthetiq-anime-v1`) | 1.0.4 | 40 | 2,500,000 | 25,000 | 4 |
| AniKoto (`anikoto-v4`) | 5.0.4-beta.4 | 60 | 1,500,000 | 30,000 | 4 |

## Verification

```sh
TMPDIR=/Volumes/ZX20/tmp node --check scripts/build-867.mjs
TMPDIR=/Volumes/ZX20/tmp node --test scripts/build-867.test.mjs scripts/release-policy.test.mjs scripts/testing-123.test.mjs
git diff --check
```

These commands validate packaging only. They do not run the Flutter app, certify playback, or publish either index.

Module fixture tests and the exact source used to build the ZIPs are in
`source/`. Run `node --test testing/8.6.7/source/*/trio-candidate.test.cjs`.
The source files are not bundled into other catalogues. The three module IDs
match production, so installing these replaces those copies in that profile.
Disconnect this test repository before restoring the official packages.
