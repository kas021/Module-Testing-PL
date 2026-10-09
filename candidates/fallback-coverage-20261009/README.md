# TEST Fallback Metadata - Bundle 135

Four metadata-only packages add reciprocal compatible sets:

- Synthetiq Flux 1.0.3-beta.8 / Synthetiq Anime 1.0.5-beta.3: emitted AniList
  and MAL identity routes, retaining exact episode and requested Sub/Dub.
- MovieDB 0.1.0-beta.11 / X-Stream 1.3.2-beta.2: TMDB television identity,
  exact season and episode. Movie routes are deliberately excluded.

Existing AniKoto/AniPM and the diagnostic QA/AniPM fixture remain included.
In updated Player V9, imported defaults start enabled without an adoption step.
Explicit user-off settings remain off. Updated modules alone do not add the
app's automatic terminal-failure recovery code to an older installed binary.

## Evidence

- Candidate Flutter contract/mapping tests: 4 passed.
- Emitted-route checks and byte-identical playback JavaScript: passed.
- Real Flutter ZIP import, search, details and episodes: all four passed.
  Samples: One Piece and Game of Thrones respectively.
- Actual ZIP install/reconciliation test: all three real pairs enabled in both
  directions; user-off retained after reconciliation.
- Lead full host preferences plus old/expanded repository integration run:
  18 passed. Native video boundaries are faked in host widget tests.
- All 37 indexed package hashes and bundle 135 hash verified.

Overall certification is PARTIAL: catalogue/group metadata only. These results
are not native playback, audible-language, downloads, or an 80-85% live fallback
reliability measurement. Physical-device acceptance is still required. No
production repository packages or backend/user data were changed.

Prior package ZIPs remain in the repository for rollback. The new packages only
change manifests/version metadata; their playback JavaScript is unchanged.
