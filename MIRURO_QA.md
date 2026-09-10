# Miruro 4.1.0-beta.1 - opt-in testing

Module-only candidate based on official 4.0.1. Official Miruro remains unchanged.

## Changes

- Reject silent Dub-to-Sub fallback and unlabelled server language guessing.
- Parse server attributes regardless of ordering and deduplicate alternatives.
- Collect supported resolved servers instead of returning at first success.
- Keep each server's headers, subtitle tracks and supplied valid markers together.
- Recover caption URLs from embed parameters and tracks/subtitles arrays.
- Do not treat thumbnails or opaque caption tokens as subtitle files.
- Do not invent English labels for unknown captions or 1080p for Auto streams.
- Explicit playback/retry resolves again instead of reusing indefinite stream cache.
- Episode lists reflect returned provider episodes rather than inventing missing ones.
- Episode lookup uses exact numbers instead of falling back to list position.
- Correct embed Referer construction and remove full request URLs from error logs.
- Keep cross-provider switching in Servers so caption state stays with its source.

## Tests

Six local regression tests passed. JavaScript syntax check passed.
S2 standard result: PARTIAL. Runtime/media passed and simulator video advanced
for 120 seconds, but detailed checkpoints reported audio-device initialization
failure (no sound). Do not interpret its aggregate simulator ok as audible proof.
Real Flutter runtime flows passed:
- Attack on Titan SUB: standard S2 run 2026-09-10T12-26-33-413Z_s2_miruro-v3_e3bcc526.
- Attack on Titan DUB: 2026-09-10T12-28-56-497Z_s2_runtime_miruro-v3_ad48b000.
- Death Note SUB: 2026-09-10T12-29-22-679Z_s2_runtime_miruro-v3_ea9fbc7d.

The SUB sample at 120 seconds visibly contains English burned-in captions.
No selectable soft tracks were returned for these samples. Do not claim that
zero selectable tracks means no captions, or that this proves every title.

## Limitations

- Attack on Titan website lists three servers; only EchoVideo currently resolves
  through this module. Other embed families are not newly supported here.
- No genuine intro/outro timestamps were returned in the sampled responses.
- Native audible playback and spoken Dub language need separate verification.
- Full downloads/offline replay, other devices and broad title coverage remain unverified.
- Existing catalogue/provider fuzzy title matching still requires further audit.
- This is not a 30-title certification or an official-release approval.

ZIP SHA-256: b1540f1ac35b7609c3afe9b042859be4c48dbb46ccaa413b3d9664fa7ccf4066

Phone QA: confirm 4.1.0-beta.1, test Attack on Titan Sub and Dub, listen to the
actual spoken language, confirm burned-in English captions on Sub, seek well
ahead/back, retry after leaving playback, and download/replay offline.
