# EV01 1.1.0-beta.1: Experimental Testing

Withdrawn from active testing at the owner's request. Retained as historical evidence only.

Published for owner-requested testing only, 12 September 2026. Not certified for
stable release. The official EV01 package is unchanged.

SHA-256: `18b129ef10eb1b05e5018e3815895cc86b659568dc28210c8eb6238786bbf6e3`.
Identity: ev01-v1 / ev01_v1 / SP-VID-046-EV01 / 46.

## Evidence and Limitations

- Package inspection, Flutter import and load passed.
- Nine focused fixture regressions passed again before this testing handoff.
- Recorded S2 quick run `2026-09-12T20-54-41-142Z_s2_ev01-v1_28c66a60` is
  FAIL / RUNTIME_PROCESS_FAILED: Home failed. It did not reach media playback.
- Separate live probes returned HTTP 451, identifying a UK legal restriction.
  No bypass was attempted. Affected users may still be unable to use this beta.
- Featured and endless browsing remain unfinished. Server/quality/subtitle,
  sustained native playback and download/offline certification remain outstanding.

The beta preserves parsed fetchv2 JSON, refuses unsupported Dub, requires exact
fallback title matching, reports failed season requests rather than silently
returning an incomplete list, and reports regional HTTP 451 without mirror loops.
These fixture-tested changes do not establish successful live playback.

## Owner Test

Add the repository index linked in README, select Ev01 1.1.0-beta.1 and check Home
and search first. If these fail, send a sanitized report with app/module version;
do not repeatedly retry a regional restriction. If they work, test a movie and
multi-season series, confirm the correct title/episode, then playback, seek,
server choices and subtitles. Test downloads and offline playback separately.
