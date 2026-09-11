# Movie Direct 0.3.0-beta.2 - Owner Testing

Published for owner-requested testing only. **S2 PARTIAL; not stable certified.**
This module does not replace Synthetiq Movies.

- Identity: `movie-direct-v1` / `movie_direct_v1` / `75` /
  `SP-VID-075-MOVIE-DIRECT`.
- Package: `modules/Movie-Direct-0.3.0-beta.2.zip`.
- SHA-256: `9ed5cb857debab8751cb8305d285715aedcd89fb2e9fefafa9d0f33921de75e8`.
- Minimum Player version: `8.5.33`.
- Same immutable bytes as the previously private beta.2 package.

## Changes

TMDB catalogue identity -> VideoEasy provider API -> device-direct CDN playback.
No StreamingUnity lookup, YFlix page scraping or hosted media relay. Two source
routes still share one upstream provider; they are not independent services.

Fixed Flutter JSON response handling, exact movie/season/episode identity,
relative HLS URLs, quality and per-server subtitle metadata. Keeps unknown
audio languages unknown and does not advertise a fabricated English Dub.
Preserves external-audio master playlists to avoid silent rendition switches.
Fresh resolution has bounded requests, duplicate-request coalescing and a
rate-limit cooldown. Real TS media with an incorrect image MIME is accepted;
actual image/HTML placeholder media is rejected.

## Evidence

- Final beta.2 offline regression suite: **16/16 pass**.
- Earlier beta.1 frozen 30-title probe: **24/30 resolved, decoded and sought**.
  Each pass is five seconds of FFmpeg decode at the start plus five seconds
  after seeking to 90 seconds. It is not 30 native or full-film playback tests.
- Final beta.2 repeat: four titles passed; fifth seed request returned HTTP
  429. Stopped immediately. Remaining 25 titles were not attempted, not failed.
  Other verification was running concurrently; this is not a quota benchmark.
- Beta.2 S2 quick: real Flutter runtime and media checks pass; overall PARTIAL,
  simulator playback not run.
- Earlier beta.1 actual macOS Player: Inception playback, long seek,
  pause/resume, English captions and 2160p switching observed.
- Beta.2 Inception probes confirm real 480p/720p/1080p/2160p video dimensions
  with audio. This does not promise those qualities for every title.
- Short machine speech samples detect English for Breaking Bad S3E7 and
  Ted Lasso S1E1. Inception speech sample was inconclusive.

## Open Limits

Provider rate limiting remains a real limitation. Wait when it asks; repeated
retries or restarting do not repair upstream capacity. Final beta.2 iPhone,
Android and native Mac playback remain unverified. Full-film subtitle timing,
spoken languages, prolonged switching and offline playback are not certified.
Only genuine standalone subtitle tracks are listed; segmented subtitle HLS is
not offered as a VTT file. TV catalogue enumeration retains the baseline nominal
400-episode cutoff, so very long series can be incomplete.

## Owner Check

Use Inception (2010), Breaking Bad S3E7 and Ted Lasso S1E1. Check correct title
and episode, audible language, captions, pause/resume, a long timeline seek,
and each returned server/quality. Switch back to another module if the provider
limits requests. Report the title, episode, selected option and what failed.
Do not assume a subtitle or extra quality exists when the source does not return it.
