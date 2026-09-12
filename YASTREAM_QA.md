# YASTREAM 1.0.1-beta.1 - owner testing

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
