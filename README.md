# Module Testing PL

Public, opt-in Synthetiq Player testing repository. Maximum three active modules.

Add this repository in Player:
https://github.com/kas021/Module-Testing-PL

Direct index:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

This is a community-format testing index, not signed with the official production key. Accept the community-repository confirmation only if you intend to test these candidates.

The only active candidate is **Synthetiq Movies 1.2.4-beta.4**. Its module-wide subtitle validation rejects obvious script mismatches in English tracks and tries the next primary candidate before Wyzie. Arabic remains selectable through the existing language menu. See [beta.4 QA](MOVIES_BETA4_QA.md). Native playback and subtitle synchronization still need device testing.

AniKage is no longer active here. StreamUnity has been retired from testing at the owner's request, not newly promoted to production. Old ZIPs and QA notes are archived for rollback, not listed as installable candidates.

## Maintenance

The Movies candidate uses StreamUnity English/Sub routing, Cinejoy-first subtitles, Wyzie fallback only when needed, and bounded subtitle caching. See [baseline QA notes](SYNTHETIQ_MOVIES_QA.md).

Add one root-manifest module ZIP under modules/, then run `node scripts/build.mjs` and commit the generated index and bundle. Never add credentials or other modules implicitly. Keep module IDs stable. Never modify an already distributed version's bytes.

Every owner-requested test fix must be versioned, pushed here and verified at its public index/package URLs before being described as available. Local-only work is not a delivered test update.

When promoting a candidate to the official repository, retire it from this active index in the same release operation and verify both indexes. The daily/manual cleanup is a fallback: it retires equal or older candidates once the same module has an equal or newer stable version. It never promotes a test ZIP automatically. Archived files and immutable old bundles remain for rollback and cached-index compatibility; only the current index and bundle define active testing modules. This does not uninstall modules from phones. Keep the official repository linked for stable releases.

When no candidates remain, the index is disabled and empty. Existing Player versions may reject an empty repository; add it again when testing resumes. No app-code changes are made here.
