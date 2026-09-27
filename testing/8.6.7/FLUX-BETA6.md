# Flux beta.6 test update

## Scope
Synthetiq Flux 1.0.3-beta.6 fixes an empty episode catalogue when the primary provider cannot verify availability. It retains aired metadata entries for stream resolution, with bounded availability checks. Unknown availability is not proof that an episode or audio track will play. Module identity and playback validation remain unchanged. Anime and AniKoto packages are unchanged; production is untouched.

## Evidence
- 15/15 fixture and packaging tests passed, including unavailable, unverified, throwing and timed-out availability, aired bounds, audio windows and multiple translated rescue captions.
- S2 standard run 2026-09-27T13-12-08-182Z_s2_synthetiq-anime-direct_85898080: runtime passed; first/middle/latest media probes passed. Overall BLOCKED: NO_IOS_SIMULATOR. This is not native playback certification.
- User reported more than ten minutes of Attack on Titan Dub with repeated seeking on the preceding PL build, and fast downloading. Sub, offline playback and beta.6 device checks remain pending.
- User reported intermittent restart after backgrounding/locking the iPad. Unresolved. The existing pause/resume patch is already present in 8.6.7; no duplicate v9 port was applied.

## Retest
Refresh this repository and update Flux to 1.0.3-beta.6:
https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/testing/8.6.7/repository.json

Search One Piece, reopen its details and refresh episodes. Test one aired episode in Sub and Dub where actually available. Also repeat Attack on Titan playback and seeking. Record title, episode, audio, module version and technical report for failures.

For resume: note position, pause, go Home or lock the device for 30 seconds, return and press Play. Repeat without pausing and with a two-minute lock. Record whether playback returns to the noted position, briefly reloads, or resets to zero. Do not treat a brief reload that restores position as a zero-position restart.

## Subtitles and auto-skip
The app downloader iterates all subtitle tracks returned by a source, not just the selected English track. Rescue parsing preserves available translations for the selected audio edit. Primary-route caption validation has a six-track/time budget, so completeness is not guaranteed; no subtitle completeness fix is claimed here. Auto-skip requires Plus, enabled settings and valid intro/outro markers. No auto-skip changes were made.

## Rollback
The previous beta.5 ZIP remains unchanged in modules/. Reinstall that package to roll back this test module. No app rebuild is required for this change.
