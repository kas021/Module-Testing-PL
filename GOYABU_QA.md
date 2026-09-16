# Goyabu 1.0.0-beta.4 — QA notes (owner testing)

**What it is:** Brazilian Portuguese anime module for Synthetiq Player, sourcing
goyabu.io. Both **Dublado** (dub) and **Legendado** (sub) runs appear as separate
catalogue entries, exactly like on the site.

**Identity:** SP-VID-082-GOYABU (#82) · contract v4 · `discovery_v1` · version 1.0.0-beta.6 · SHA256 2da4b2eafbb7e534eef1d2bbec31becc280d3533dbbadc3e6d5e486981f82bdb

**beta.6 adds:** infinite-scroll home feed (the site's own catalogue API, 59 pages), +18 titles removed
from search and every discovery row (harvested from the site's own +18 genre), Dublado/Legendado labels
on every card, a Dublado row on home, and a one-shot retry with a fresh resolve on the play path.

## What to test

1. Install from this testing repo (Settings → Media & Sources → Check).
2. Home: "Populares da Semana" (hero), "Mais Assistidos Hoje", catalogue grid.
3. Search e.g. `naruto`, `frieren`, `one piece` — you should see both **Dublado**
   and **Legendado** entries for the big titles.
4. Open a title → episode list should be complete (Naruto Clássico Dublado: 102;
   Frieren Legendado: 28) → play any episode.

## Verified before publish

- Search / details / episodes / stream resolution — all live against the site.
- Dublado: Naruto Clássico Dublado ep 1 → direct MP4 resolved.
- Legendado: Frieren ep 1 → direct MP4 resolved.
- House module tester: **29 PASS / 0 FAIL / 1 informational WARN** and it
  downloaded a real **65 KB video/mp4** sample from the resolved stream.
- Streams are direct MP4 (Google/Blogger-hosted); no HLS juggling, no proxy tricks.

## Known limits (honest)

- Some **old legendado episodes** have had their Blogger video deleted upstream
  (the site still lists them). Those return "no stream" — nothing client-side can
  recover a deleted video; newer shows are fine.
- The tester's "Bleach: expected 366, got 368" warning is the site's own catalogue
  count; informational only.
- pt-BR content only — titles, episode labels and the site are all Brazilian
  Portuguese.
