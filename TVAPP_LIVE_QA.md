# TVApp Live 0.1.0-beta.6 — QA notes (owner testing)

Identity `SP-VID-081-TVAPP-LIVE` (#81) · contract v4 · `live_discovery_v1` · V9 `9.0.0+144`.

**beta.2** fixed a manifest rejection (`caps.homeMaxResults` must be 1–120). **beta.3** added `streamType: 'hls'`. **beta.4** adds a non-blocking off-air check: after a play attempt, a channel whose media is the provider's placeholder image is reported as `unknown` (no LIVE badge) for 15 minutes, matching the app's Off-air tile marking — and the mark clears as soon as a real segment is seen.
**beta.6** fixes URL-wrapped ids: the app resolves ids against the module `baseUrl` before some handlers
(`https://tvapp1.com/ppv:17270`), which made searching in the Live section fail with "Unknown TVApp live id".
**App-runtime verified**: the real Flutter 9.0.0 runtime passes end-to-end on Rally TV (search → details → episodes →
stream → playability 206 `looksPlayable` → download probe `hlsHasSegments`).
**beta.5** widens the reviewed media-host allowlist to `akamaized.net` (the provider mixes in Akamai-hosted feeds — Rally TV; verified live: master → variant → first segment = real MPEG-TS), the off-air check now also detects the current TikTok-CDN `.image` placeholders (plus a byte-sniff fallback for future shapes), and decode failures name the reason (e.g. `reason=host-not-allowlisted:<host>`).
The package is pre-flighted against the app's own validator (`module_contract_v2.dart`) before publishing.

## Scope

Live TV guide from `tvapp1.com`: sports events and 24/7 channels from the provider's two
public catalogues (match API + PPV catalogue), built into the Live section as
`kind: channel|event` entries with honest status (`live` only when the provider says so,
`upcoming` only with an explicit future start, otherwise `unknown`).

Playback resolves fresh on every play: descriptor → the provider's `/fetch` request →
payload decoded in-module (pure JS) → HLS URL handed to the player together with the
`Referer` header the CDN requires.

## Verified evidence

| Check | Result |
|---|---|
| Guide build, live catalogues | 466–467 entries (282 match + 185 PPV records → 11 channels, 456 events) |
| Handler/contract suite (real V9 runtime shim) | 22 / 22 pass |
| In-module resolution (both families) | **4 / 5 sampled items resolved to real HLS URLs** (1 row had an empty provider descriptor at the time) |
| Media check via the app's own transport (Dart `HttpClient`) | `/fetch` POST → 200 with key header; decoded m3u8 → **200 `#EXTM3U`** |
| Media check via curl with the module's headers | Tennis Channel / NFL Network / Fox Footy → **200 `#EXTM3U`** |
| Payload decoder validation | 220+ live captures replay to well-formed URLs; decoder self-tests 14/14 |
| Live channel chain (2026-09-21) | **Rally TV: resolved → master (7 variants) → variant → segment = real MPEG-TS (6.2 MB)**; app Dart transport fetches the Akamai master (206 / `#EXTM3U`) |
| App runtime (real Flutter 9.0.0+144, Rally TV) | **All passed** — home 120 · search · details · episodes · stream (190 ms) · playability 206 `looksPlayable` · download probe `hlsHasSegments` |
| Off-air suite (stubbed, deterministic) | **17 / 17 pass** — sleepercdn + tiktokcdn placeholders marked off-air; real chains stay live; akamaized accepted; non-allowlisted host rejected visibly |
| Device/simulator playback | **NOT RUN** — needs your desk |

## Known limits (read before testing)

1. **Per-item availability is the provider's.** Some event slots return an empty descriptor
   list or a 404 at the CDN when nothing is currently broadcasting; the module reports those
   as visible errors rather than inventing a stream. Channels marked "24/7" are the most
   reliable test targets.
2. **The CDN requires `Referer`** — the module supplies it per stream; if a device player
   ignores stream headers, playback could fail on that platform. Please report the platform
   if you see it (this is the main thing device testing should confirm).
3. **The house QA harness's media-download leg fails on this provider (expected).** That check
   downloads the stream with a **Node** client, and this CDN rejects Node clients (403) while
   `curl`, Dart and browsers get 200 on the same fresh URL — and media tokens are **single-use**,
   so a URL works for exactly one fetch. Media was therefore verified with curl + the app's own
   Dart transport (200 `#EXTM3U`); treat the harness FAIL on that leg as a harness transport
   artifact, not a module defect.
4. Sub/dub: live events are single-language; `sub` is a legacy argument (dub is rejected).
4. The `delta`/`echo` sources occasionally serve an ad interstitial instead of a player; the
   module refuses those explicitly.

## How to test

1. Add the testing repository in Player and install/update **TVApp Live**.
2. Open **Live** → the guide fills with events and channels; search works (try "tennis",
   "NFL", "F1").
3. Open a channel and press Play. **Rally TV is the known-good live test right now** (real Akamai feed).
   24/7 channels (Tennis Channel, NFL Network, Fox Footy…) may be off-air at this hour — the tap then
   shows the Off-air message and the tile clears its LIVE badge for the session (expected behaviour).
4. Try a live event row too; if it errors, note the title (availability varies by hour).
5. Report with: item title, platform, what you saw on screen.

## Rollback

Retire from active testing; the ZIP and QA notes stay archived. No app changes, no
production repository involvement.
