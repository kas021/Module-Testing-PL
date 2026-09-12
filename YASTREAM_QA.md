# YASTREAM 1.0.1-beta.2 - owner testing

## Beta 2 changes and focused evidence

SHA-256: ab06cdf2076ebc669090dfb5534e27afb15fd88a1f99ee5190a060ce25a44e06

Featured now returns a hero section with eight real catalogue cards.
Some providers use PNG filenames/MIME for actual MPEG-TS video. The module
checks exact HTTP 206 single-byte ranges at offsets 0, 188 and 376, requiring
TS sync bytes, consistent content length and a whole number of 188-byte packets.
Actual images, ignored ranges, mismatched ranges and invalid lengths fail closed.
The single-byte checks avoid binary corruption through Flutter's UTF-8 bridge.

11/11 regression tests passed. Backdoor (2026) episode 3, Parasite and Train to
Busan resolved and decoded five seconds of audio/video at offsets 0 and 90
seconds: 6/6 focused host samples. This is not broad coverage or language proof.
Backdoor's second route returns 403 MissingKey and is not returned as working.

FFmpeg's default segment-extension filter rejected PNG-named chunks; the host
decode check explicitly allowed their extensions. That proves decodable video
data, NOT compatibility with the native iPhone player. Owner device testing is
still required. No app code changed. Previous beta ZIP remains immutable.

## Historical beta 1 evidence

Published to the opt-in testing repository at the owner's explicit request.
Not a stable release; full QA is BLOCKED/incomplete.

SHA-256: 9b203d392a9b5338d8acdb41215ddfc659c4f9ca4e9a37af771648b8e73766cc

Changes: current search routes, stable episode identity, no fabricated episodes
for empty series, provider request headers, checked server/quality choices and
per-server subtitles. Unsupported Dub is rejected rather than substituted.

Evidence: 10/10 regression tests passed. Train to Busan had short host audio/video
decode evidence. This does not prove playback on a phone.

The planned 30-title check stopped on disk exhaustion. Some broad test selections
matched similarly named shows, so there is no valid overall title pass rate.
Some HLS providers label video chunks as PNG; current validation rejects those
routes. Upstream metadata sometimes returns an error message as a title.
S2 quick was interrupted; native playback, language, seeking, downloads and
offline playback remain unverified. No app code or production module was changed.

Owner checks: search Train to Busan, confirm the exact title, play, seek forward
and back, inspect available servers/subtitles, then test a download separately.
Report title, episode, selected server and app/module versions for any failure.
