# KickAssAnime 4.1.0-beta.2

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
