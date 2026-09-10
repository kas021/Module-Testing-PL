# Module Testing PL

Public, opt-in Synthetiq Player testing repository. Maximum three active modules.

Add this repository in Player:
https://github.com/kas021/Module-Testing-PL

Direct index:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

This is a community-format testing index, not signed with the official production key. Accept the community-repository confirmation only if you intend to test these candidates.

AniKage 1.1.0 is the initial candidate. Caption and runtime checks passed; native certification failed because the simulator build timed out, and some media samples stalled. See ANIKAGE_QA.md. This is not a fully certified release.

## Maintenance

Add one root-manifest module ZIP under modules/, then run `node scripts/build.mjs` and commit the generated index and bundle. Never add credentials or other modules implicitly. Keep module IDs stable. Never modify an already distributed version's bytes.

The daily/manual cleanup workflow removes exact versions appearing in the official published index, including them from neither the active list nor the current bundle. Git history remains an audit trail. It does not uninstall modules from phones. Keep the official repository linked for stable releases.

When no candidates remain, the index is disabled and empty. Existing Player versions may reject an empty repository; add it again when testing resumes. No app-code changes are made here.
