# TVApp Live beta.8 sports trial

Owner-approved TEST-only addition in Bundle 143. Use Player 9.0.90 or newer.
This is not a production release or a promise that every listed sports feed works.

## Try it

Import the test repository, choose Live, select TVApp Live, and search Rally TV.
The exact channel tested is `ppv:17270`. Rally TV showed motorsport programming;
the samples do not prove a currently airing race or football match.

Direct package: `modules/TVApp-Live-0.1.0-beta.8.zip`.
SHA256: `ec21c360e4e34fd7030ec64759db309764956d3a722351cf8c0a257b6d7063f8`.

## What changed

- Check playlists before handing a route to the player.
- Try up to three distinct provider-listed routes if one fails; keep HD-first order.
- Reject HTTP/HTML/empty-playlist failures without weakening native media validation.
- Accept partial-only low-latency HLS playlists.
- Do not interpret arbitrary binary text as proof that an off-air feed has resumed.

Request scheduling budgets are advisory because this app's bridge has its own
fixed request timeout. The native player still verifies actual media bytes.

## Verification

- 10 module fixtures passed.
- S2 quick PASS: real Flutter module runtime and media decoding for Rally TV.
  Run: `2026-10-16T22-21-25-017Z_s2_tvapp-live-v1_06bf7c3f`.
- Exact-ZIP native V9 Live simulator test PASS (02:08): sustained playback,
  pause/resume and fresh Go Live. Startup recovered from a transient HTTP 502.
- Physical iPhone acceptance is pending; no user data was cleared.
- Tennis, Fox Cricket, Willow, NHL and NFL checks exhausted 11 candidate routes
  without a usable playlist. Earlier probes returned HTTP 403. Those are not
  certified working matches/channels; no access controls were bypassed.
- S2 standard PASS: runtime, media decoding and simulator playback all passed
  for Rally TV. Run: `2026-10-16T22-23-41-573Z_s2_tvapp-live-v1_0b053787`.
  This is not certification of every catalogue entry or spoken audio languages.
- Repository integrity and 8 signature fixtures passed. The actual app's 3
  repository signature/import fixtures passed against Bundle 143.
- Independent review confirmed all 41 previous module descriptors and archive
  payloads are unchanged. Only the new module and newly signed publication-bound
  subtitle descriptor differ. Provider configuration, artwork and fallbacks remain.

No app rebuild is required if 9.0.90 is already installed. No production module
repository, account service, app installation or App Store release was changed.
