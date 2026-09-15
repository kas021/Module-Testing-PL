# DW Live V9 Test

Requires Player 9.0.0 or newer. Select LIVE, then DW Live (Private Test), then DW English.

Unchanged candidate: 0.1.0-beta.1, identity dw-live-v1 / 77 / SP-VID-077-DW-LIVE.
SHA-256: 8fa103a71b26e6e12f10ec59024db0fa64480df14327580706251e9b703fbe5a.

One English news channel from DW's official public live page. Resolves a fresh HLS link on play. No Streamed or StreamEx source is included.

Existing evidence: S2 quick PASS, run 2026-09-15T20-27-14-629Z_s2_dw-live-v1_3284a29c. Flutter runtime import and resolver passed; ffmpeg separately decoded 20 seconds of H264 video and AAC audio. These are not physical iPhone playback certification.

Owner testing: start playback, verify audio and advancing video, leave and reopen, then retry after changing networks. Test repository only; not a stable release.
