# Movie reliability candidates - not a release

These packages are quarantined on `codex/movie-reliability-20261005`. They are deliberately absent from the active repository index and bundle. Do not merge/promote until native playback, repeat playback and download QA are accepted. Explicit manual installation only; installing an existing module ID updates that module.

| Package | Change | Evidence / outstanding gate |
| --- | --- | --- |
| Alpha Movies 0.2.0-beta.3 | Exact catalogue/cold-start identity, source relationship guards, original release year and exact-ID TV poster fallback | Final package passed six cold/retry runtime resolutions and Interstellar quick runtime/media checks. Standard native playback gate not passed. |
| MovieDB 0.1.0-beta.10 | Fresh retry, stale-work fencing, accurate height labels, bounded HD probes and printable-error rejection | Sampled HD decoded before final probe hardening; lossy UTF-8 bridge prevents full binary packet validation. Upstream intermittency and native certification remain unresolved. |
| X-Stream 1.3.2-beta.1 | Fresh retry and stale-work fencing | Short media checks passed; final native certification and physical-device acceptance outstanding. |
| DramaCool 1.0.2-beta.1 | Read JSON-only source responses from the native bridge without changing HTML paths | Previously failing episode now resolves 3/3 and targeted Flutter runtime/playlist probes passed; final native/decode acceptance outstanding. |

No change to source identities, app data, downloads, user entitlements or production runtime endpoints. The separate StreamingUnity module remains untouched. Synthetiq Movies retirement was separately published in production bundle 132 / TEST bundle 134.

Final MovieDB retest returned and decoded only 360p for S7E13; the earlier 1080p diagnostic is not a promise of consistent HD availability. These packages are for explicit testing, not release acceptance.

## Package hashes

```text
f63404162d6735e62e031345a45bc467110ca9e0155ed4ad7749c8f8e3b2e8c2  Alpha-Movies-0.2.0-beta.3.zip
cb48407132a78022aec2855fcfceed068d110342d483ff6a5e5da1a7fb2c7390  MovieDB-0.1.0-beta.10.zip
3e2e5ca9adca75f832a8224c9a0fa046af8fbfcba9aeebefce5a50000fefacf1  X-Stream-1.3.2-beta.1.zip
6a06049d9076bf8c4e01b0b44ed987fbfabc88df658b516343cdfa4f6a75e18d  DramaCool-1.0.2-beta.1.zip
```

The complete source, focused regression tests, redacted evidence and owner QA checklist are in the Player V9 worktree at `dev_assets/modules/_development/movie-reliability-20261005/`. Raw certification logs are not included because they can contain signed media URLs.
