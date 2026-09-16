# TVApp Live 0.1.0-beta.2 — QA notes (owner testing)

Identity `SP-VID-081-TVAPP-LIVE` (#81) · contract v4 · `live_discovery_v1` · V9 `9.0.0+144`.

**beta.2** fixes the manifest rejection seen in the app (`caps.homeMaxResults` must be 1–120; now 120).
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
3. Open a 24/7 channel (e.g. Tennis Channel, NFL Network, Fox Footy) and press Play —
   that is the expected-working path.
4. Try a live event row too; if it errors, note the title (availability varies by hour).
5. Report with: item title, platform, what you saw on screen.

## Rollback

Retire from active testing; the ZIP and QA notes stay archived. No app changes, no
production repository involvement.
