# DramaCool 1.0.2 — subtitle fix (TEST bundle 141)

**What it is:** the subtitle fix for `dramacool-v1` (`SP-VID-066-DRAMACOOL` #66) — same certified
bytes as production. Promoted here too so testing-bound installs/owners get it without waiting for a
production update they would never see.

**Why (three defects, one symptom — episodes played but showed no subtitles the site itself shows):**

1. The source's player API (which returns the stream URL **and the caption tracks**) is JSON. The
   app bridge parses JSON natively and hands modules an empty `text()` with the payload behind
   `json()` — the module only read `text()`, so that API always looked empty and the module fell
   through to embeds that carry no captions.
2. Route selection stopped at the first playable embed. On many episodes one embed has **no**
   captions (VidBasic) while another carries **six** (megavid/KissKH) — the module never looked.
3. Caption URLs are referer-gated, and tracks carried no per-track headers (the app strips
   referer/origin when a track inherits stream headers) → 403 even when a track was found.

**Fixed 1.0.2:** JSON-defensive `request()`; caption-aware route preference (bounded, with fallback
preserved); per-track headers + `srclang` (English first, auto-selected); HLS-master subtitle
renditions scanned; VidBasic's encrypted `?sub=` token decrypted and probe-gated (currently stale
upstream → stays hidden rather than showing a broken option); plus `searchResults('')` now returns
the home cards (the app-runtime home leg previously failed).

**Verified on exactly these bytes** (sha256 `311718668b9c95837ec60cb3df0f6bb716c7bed030afccbca20476f9fa29a43a`):

- Captions confirmed in-app: sampled episode → `stream subs=6` through the real app bridge on both
  8.5.33 and 9.0.71; tracks include English (default), Arabic, Indonesian, Malay, Khmer, Dutch —
  verified as real SRT cues with the headers the module now emits.
- House tester PASS 28/0/3; S2 quick **PASS, zero failure codes**.
- Release gate: Package PASS; its stream probe trips the known `seg_html` classifier (the VidBasic
  CDN serves real MPEG-TS bytes under `text/html`) — the live 1.0.1 fails identically (measured).

**KNOWN LIMITS:** episodes whose routes all lack caption tracks stay honestly empty (the source has
none); the VidBasic-only episodes wait on the source refreshing its stale caption token; the site's
own search hiccups (`no_search_hit`) appear on every build.

**How to test:** Settings → Media & Sources → **Check** → DramaCool row should offer **1.0.2**.
Open any 2026 drama episode (e.g. *Against the Current* E2/E3) → subtitles menu should list up to six
languages with English pre-selected.
