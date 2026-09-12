# Shahiid 2.1.0-beta.3 - testing only

Owner requested upload. Not a stable release.
SHA-256: 74cd02fe125889497bfb37dc0bcb67a9ee8aa7046427083bd8e285516ce6281e

Fixes: poster parsing, correct Sub/Dub catalogue feeds, explicit server options,
honest unknown-quality labels and additional HTTP media validation.

Eight regression tests pass. Twelve sampled episodes (six Sub, six Dub) each
had a primary stream decode video and audio. All twelve detail posters were
populated. Of 26 returned routes, 14 decoded and 12 backup routes failed.
HTTP probes still do not guarantee playback: some tnmr/Lulustream alternatives
return 403 to the media decoder. No soft subtitle tracks were found in this sample.

S2 standard Boruto run 2026-09-12T01-16-42-977Z_s2_shahiid-v1_7a65adce:
automated PASS for runtime, first/middle/latest media and simulator video/seek.
Manual logs show an audio-device initialization failure: audible simulator output
is not certified. Japanese speech was detected separately in the media sample.
Arabic Dub speech, caption identity, physical devices, downloads and offline
remain unverified. Overall handoff: PARTIAL.

AnimeAV1 1.3.0-beta.1 was temporarily removed from the active testing list to
respect the three-module cap. Its original ZIP and historical bundles remain
available; it has not been promoted to stable or deleted.
