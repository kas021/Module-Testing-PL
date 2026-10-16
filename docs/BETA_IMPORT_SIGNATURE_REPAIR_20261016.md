# V9 Beta Import Validation Repair

Discord reports from V9 9.0.81 (261) showed index validation failure before any
source was confirmed saved. The live Bundle 141 index retained the native
subtitle declaration signed for revision 1791588429776 while later publishers
changed the index revision to 1792060758230. It also retained a stale index
signature and an empty bundle signature. The native provider check runs before
the app can offer community-source import, so the stale declaration blocks it.

## Repair

- Re-sign only the native declaration for the current publication revision
  with the existing protected TEST key. Match the standalone descriptor too.
- Explicitly clear the stale source-index signature. Source packages remain
  community imports, as Bundle 141 was already treated when its stale index
  signature failed. User confirmation, package hashes and mandatory native
  provider verification are not bypassed or weakened.
- Preserve every source ZIP, Bundle 141 bytes/hash/version, module identity,
  subtitle endpoint/configuration, publication revision and fallback manifest.
  The main production module repository is not changed.
- Do not fully sign this index without migrating and qualifying its fallback
  identities. Existing ZIPs use manual publisher identities; switching their
  provenance to trusted:module-testing-pl would make the app reject those
  declarations under its exact ownership checks.
- Update the four post-provider publication scripts to run the signing step.
  Signature verification now forms part of the standard repository verifier,
  including revision-bound native providers and strict Base64 validation.

## Publishing Gate

After any TEST index revision change, with the protected TEST signing key
available locally, run:

```sh
node scripts/sign_repository.mjs --community --write
node --test scripts/repository_signatures.test.mjs
node scripts/verify_repository.mjs
```

Do not commit private keys or credentials. The script writes local metadata
only; Git publication is a separate step. Do not skip these checks because the
archive hashes pass: that was the missing part of the old validation coverage.

## Evidence

- Baseline signature regressions failed for the broken publication and its
  mismatched standalone provider descriptor.
- Repaired metadata: eight Node regressions pass, including changed revision,
  unsupported endpoint, malformed Base64, explicit community mode and strict
  mode refusing an unsigned index. Standard verifier passes: 40 modules,
  Bundle 141, one artwork package and four JSON checksum records.
- The app's ModuleRepositoryClient is byte-identical to the 261 source base
  (95df83b). The actual Dart client verifies the repaired native declaration,
  preserves community provenance, rejects revision tampering, and rejects a
  missing bundle signature when strict verification is required.
- Combined app integration: 41 tests passed across actual Bundle 141 package
  installation, real-manifest automatic fallback reconciliation, publisher
  ownership, import planning, repository disconnect and signature checks.
- No source-site playback certification is claimed: no module code changed.

Users should retry Add Repository / Install Bundle with the same TEST URL.
Do not uninstall Player or clear data. An installation bound to an older fully
signed TEST generation may need the explicit repository import again to move
to community provenance; do not silently downgrade an existing trust binding.

Publication and a fresh live fetch will be recorded separately after approval
and validation. This is a TEST-repository repair, not a production app release.
