# X-Stream 1.3.0-beta.4

Opt-in owner testing only. Official X-Stream remains 1.2.2.

SHA-256: 6475c255c2be1a42ceb6aed13c912903a3f0db1b6a4a4011d2cf3ea193cc92ad

## Repairs

- Recognize singleton provider results instead of retrying successful requests.
- Expire verified episode links after 60 seconds; cap session cache size.
- Preserve full spread-out media validation while avoiding duplicate probes.
- Explicit server choices separate providers from quality variants.
- Keep provider headers and subtitle tracks attached to the correct source.
- Call the subtitle fallback only when selected-source captions are absent.
- Keep unknown audio out of English Dub; tolerate Flutter without clearTimeout.

## Evidence

- Final code: eight focused regressions and existing contract suite pass.
- 20 fixed cases plus 10 seeded Home cases: 27/30 short host audio/video decodes.
  Three additional checks at 90 seconds decoded. Median resolution: 5.53 seconds.
  This matrix used beta.1 resolver code; later betas corrected Flutter timer
  compatibility and server/caption grouping. It is not a final-package native
  device matrix or a spoken-language audit.
- Final beta.4 S2 quick: PARTIAL. Flutter import, Home, search, details, episodes,
  stream and download-start probes passed. Media checks passed; sampled English
  subtitles matched English. Audio-language detection returned no usable transcript.
  Run: 2026-09-12T15-41-12-522Z_s2_xstream-v1_66cc959c.
- Beta.2 and beta.3 S2 standard: PARTIAL. Simulator video advanced for 120 seconds,
  but logs report audio-device initialization errors. Audible simulator sound is
  NOT verified, despite the tester's simulatorOk=true summary.
  Beta.3 run: 2026-09-12T15-38-07-926Z_s2_xstream-v1_d5b42563.

## Known gaps

No stream was returned for Paradise Hotel S1E1, Mushi-Shi S1E1 or El conquistador
S1E1. Catalogue availability does not guarantee provider coverage.
Physical iPhone/Android sound, server switching, full downloads/offline and
full-episode subtitle timing remain unverified. No claim of universal reliability.

## Owner checks

Try Inception, Breaking Bad S3E7 and Silo S1E1. Confirm audible dialogue, captions,
quality changes, each available server, long seeks and background/resume. Test a
complete download separately with networking disabled. Report exact title,
season/episode, selected server and module version if anything fails.
