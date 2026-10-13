# MegaKino 1.1.5 — host-rotation fix (TEST bundle 140)

**What it is:** the certified production build of MegaKino 1.1.5 (`SP-VID-062-MEGAKINO` #62), promoted
into the TEST catalogue because a testing-bound install never sees production updates — users on this
repo were still on 1.1.4 and reported the module as dead.

**Why (one cause):** the source rotated its numbered address again (`megakino21.com` → **`megakino23.com`**,
all older hosts 301-forwarding). The module pinned `21`/`20` and reached the site *through* those
redirects, which breaks this source's `yg_token` session handshake — cookies are minted on the host
that actually answers, so the next request arrives without them and **every call returns an empty
page**: search empty, no servers on any title.

**The fix:** the module now probes its seed hosts once per session with `followRedirects:false` and
adopts the host the source itself redirects to (bounded hops) — future rotations are followed with no
new build. Seed/fallback list refreshed to `23 → 22 → 21 → 20`; the page loader rewrites any
`megakino<digits>.com` origin instead of one pinned string. Player resolution (VOE / GXPlayer),
episode/season logic and identity are unchanged.

**Verified on exactly these bytes** (ZIP sha256 `6dd028c5…647f24` — identical to the production
release asset):

- House tester: movie “Inception” plays (stream `Deutsch dub · VOE`, real `video/mp2t` range sample);
  series “Breaking Bad” → 5 season entries (the source lists seasons separately; S5 = 16 eps, correct).
- Release gate: **ALL_PASSED** (movie + series, real segments, first attempt).
- App runtimes 8.5.33 and 9.0.71: ALL PASS (search → details → stream → playability → download probe).
- S2 quick (`--lang dub`): PARTIAL, zero failure codes — runtime + media decode PASS.
- Baseline check: the PREVIOUS 1.1.4 bytes return **zero results** for the same query — the regression
  and the fix are both reproduced.

**KNOWN LIMITS**

- German-dubbed catalogue only — a `sub` request intentionally returns no streams (S2's default
  `--lang sub` grades that as a failure; that is the honest refusal, not a defect).
- The source rotates its address every few months; 1.1.5 follows the redirect chain automatically, but
  if the family ever changes pattern entirely the seed list may need a refresh.
- Older ZIPs (1.0.3 → 1.1.4) stay in `modules/` for rollback.

**How to test:** Settings → Media & Sources → **Check** → the MegaKino row should offer **1.1.5** /
update in place (this repo). If no update appears: fully quit and reopen the app first (a stuck check
flag shows nothing), then Check again. Ground truth = the version string on the module's row.
