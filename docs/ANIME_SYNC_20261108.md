# Official anime fixes mirrored to TEST - 8 November 2026

## Scope

Owner requested the newly published official anime updates in the testing repo.
Source: kas021/Synthetiq-Modules at e4d5ceaea8ae66537b3ddfa146952b7aeba7f53a,
official Bundle159. TEST baseline:1c36f1fd4e587d2454fec00142e282292eb41558,
Bundle153. Work performed in a separate TEST worktree; the existing Desktop
checkouts' uncommitted files were not changed.

New TEST Bundle154 retains45sources plus the separately signed subtitle-provider
envelope. The official repo, Player app code, system networking and account data
are unchanged by this sync. Existing immutable archives and frozen beta-261
rollback links are retained.

## Updates

| Module | Previous TEST | Synced official version |
| --- | --- | --- |
| Synthetiq Anime |1.0.5-beta.4|1.0.5-beta.8|
| Synthetiq Flux |1.0.3-beta.8|1.0.3-beta.10|
| AniPM |0.1.0-beta.5|0.1.0-beta.9|
| AniKoto |5.0.5-beta.3|5.0.5-beta.7|
| AnimeAV1 |1.3.0-beta.4|1.3.0-beta.9|
| AnimeUnity |1.0.7|1.1.0-beta.3|
| Shahiid |2.1.2|2.1.3-beta.3|

Other official anime entries already match TEST and were not repackaged. All
unrelated TEST module descriptors are unchanged. Published release caveats remain
visible in changelogs; copying a published canary is not new playback certification.

## Preservation and packaging

- Every runtime/non-manifest file is byte-identical to the pinned official ZIP.
  AnimeAV1, AnimeUnity and Shahiid ZIPs are entirely byte-identical to official.
- Anime, Flux, AniPM and AniKoto retain their existing TEST catalogueMapping and
  sourceFallbacks blocks. Only those blocks were added to the official manifests;
  lineage, identity numbers, versions, capabilities and runtime bytes were retained.
  ANIME_SYNC_20261108.json records official and TEST package hashes separately.
- Rebuilt catalogue/index/bundle and SHA256SUMS together, preserving the9.0.0
  app admission floor and all45module identities. New URLs stay within TEST.
- Re-signed the unchanged native subtitle provider configuration for the new
  publication revision, using the existing restricted TEST key. No key copied or
  logged. Bundle154 embeds that exact signed envelope. Bundle153 did not contain
  the provider envelope despite its separate index declaration.
- Corrected an already-failing mapping-test assumption tied to Bundle134 and
 9.0.55. Baseline153 reproduced the failure. The test now verifies the current
  catalogue/bundle version,9.0.0floor, actual active ZIP identity/version and exact
  retained mapping/fallback metadata; historical playback-byte fixtures remain.

## Validation

- Repository verifier:45modules, Bundle154,1artwork package and5checksummed JSON
  files passed. All nested module hashes and the provider envelope were checked
  by the current V9 Flutter import test; all45packages installed in temporary
  storage with matching versions. Real provider signature verification and
  tamper rejection passed:4Flutter tests, no failures.
- Metadata/signature/V9-floor/mapping tests:25passed, zero skipped.
- S2 inspect_module: all7packages accepted, zero issues, all4required handlers
  exported. The initial out-of-root path was rejected; exact package copies were
  inspected under the existing permitted development directory without changing
  S2's path policy. Inspection does not prove live media/audio/subtitle success.
- Frozen beta-261 rollback verification passed:40module hashes, bundle members,
  artwork and provider signatures/minima; frozen files unchanged.
- Historical app imports passed against9.0.0(575943a6),9.0.55(0e925ffd) and
 9.0.81(bab2adbd), with no minimum-version gate failures. This verifies index,
  signatures and package import in those app revisions, not live playback.
  Summary: /private/tmp/v9-import-history-vLMZe2/summary.json.
- The older optional bundle-import test was not counted as passed: it is opt-in
  and assumes no provider envelope. The current comprehensive V9 repository
  compatibility test above validates the correct46-member bundle instead.

Logs: /tmp/v9-test-anime-sync.log, /tmp/v9-test-anime-repository.log,
/tmp/v9-test-anime-metadata-tests.log, /tmp/v9-test-anime-flutter-import.log,
/tmp/v9-test-anime-historical-import.log. Publication is gated on these checks;
the pushed main commit and public HTTP/hash read-back are verified separately.

## Release limits

This sync does not fix all provider outages, repeated-open failures or DNS on
older binaries. AniKoto's official beta.7 explicitly retains reopen/DNS caveats;
other latest official releases also retain their physical/audio/caption limits.
No fresh standard S2 playback certification or phone installation is claimed.
This is owner-authorized TEST distribution of the already published runtime
fixes, not a new declaration that those live services always work.

Rollback: revert this TEST sync commit to restore the prior active descriptors
and Bundle153. Old archives remain available. No app-data migration is involved.
