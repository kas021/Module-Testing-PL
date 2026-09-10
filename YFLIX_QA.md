# YFlix 1.1.0-beta.1

Private opt-in testing candidate, not approved for official release.
Baseline: official YFlix 1.0.0. Stable module ID: yflix-v1.
Only module source, module tests, packaging and queue documentation changed.

## Changes

- Re-resolve explicit play/retry requests instead of reusing an indefinitely cached media URL.
- Parse custom TMDB IDs before URL normalization; preserve season/episode hashes.
- Return named server/quality alternatives with their own headers and subtitles.
- Keep the quality menu within the initial provider. Other providers are selected through Servers.
- Do not invent 720p for unknown-quality routes or English for unknown captions.
- Preserve subtitle languages and provider-specific headers.
- Call the external subtitle fallback only when the selected provider returns no tracks.
- Reject Lookmovie title-search results without matching TMDB identity, rather than choosing the first hit.
- Handle object-valued fetchv2 JSON responses.

## Evidence

Seven module regression tests passed. JavaScript syntax check passed.
Six exact-ID live resolutions passed ffprobe video+audio checks:
Inception, Moana 2, The Matrix, Silo S1E1, Breaking Bad S3E7, Severance S1E2.
Each returned 5-6 alternatives and 1080p/2160p/720p/480p labels.
The primary sampled routes contained H.264 video and AAC audio.
These probes do not prove the spoken language, exact content, native playback,
all alternative qualities, full downloads, or full-episode subtitle synchronization.
See LIVE_PROBE.json for timings and per-title evidence.

S2 standard run: 2026-09-10T11-54-37-818Z_s2_yflix-v1_4f226e67.
Real Flutter Inception home/search/details/episodes/stream flow passed.
S2 result: PARTIAL, no reported failure codes. English subtitles matched English
with 0.857 confidence. The simulator test returned ok and video position advanced
for 120 seconds, but its detailed checkpoints reported an audio-device
initialization error (no sound). This is NOT a complete audible playback pass.
Spoken-language analysis was skipped because the transcript was empty.

## Remaining Gates

- Breaking Bad and Severance resolution took approximately 14-15 seconds.
- Severance S1E2 returned no captions in the sample.
- Automatic audio-language analysis produced no usable transcript for Inception.
- All alternative servers and qualities need owner playback/seek checks.
- Full download and offline replay are unverified.
- No verified intro/outro marker source has been added.
- No new audio-language switching is claimed.
- Lookmovie fallback availability is reduced where its search response lacks TMDB identity.
- Existing app quality switching cannot atomically replace provider subtitles;
  use Servers for provider changes. No app code was changed to work around this.
- This is a six-title probe, not a 30-title certification.

## Phone QA

Check for updates from Module Testing PL and confirm 1.1.0-beta.1.
Test one movie and one later-season TV episode. Check initial play, long seeks,
server changes, quality changes, available subtitles, download and offline replay.
Retry after leaving and reopening playback. Report title, episode, server and quality.

ZIP SHA-256: ad2bd64b2164b31eb2199c2ecc9a19c56c6f3c94d9ca01c82c78c77f83097c1d
