# Module Testing PL

Public, opt-in Synthetiq Player testing repository. Maximum three active modules.

Add this repository in Player:
https://github.com/kas021/Module-Testing-PL

Direct index:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

This is a community-format testing index, not signed with the official production key. Accept the community-repository confirmation only if you intend to test these candidates.

No active testing candidates. Owner-approved **AnimeHeaven 4.1.0** is released through the official repository; its beta is retired here. KickAssAnime is the next audit, not yet a testing update. Existing Player versions reject empty testing repositories, so use the official repository for this release and re-add testing when a new candidate is announced.

The previous 4.0.7-beta.1 package remains reachable for cached-index compatibility but is not active. `retired-packages.json` excludes retained old package URLs from the active build. Failed beta.1/beta.2 multi-server experiments were never published.

Released Miruro 4.1.0, YFlix 1.1.0 and Synthetiq Movies 1.2.5 remain retired from testing. Old packages stay archived for rollback.

AniKage is no longer active here. StreamUnity has been retired from testing at the owner's request, not newly promoted to production. Old ZIPs and QA notes are archived for rollback, not listed as installable candidates.

## Maintenance

The Movies candidate uses StreamUnity English/Sub routing, Cinejoy-first subtitles, Wyzie fallback only when needed, and bounded subtitle caching. See [baseline QA notes](SYNTHETIQ_MOVIES_QA.md).

Add one root-manifest module ZIP under modules/, then run `node scripts/build.mjs` and commit the generated index and bundle. Never add credentials or other modules implicitly. Keep module IDs stable. Never modify an already distributed version's bytes.

Every owner-requested test fix must be versioned, pushed here and verified at its public index/package URLs before being described as available. Local-only work is not a delivered test update.

When promoting a candidate to the official repository, retire it from this active index in the same release operation and verify both indexes. The daily/manual cleanup is a fallback: it retires equal or older candidates once the same module has an equal or newer stable version. It never promotes a test ZIP automatically. Archived files and immutable old bundles remain for rollback and cached-index compatibility; only the current index and bundle define active testing modules. This does not uninstall modules from phones. Keep the official repository linked for stable releases.

When no candidates remain, the index is disabled and empty. Existing Player versions may reject an empty repository; add it again when testing resumes. No app-code changes are made here.
