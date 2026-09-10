# Module Testing PL

Public, opt-in Synthetiq Player testing repository. Maximum three active modules.

Add this repository in Player:
https://github.com/kas021/Module-Testing-PL

Direct index:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

This is a community-format testing index, not signed with the official production key. Accept the community-repository confirmation only if you intend to test these candidates.

StreamingUnity 1.1.0-beta.2 is the current candidate. It adds checked server alternatives, usable subtitle files and audio-rendition checks. Thirteen regression tests passed; three live samples decoded with non-silent audio. S2 quick is PARTIAL: physical-device playback remains unverified and the originally reported silent title has not been reproduced. Quality stays Auto to preserve external audio tracks. Historical language mapping is unchanged: Sub requests English, Dub requests Italian. See [QA notes](STREAMINGUNITY_QA.md). This is not a stable release. AniKage has moved to the official repository.

## Maintenance

Synthetiq Movies 1.2.4-beta.3 is also available for testing: StreamUnity English/Sub routing, Cinejoy-first subtitles, Wyzie fallback only when needed, and bounded subtitle caching. Native playback, seeking and subtitle synchronization remain unverified. See [Movies QA notes](SYNTHETIQ_MOVIES_QA.md).

Add one root-manifest module ZIP under modules/, then run `node scripts/build.mjs` and commit the generated index and bundle. Never add credentials or other modules implicitly. Keep module IDs stable. Never modify an already distributed version's bytes.

The daily/manual cleanup workflow removes exact versions appearing in the official published index, including them from neither the active list nor the current bundle. Git history remains an audit trail. It does not uninstall modules from phones. Keep the official repository linked for stable releases.

When no candidates remain, the index is disabled and empty. Existing Player versions may reject an empty repository; add it again when testing resumes. No app-code changes are made here.
