# Mugiwara 1.1.0-beta.4

Owner testing candidate. No app/backend changes. Official 1.0.4 is unchanged.

SHA-256: `1d5ad82d88f91773bb23b47885a991fcaad4048f0d8229ca0b53f462ae78322a`

## Beta.4 Artwork Fix

Home covers incorrectly inherited the Sibnet video Referer, which the image
server rejected with HTTP 403. Separate image headers now use the site Referer.
All 30 sampled discovery covers, including all eight Featured cards, downloaded
and decoded in Flutter using the existing app image-header helpers.
12 regression tests and S2 quick passed on beta.4. Playback JavaScript and video
headers are unchanged from beta.3. Loading spinners are app-owned and unchanged.

## Changes

- Correct episode-script identity, complete season lists and missing mirror slots.
- Correct film-to-mirror mapping; no silent Sub/Dub substitution.
- Verified same-language Sibnet/Ansembed alternatives with associated headers.
- Actual HLS quality labels; MP4 stays Auto when quality is not exposed.
- Sibnet redirects resolve to the storage CDN. HTML is not returned as video.
- Successful episode scripts are briefly reused in bounded memory. HTTP 429
  stops further script requests until the source's cooldown expires.

## Evidence and Limits

The prior beta.3 S2 standard reports PASS, including
real Flutter resolution, first/middle/latest media decode and approximately
120 seconds of simulator video progression with seeking. The simulator logged
an audio-device initialization error: audible output still needs phone testing.

Boruto Sub audio was detected as Japanese; a sampled dialogue frame contains
French burned-in captions. Death Note VF dialogue was detected as French.
These samples do not certify every episode's language or caption coverage.

Initial 30-title burst: 23 resolved, seven lookup failures. Subsequent request
logging identified source HTTP 429 throttling. One fixture also used an invalid
Demon Slayer slug; its actual catalogue identity resolved both languages.
Do not interpret burst failures as fixed unlimited request capacity.

Final paced replay, with the corrected Demon Slayer identity: **30/30 titles
returned media; 54/54 available language routes passed media probes; six Dub
routes were correctly not offered.** No HTTP 429 responses in this paced run.
These are media-byte probes, not thirty full native playback tests.

## Phone Checklist

1. Browse multiple home/feed pages and check title posters.
2. Open One Piece beyond the first arc; confirm the selected episode plays.
3. Test Death Note VF and Boruto VOSTFR; confirm spoken language/captions.
4. Switch between available servers; compare offered HLS quality options.
5. Seek forward/back repeatedly, then pause and resume.
6. Download one episode and replay it with networking disabled.

Unavailable/unsupported mirrors are deliberately omitted. No public stable
release is approved by this testing publication.
