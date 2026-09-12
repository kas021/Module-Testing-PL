# Testing 1 2 3 - intentional playback failure fixture

Version: 1.0.0-beta.1. Identity: testing-123-v1 / SP-VID-998-TESTING-123.
SHA-256: ccac67154d2fef13694f715a4c32fc47e79180abad96499b361ebf656f0834ed

Owner requested a deliberately failing module for testing the alternate-source
UI in Player 8.5.55+117. This is not a content provider. Never promote it to the
official catalogue or bundle it with the app. It contains no media or posters.

## Phone test

1. Import/check this testing repository and select Testing 1 2 3.
2. Open One Piece and play episode 1 (the only episode).
3. After the normal bounded recovery attempts, expect Source Playback Issue.
4. Select Try another source. Choose a real installed anime module, then
   confirm One Piece and its correct first episode.
5. The alternative should resolve normally. Cancel/Back must not start a
   different source. If the alternative fails, test Return to original source:
   this deliberately fails again, because the original is this fixture.

Keep a real anime module such as AniKoto or Synthetiq Anime installed separately.
No tokens, downloads, passwords, app data, or real media hosts are needed by the
fixture. Both Sub and Dub selectors intentionally produce the same error.

## Evidence

- S2 inspect_module: PASS, two ZIP entries, all required exports, no issues.
- Four Node tests: PASS. Catalogue/search/details/one episode checked; repeated
  Sub/Dub requests reject; zero fetch/fetchv2 calls; packaged JS matches source.
- Real Flutter runtime on the 8.5.55 app checkout: import, load, Home, search,
  details and episodes PASS. Stream fails in 28 ms, as designed. The existing
  positive-playback test exits FAIL because this fixture has no stream. That is
  expected failure evidence, not a playable-module certification.
- No native WatchScreen/iPhone popup observation has been claimed; owner tests
  the actual failure UI using the installed 8.5.55+117 binary.
- Existing local global identity audit has unrelated missing/duplicate legacy
  registry entries and excludes private-build ZIPs. Identity 998 was absent in
  175 top-level package manifests, the registry and the public video catalogue;
  it is now reserved locally for this testing-only fixture.

Repository build policy retains three normal candidates plus this one specific
failure fixture. Existing candidate packages and immutable bundle URLs remain
unchanged; the new combined bundle has its own version and checksum.
