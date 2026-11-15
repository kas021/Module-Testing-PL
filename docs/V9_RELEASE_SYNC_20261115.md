# V9 Release Sync Staging

## Scope And Baseline

- Isolated worktree: `/Volumes/ZX20/.codex-worktrees/test-v9-release-metadata-20261115`.
- Branch: `codex/test-v9-release-metadata-20261115`, based on TEST
  `ff0315a7edeeeba12703f2b5fd39833c2b787371` (Bundle 160).
- Original TEST checkout was clean on `codex/test-main-sync-20261115`, tracking
  `origin/main`; origin is `https://github.com/kas021/Module-Testing-PL.git`.
- Official MAIN HEAD: `6c161b923a1c79a7a0571c71823c876d7421bb07` (Bundle 165).
  Both remote HEADs were checked again after staging and had not advanced.
- MAIN is read-only. No app/backend/account/player edits, signing-key access,
  Flutter/S2/runtime/simulator invocation, push or publication. Owner authorized
  a local metadata-only commit with the audit log/manifests after static checks.

## Exact Change

Add `https://www.movy.sx/apple-touch-icon.png` as Movy's `presentation.iconUrl`
in both `repository.json` and `catalogue.json`; refresh their `SHA256SUMS` rows.
Drama Direct already declares its logo in both files and requires no edit.
The parent-confirmed native contract accepts nonblank repository
`presentation.iconUrl` with precedence over module metadata. No package rebuild
or module version bump is needed for this catalogue-only correction.

Both images were freshly read back with HTTP 200, no redirect, PNG MIME and PNG
magic/IHDR checks. Movy: 180x180, 6,537 bytes; Drama Direct: 512x512, 8,169 bytes.
Exact image URLs/hashes and every module version/package/file hash are recorded
in `V9_RELEASE_SYNC_20261115.json`. The Movy apex website returned HTTP 451, but
the official `www` image endpoint passed; availability can vary by region/time.

- New repository SHA256: `8cbe5993f34c2c162c635c992a4d2c22b591c1414849c0344a7fb8858988e954`.
- New catalogue SHA256: `0850ec4c241693369d40f2e40ac13357042919284d7c5016d6c13a485bff319e`.
- Unchanged Bundle 160: `8eee50864dcd76aa260e96c204ad84ad1e65e4f017783f50517472946138e770`.

## Change And Hold Manifest

Fresh commit-pinned official index/package reads compared all 39 official
modules against all 45 TEST modules; package hashes, ZIP paths, lineage,
manifest versions and JavaScript parsing passed. No handlers were executed.

| Disposition | Count | Detail |
| --- | --- | --- |
| Identical package bytes | 29 | Keep TEST descriptors/packages |
| Same executable, TEST overlay | 4 | Flux, AniPM, AniKoto, X-Stream; retain catalogueMapping/sourceFallbacks |
| Newer TEST executable | 2 | Anime beta.9 vs MAIN beta.8; Miruro beta.11 vs beta.7 |
| Hold upstream executable | 4 | See below; no package replacement |
| TEST-only | 6 | QA fallback, SoloLatino, DW Live, TVApp Live, Public Sports Live, Public TV Live |

| Hold | Retained TEST | Official candidate | Prior evidence, not rerun |
| --- | --- | --- | --- |
| Yflix | 1.1.2 | 1.1.3-beta.2 | Caption-language contradictions, FAIL |
| MegaKino | 1.1.5 | 1.1.6-beta.2 | Sub unavailable; Dub language inconclusive |
| MovieDB | 0.1.0-beta.15 | 0.1.0-beta.26 | Emitted episode rejected by resolver, FAIL |
| Movy | 0.1.0-beta.1 | 0.1.0-beta.4 | Sustained native TCP read failure, FAIL |

Prior evidence is documented in `MAIN_TEST_SYNC_20261115.md` and the existing
`/Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115` evidence directory.
An older PASS does not override a later failure. These are holds, not claims
that any candidate was certified in this task.

### Follow-up Evidence Review

Six existing exact-candidate certification reports were read and SHA256-bound
to the preserved candidate ZIPs. `V9_HELD_REVIEW_20261115.json` records report
paths/hashes, grades, media outcomes and language-detector skips. No held package
can safely sync now under the runtime-proof requirement:

- Yflix: 53 non-skipped subtitle-language contradictions across 156 language
  observations. These are recorded detector findings, not 53 independently
  proven wrong tracks. Three media samples passed but do not clear the FAIL.
- MegaKino: the Sub run failed before media analysis. A later Dub run passed
  three media samples but its audio detector was skipped with zero confidence,
  while incorrectly contributing a LANGUAGE_CONTRADICTION failure. This is not
  proof of English audio instead of German, nor a language or standard PASS.
- MovieDB: a network-free fixture extracted only the pure `parseRef` function
  from the exact ZIP. It rejects the previously emitted
  `https://www.movy.sx/movie/27205` reference while accepting `mdb:movie:27205`.
  This independently supports the recorded contract failure. No whole module
  or handler was executed, and no candidate was modified.
- Movy: official commit-pinned QA acknowledges the exact-package standard PASS
  on Alone on 11 November, with only 18/25 broad A/V samples completing. The
  later 15 November Fight Club run fails with
  `player error: tcp: ffurl_read returned 0xdfb9b0bb`; the missing summary is
  not merely an unstarted build. Fresh native proof remains required.

