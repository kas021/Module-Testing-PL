# TVApp Live beta.10: TEST-only cricket trial

Owner approved the sports trial in this repository, conditional on native V9
playback. Main production modules and App Store publication are out of scope.

## Candidate

- Player minimum: 9.0.91 (271).
- Module: `tvapp-live-v1`, identity 81, version `0.1.0-beta.10`.
- SHA-256: `53ad7b27f4723e4f9e1286891e614ccbd64ac0477879a75f6ba30fbc0cc1c0a5`.
- Test entry: Live TV -> TVApp Live -> Willow (`ppv:27493`).

The app narrowly validates and removes the observed WebP/EXIF wrapper around
MPEG-TS segments on explicit Live routes only. Ordinary images remain rejected.
The module requests normalization and removes an image-filename heuristic that
incorrectly marked real video off air. No experimental browser resolver ships.

## Evidence and limits

- 11 module fixtures and 91 focused app tests pass; one optional network test skips.
- The exact final ZIP/hash passes the real Flutter/iOS SharedPlaybackHost test
  on a dedicated iOS 26.2 simulator: 60 seconds playback, 30-second pause, resume
  without rewind, fresh Go Live resolution/controller and continued progress.
  Native test duration: 2:08. Screenshots show Willow cricket programming.
- This is a functioning linear cricket channel. Observed programming included
  replays/WCL footage; it is not proof of a match currently in progress.
- S2 standard run `2026-10-16T22-50-30-267Z_s2_tvapp-live-v1_f1da74dc`
  remains FAIL: the Node video journey cannot resolve this channel, despite the
  actual iOS runtime succeeding. It is not a general certification PASS.
- Physical iPhone audio/playback, Android, other channels and football remain
  unverified. Provider guide labels are not playback verification.

## Repository integrity

Bundle 144 replaces only TVApp beta.8 with beta.10. All other 41 bundled module
ZIPs remain byte-identical. Native provider/default declarations are re-signed
for the publication revision and verified. Old package files remain available.
No signed media URLs, credentials, cookies or provider tickets are recorded here.
