# JustAnime 1.1.0-beta.4: owner testing

Not an official stable release. App code, accounts and backend remain unchanged.

## Changes

- Preserve module ID justanime-v1 and all existing identity fields.
- Resolve AniNeko, MegaPlay and AnimeGG independently. Return only routes passing a bounded media response check, with a 14-second provider deadline. Unavailable routes are excluded.
- Keep each server's headers and subtitles together. Preserve display labels and use canonical language codes, including Arabic and regional Portuguese/Spanish captions.
- Expose AnimeGG's returned MP4 quality choices. HLS stays Auto; arbitrary child playlists are not advertised as safe audio-bearing qualities.
- Never replace missing Dub with Sub, or invent episode one for empty/invalid inputs.
- Enable the existing discovery contract; bound episode pagination to four requests at once.
- Preserve valid intro/outro markers; omit zero-length markers.

## Evidence

- Ten focused regression tests pass, including Flutter's timer environment without clearTimeout.
- Initial beta.1 broad media probe: ten fixed titles, rotating first/middle/latest episode; 10/10 Sub and 3/3 sampled Dub routes decoded video AND audio for two seconds. Every Sub sample downloaded English soft captions. This is not ten complete episodes, native playback or spoken-language proof for all titles.
- Exact beta.4 S2 quick Sub run: `2026-09-10T18-54-09-593Z_s2_justanime-v1_704a3fde`, PARTIAL, no failure codes. Real Flutter import/home/search/details/episodes/stream pass. First/middle/latest media checks pass. Spy x Family sampled audio identified as Japanese. Twelve captions parsed; no confirmed language contradictions. Some language classifications remain uncertain.
- Earlier unpublished betas failed a Flutter timer compatibility check and malformed regional language codes. These were fixed before this testing release.
- A beta.3 repeat probe reached seven passing Sub titles and three passing Dub routes before ENOSPC prevented saving further results. It is incomplete, not a second ten-title pass. The completed beta.1 report is retained separately.
- Official logo URL responds HTTP 200, image/png.

## Limitations and phone checks

- Native simulator/device playback has not been certified for this package. Internal disk is nearly full; no rebuild or cleanup was performed.
- Provider responsiveness varies; opening playback can take up to approximately 14 seconds while alternatives settle. AniNeko currently returns unusable media on sampled routes and is omitted rather than shown as a broken server.
- Some titles have only one working server. Extra quality choices are provider-dependent. Check the quality picker after choosing AnimeGG; per-server quality handling still needs owner phone confirmation.
- Subtitle labels originate with the provider. Semantic detection does not reliably confirm every language. AnimeGG may rely on burned-in subtitles, not soft tracks.
- Test Spy x Family episode 1 in Sub and Dub: sound, English/Arabic captions where returned, server switching mid-play, long seeks, download and offline playback. Test a second title before approval.

Official JustAnime 1.0.0 is unchanged. Do not promote this beta until owner QA approval and remaining evidence are reviewed.
