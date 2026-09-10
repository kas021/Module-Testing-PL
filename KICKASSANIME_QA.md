# KickAssAnime 4.1.0-beta.3

## Subtitle label correction

The previous parser missed provider fields serialized as [0, value] and incorrectly labelled otherwise-unmatched URLs English. Beta.3 parses complete JSON track records, retaining their language/name regardless of field ordering. Unlabelled URLs remain Unknown language, not guessed English. No title-specific mapping is used.

Bungo Stray Dogs 5 episode 1 returns English, French, German, Italian, Spanish, Portuguese, Russian and Arabic on both Sub and Dub. All eight Sub-response caption URLs returned HTTP 200 and valid WebVTT using the returned provider headers (377-420 cues each). Requests without those headers returned 403; URL/header pairing remains necessary.

The site lists VidStreaming HLS and BirdStream DASH. This module still supports only the HLS route; no new usable server was discovered. Twelve module regression tests pass.

Exact beta.3 S2 standard: PARTIAL, run 2026-09-10T18-02-26-533Z_s2_kickassanime-v3_dcfb074b. Flutter returned the exact Bungo Stray Dogs 5 episode and eight captions; first/middle/latest media passed. Subtitle analysis recognized English, French, German, Spanish, Portuguese and Arabic; Italian was low-confidence and Russian unclassified, so their source labels are not independently certified. Sample audio was detected as Japanese. Simulator video advanced to 119 seconds, but audio-device initialization failed. Owner phone playback and full offline testing remain required.

Beta.3 SHA-256: 80e644d418c75a9004d39095be6247ec31cdd45b6c7c1c62f670fd93adc6608d. Earlier probe files below refer to beta.2, not a repeated 30-title beta.3 certification.

## Previous beta.2 baseline

Module-only opt-in beta, based on official 4.0.3. No app or backend changes. Stable module identity is retained.

## Changes

- Exposes resolved server choices with each server's headers and captions.
- Keeps a completed primary stream if the bounded resolver deadline expires.
- Tries alternate episode pages after a preferred page's embeds fail.
- Does not infer English Dub merely because a page was tried first; rejects known wrong-language audio metadata.
- Parses genuine HLS resolutions but keeps Auto when child variants would lose separate audio tracks.

## Evidence

Nine focused module regression tests passed. Six live resolver/manifest cases are recorded in KICKASSANIME_PROBE.json: Attack on Titan Sub/Dub, Death Note Sub/Dub, and One Piece Sub resolve. One Piece Dub returns no stream, as on the official baseline. These probes are not audible playback proof.

The actual Attack on Titan page exposes VidStreaming HLS and BirdStream DASH. This module does not support DASH, so only VidStreaming is offered. No invented alternatives are shown.

The sampled HLS masters expose multiple resolutions but use external audio groups. A direct 1080p child probe found video without audio. Exposing that child as a quality option would produce silent playback; Auto deliberately retains the master. Manual quality therefore remains unavailable for these samples.

Exact-package S2 standard result: **PARTIAL**, run `2026-09-10T16-35-05-017Z_s2_kickassanime-v3_c1be7c03`. Flutter import/runtime, first/middle/latest media checks, and English subtitle analysis passed. Simulator video position advanced to 119 seconds, but its audio device failed to initialize. The aggregate simulator success flag does not establish audible playback. Spoken-language analysis was skipped. Physical iPhone/Android and completed-download offline playback remain unverified.

Package SHA-256: `45eb15a209cf349d96d72bc9df3a06df823b19437ce502e25590d64acef6158f`.

## Owner checks before official release

- Attack on Titan and Death Note: test Sub and Dub, audible language, captions, long seeks and pause/resume.
- One Piece: test Sub and the available captions; no working Dub is claimed.
- Test downloading and completed offline playback separately, including after restarting Player.
- Servers may show one usable choice. Quality may show Auto only for the audio-safety reason above.

Do not describe this beta as all-title, all-platform certification. Upstream intermittent delays remain possible.
