# MAIN to TEST sync - 15 November 2026

## Frozen Inputs

- MAIN: `6c161b923a1c79a7a0571c71823c876d7421bb07`, bundle 165.
- TEST baseline: `7be583c42d754486a39051ab3c8187c0274388a7`, bundle 159.
- Scope: preserve V9 TEST overlays and newer fixes; mirror only tested upstream
  improvements. MAIN and Player source are not changed by this repository sync.

## Comparison

Of 39 shared modules, 27 already have identical package hashes. Another three
have identical JavaScript with TEST-only catalogue/fallback manifest overlays:
Synthetiq Anime Direct, AniPM and AniKoto. Keep their existing TEST packages.
Synthetiq Anime beta.9 and Miruro beta.11 are newer in TEST; do not downgrade.

Seven upstream candidates required testing. Each frozen ZIP was downloaded with
redirects followed and verified against the MAIN index hash. X-Stream retains
TEST catalogue/fallback fields; its non-manifest files match MAIN byte for byte.

| Candidate | Version | Quick check | Disposition |
| --- | --- | --- | --- |
| AnimeHeaven | 4.1.1-beta.1 | PASS, runtime and three media probes | Adapted-standard PASS; include |
| X-Stream | 1.3.5-beta.1 | PARTIAL, runtime and three media probes | Native checks pass; PARTIAL language verification; TEST only |
| StreamingUnity | 1.0.5-beta.3 | PARTIAL, runtime and three media probes | Native checks pass; PARTIAL language verification; TEST only |
| Movy | 0.1.0-beta.4 | PARTIAL, runtime and three media probes | Native TCP read failure during sustained playback; hold |
| Yflix | 1.1.3-beta.2 | FAIL, caption-language contradictions | Hold |
| MegaKino | 1.1.6-beta.2 | Sub unavailable; Dub media works but language check inconclusive | Hold |
| MovieDB | 0.1.0-beta.26 | FAIL, emitted episode URL rejected by resolver | Hold |

MovieDB returned a Movy `/movie/27205` episode URL, then rejected it as an
unrecognized episode reference. This is distinct from a DNS or device failure.
MegaKino's Dub audio detector was skipped with zero confidence, so the report is
not proof of wrong German audio. It is also not sufficient evidence to promote.
Yflix has several caption-language conflicts; successful video decoding alone
does not override them. No failure gate was weakened.

## Preserved Data

Keep all six TEST-only entries: QA fallback, SoloLatino, DW Live, TVApp Live,
Public Sports Live and Public TV Live. Keep artwork, default selections, native
metadata/subtitle configuration and the V9.0.0 import floor. Re-sign existing
native declarations if the publication revision changes. Old packages/bundles
remain available; do not overwrite or delete them.

Restore MAIN's verified PNG presentation URLs for Drama Direct and KickAssAnime
without replacing their already-identical source packages. Private DaddyLive and
Toonami trials are not promoted by this sync.

## Validation and Publication

Baseline repository validation passes. The repository signature, V9 compatibility
and dual-package tooling tests pass (38 tests). Standard checks, final V9 import,
new immutable bundle verification, commit and public read-back are recorded below.

S2 checks are sampled evidence, not all-title, all-region, audio/caption timing or
physical iPhone certification. Failed, blocked and skipped checks remain visible.
No production app or MAIN repository release is performed here.

### Native Lab Setup Findings

Stock simulator runs first hit compilation timeouts. A standalone simulator build
passed in 498.4 seconds. A later run failed in CocoaPods framework embedding
(`source: unbound variable`); another reached the native test but the process
deadline terminated it at 79 seconds of the required 120-second observation.
These are retained as failed/incomplete checks, not source-health passes.

The separate `certify_build_budget_20261115.cjs` lab adapter allows 900 seconds
for the compile/setup/test process instead of 300. It does not edit the frozen
Player source or shorten observation, readiness, position, pause, seek or resume
assertions. The fixture's own 210-second test timeout stays unchanged. Each
adapted report has a separate execution receipt with the fixture hash and budget.
These results must be described as adapted standard checks, not unqualified
stock-profile passes. A dead lock left by our cancelled test was moved to private
evidence only after verifying its exact run/PID and that the owner was absent.

### Final Source Checks

| Source | Exact report ID | Native position advance | Result |
| --- | --- | --- | --- |
| AnimeHeaven / Frieren | `2026-11-15T15-26-04-045Z_s2_animeheaven-v2-1_1ab2129b` | 120,412 ms | PASS |
| X-Stream / Inception | `2026-11-15T15-00-23-101Z_s2_xstream-v1_30b3334f` | 120,662 ms | PARTIAL |
| StreamingUnity / Inception | `2026-11-15T15-08-21-618Z_s2_streamingunity-v1_d6510150` | 114,531 ms | PARTIAL |
| Movy / Fight Club | `2026-11-15T15-17-48-717Z_s2_movy-v1_7d4debe5` | No accepted completion | FAIL: TCP read error |

The accepted cases completed the unchanged 120-second observation and pause,
forward/backward seek and resume assertions. Post-seek captures were visually
reviewed and showed video. The simulator has a retained audio-device/no-sound
warning; physical sound output is not certified. Two PARTIAL grades retain
language uncertainty. None is a whole-library or every-region guarantee.
Movy's older exact-byte standard PASS was found but does not override today's
sustained native failure. Its TEST beta.1 package is retained.

### Prepared Bundle 160

- 45 module entries and 46 bundle members, preserving the subtitle envelope.
- Bundle SHA256: `8eee50864dcd76aa260e96c204ad84ad1e65e4f017783f50517472946138e770`.
- `modules/animeheaven-v2-1-4.1.1-beta.1.zip`:
  `48c550e4961f3c142c67c415924cc6cf13eefc281870645d9707c1d62ce53125`.
- `modules/xstream-v1-1.3.5-beta.1.zip` (TEST overlays retained):
  `c2f904af7e45acfdacd354cf873daf70cc1549abd32a8b99155d2179e9c2593a`.
- `modules/streamingunity-v1-1.0.5-beta.3.zip`:
  `a2e63ae3f05b2b76a5370f6514875de05577e321fecba20e140c1becd12b4863`.
- Repository verifier and 38 tooling tests pass on the new bundle. Native
  declarations were re-signed with the existing TEST key; their configuration
  and all explicit install/default choices remain unchanged.
- Fresh frozen-V9 app regression/import check: 116 passed, one skipped, zero
  failures across 16 files. The V9.0.0-floor fixture was enabled and installed
  all 45 module archives intact. Includes account/cloud-rejection retention,
  device-limit completion, startup recovery, caption credential safety, watched
  history, Premium persistence, subtitle download plans, DNS and notifications.
  This is a focused run, not a rerun of the historical full audit suite.
- Commit and public read-back: pending. No failed source update was copied into
  the catalogue.

## Rollback

Use a forward commit restoring the previous module descriptors/packages, rebuild
the bundle at a new revision and re-sign native declarations. Do not rewrite
history or replace an immutable ZIP. Verify the query-free public index and every
affected package hash after either publication or rollback.
