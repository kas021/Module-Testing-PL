# V9 import compatibility

Owner policy: users on V9 should not need a newer beta patch just to import
the TEST catalogue. This supersedes the former root-versus-beta261 split.

## Change

- Bundle 149 and catalogue import floor: 9.0.92 -> 9.0.0.
- All 13 V9-specific source descriptors now declare 9.0.0. The other 32
  descriptors retain their existing 8.0.0 floor.
- The 45 module ZIPs, bundle archive, artwork and provider payload are byte
  unchanged. No channel, playback script, fallback mapping or source identity
  was edited. Detached signatures on changed signed source descriptors were
  regenerated with the TEST key. Unsigned descriptors remain unsigned.
- Index/bundle community provenance remains unchanged; hashes, manifest checks,
  trusted native-provider verification and import approval are not bypassed.
- The original publication timestamp is retained so the unchanged native
  provider envelope in the bundle and standalone JSON stays correctly bound.
  Git commit and GitHub's changed content ETag identify this metadata correction.
- The frozen beta-261 index and its packages remain untouched as a rollback
  snapshot. Only its README now points ordinary users back to the main TEST URL.

## Publication guard

`scripts/verify_repository.mjs` also checks the V9 admission policy. A new patch
floor, malformed minimum, or V10-only source cannot silently land in this V9
catalogue. A genuinely incompatible future package needs a separate compatible
package or catalogue, not disabled security/format validation.

`scripts/normalize_v9_compatibility.mjs --write` performs the bounded metadata
correction after validating package hashes. It does not modify packages, native
providers, endpoints, app data or publish anything itself.

## User instructions

Retry import using the normal TEST URL:

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

No reinstall, reset, data deletion or beta app update is required for this
metadata correction. Existing installed sources keep their versions because
their bytes did not change. This is repository import compatibility, not a
promise that every upstream stream works or that an older app gains new UI,
Live clock fixes, native subtitles or automatic fallback features.

## Validation

Publication requires `node --test scripts/v9_compatibility.test.mjs
scripts/repository_signatures.test.mjs` and `node scripts/verify_repository.mjs`.
The app repository contains `test/v9_repository_compatibility_test.dart` for
real package installation/readback in isolated storage and a historical-import
runner for legacy V9 source code. Exact results are recorded in the app's
release report rather than equating fixture validation with physical playback.

Completed 2026-10-18: all 45 packages installed and reloaded successfully using
archived 9.0.0, 9.0.55 and 9.0.81 importer/model/storage code, plus the current
V9 integration test. Existing app regressions: 84 passed, three opt-in skips.
Policy/signature tests: 18 passed. Full repository verification passed and
focused Dart analysis reported no issues. No physical playback claim is made.