All 45 module descriptors are otherwise deep-equal to the baseline. All package
bytes and the bundle remain unchanged. Default choices, artwork, audio/subtitle
behavior, V9 import floors, fallback mappings, identity/lineage and Live entries
remain intact. Provider declarations, signatures and publication timestamps
remain byte-for-byte unchanged. Presentation is not covered by the existing
canonical signature messages; native declarations still verify. No signing
prerequisite is needed for this patch. Any later publication timestamp change
must use the existing signing process to re-sign native declarations; do not
provision a key. The community index/bundle remain intentionally unsigned.

## Bounded Verification

Executed successfully in the isolated TEST worktree:

```sh
node scripts/audit_release_sync_20261115.cjs
node scripts/review_held_sync_20261115.cjs
node scripts/verify_repository.mjs
node --test scripts/repository_signatures.test.mjs scripts/v9_compatibility.test.mjs scripts/dual_module_package.test.cjs
```

Repository verification: 45 modules, Bundle 160, one artwork package and five
checksummed JSON files. Node tests: 38 passed, zero failed/skipped. These checks
are not stream, language, native import/render or physical-device certification.
The audit script writes only its generated JSON receipt and reads network/ZIP
data; its adm-zip dependency is the existing local MODULE_TESTER installation.

## Queued Parent Certification

Do not execute until the parent explicitly grants the serialized Flutter slot.
The parent currently owns the slot for auth regression. First verify native
repository import and image rendering for Drama Direct/Movy without hardcoded
fallbacks, including reloading an already-installed same-version module.
Removing hardcoded fallbacks must not be described as runtime-verified here.

### Same-Version Refresh: Read-Only Source Finding

Inspected the current parent app checkout at
`/Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114` without
editing it. Exact working-file hashes and app HEAD are in the review manifest;
the snapshot includes concurrent parent changes, not just committed HEAD.

`lib/services/module_update_state.dart:1727` manually fetches the current index
with `forceRefresh: true` and no ETag. At line 1739 it applies repository
presentation before line 1789 compares versions; lines 1817-1831 then preserve
the updated presentation through `copyWith` and persist bindings. The helper at
line 2272 has no package version, hash, bundle or publication-revision gate.
`_rememberCatalogue` increments `repositoryRevision`; the source-manager list
reloads bindings when its `presentationRevision` changes
(`lib/widgets/module_manager_list.dart:33`, settings wiring at
`lib/screens/settings/settings_media_screen.dart:401`).

Conclusion from source: no module version, bundle version, `testingIdentity` or
`publishedAtMs` bump is required for existing linked modules after a successful
manual installed-source update check. That check can say "all up to date" while
refreshing logos. The HTTP body/ETag changes when this JSON changes. Automatic
checks can take 24 hours (`lib/config/module_update_config.dart:27`) and retain
bindings on HTTP 304. `refreshCatalogues()` alone updates catalogue entries, not
the installed bindings used for source logos. Same-version unlinked modules are
not automatically adopted; they need a repository registration/import workflow.
Busy playback/cache/import operations block maintenance. UI rendering and
persisted relaunch behavior remain parent native acceptance gates.

Optional held-candidate rechecks below use existing preserved ZIPs, not a new
promotion decision. Check the hashes against this manifest before executing;
run one command at a time. Failure remediation and fresh candidates are needed
before any failed update can be promoted.

```sh
cd /Volumes/ZX20/.codex-worktrees/player-v9-fable-release-audit-20261114/MODULE_TESTER
node s2_cli.js /Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115/candidates/yflix-v1-1.1.3-beta.2.zip --profile standard --query Inception
node s2_cli.js /Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115/candidates/megakino-v1-1.1.6-beta.2.zip --profile standard --query Inception
node s2_cli.js /Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115/candidates/moviedb-wiki-v1-0.1.0-beta.26.zip --profile standard --query Inception
node s2_cli.js /Volumes/ZX20/Codex-Recovery/module-main-test-sync-20261115/candidates/movy-v1-0.1.0-beta.4.zip --profile standard --query 'Fight Club'
```

No runtime command above was run. Do not use the historical build-budget adapter
without explicit parent agreement. Static staging status: PASS. Fresh S2 status:
NOT RUN / waiting for serialized slot, not a release PASS.

## Publication And Rollback

Parent review/native tests and owner TEST-publication authorization remain
required. No MAIN change is proposed. Before applying/pushing, check current
TEST remote HEAD and worktree dirt again; do not overwrite concurrent changes.
This metadata-only proposal retains Bundle 160 and its immutable ZIP. Source
inspection does not require a version/revision bump; parent still confirms the
native refresh workflow before publication. If release policy independently
requires a new timestamp/bundle, prepare that separately and re-sign native
declarations using the existing process.

Rollback is the inverse of the two logo fields and their checksum rows; original
indexes/packages are preserved in baseline git history and all original ZIPs
remain present. No destructive reset or overwrite is required.

## Local Execution Log

15 November follow-up: rechecked both remote main heads (unchanged), reconciled
six existing reports against candidate hashes, checked the isolated MovieDB
parser, inspected the current parent app refresh path read-only, and reran the
45-module commit-pinned audit with successful direct image read-backs. Final
repository verification passed (45 modules, Bundle 160); all 38 focused Node
tests passed with zero failures/skips before the local commit.
Only the Movy logo and two index checksums change publication payload bytes;
all other additions are audit scripts, evidence manifests and this log. No
package, bundle, app file, signature or timestamp changes are included.
