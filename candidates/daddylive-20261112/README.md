# DaddyLive: blocked playback candidate

This is an explicitly requested TEST-only QA artifact, not an active module
release. It is intentionally absent from the repository index and bundle.

Version: 0.1.0-beta.3. Requires Player V9 Live discovery support.

Import, catalogue, search, details and channel selection passed the real Flutter
runtime. Ten local fixtures passed. The catalogue contained 879 non-adult channel
listings; that is NOT a count of working channels.

S2 standard certification: **FAIL**, run
`2026-11-12T23-03-55-162Z_s2_daddylive-v1_daa20564`.
Sky Sports Main Event, Astro Cricket and Star Sports exposed media returning HTTP
403 in the checks. No native playback or media decode success is claimed.

Manual import is for checking discovery and reporting current route errors only.
Do not replace an existing working Live module, clear app data, or expect this
candidate to play matches. No app/player changes or credentials are included.

ZIP SHA-256:
`7dc5840d6b30d61b83182af621f7c595aa04511976d501e79337bdf9a694d619`.

The provider's supported native delivery/authorization still needs investigation
before this candidate can become a normal installable repository entry.
