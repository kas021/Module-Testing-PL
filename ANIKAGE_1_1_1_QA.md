# AniKage 1.1.1 candidate

Module-only change. No app source edits. Published to the opt-in testing repository by owner request; not an official stable release.

Changes: honour Retry-After (seconds or HTTP date), use a host-scoped in-memory
cooldown, stop the provider cascade on 429, and remove delayed automatic JSON
retries which could outlive the resolver timeout. Cooldowns last only for the
module runtime lifetime; they are not shared across devices or persisted.
No claim of fixing seek stalls or permanent server-switch freezes.

Verification:
- 13 Node fixture regression tests passed.
- S2 quick: PARTIAL, run 2026-09-10T01-19-42-810Z_s2_anikage-v1_85fb5339.
- Real Flutter runtime passed. First media continuity and middle media metadata
  checks passed; latest media failed STREAM_DECODE_FAILED.
- English caption detection passed (0.911). Spoken-audio detection skipped.
- No native seek/server-switch or physical-device validation for this candidate.
- Standard release certification not run; no stable publication.

JoJo Stardust Crusaders (ID: LFoYaqrNMF), episode 1 Sub:
Neko returned no sources. Paced wave requests returned embed options, but sampled
Vidplay returned 404, DGHG returned 403, and BYFMS returned a JS application shell
rather than a playlist. Further investigation is required; no working route for
this episode is established by these checks. No credentials or signed URLs stored here.

Current public testing version is 1.1.1. Version 1.1.0 is preserved unchanged in _module_history/.
