# Alpha Movies 0.1.0-beta.3

Owner-approved experimental testing release, 2026-09-13. This is NOT a stable
release or a replacement for Synthetiq Movies. Install it as a separate source.

Identity: `alpha-movies` / `alpha_movies_v1` / `SP-VID-079-ALPHA-MOVIES` / 79.
The unpublished prototype used 78, already owned by Drama Direct. First public
testing distribution uses 79. Existing official modules are unchanged.

Playback JavaScript is byte-identical to reviewed beta.2:
`59df3508e2922dbe8018448721f80b0ddcb7bd9ed942001101bb88945a39bda9`.
Beta.3 changes only package version, identity and testing description.

## Evidence And Limits

- 28/28 mocked regression tests passed.
- Final beta.2 fixed-ID resolution: 6/6 titles returned streams, English caption
  files and Arabic options. Other advertised languages were not all verified.
- An earlier exploratory source snapshot resolved 18/20 titles. Game of Thrones
  and Severance timed out; successful calls reached 42 seconds. This was NOT a
  20-title device playback test or exact final-package certification.
- Beta.2 S2 standard: FAIL. Flutter import/catalogue/episodes/resolution and
  three host media checks passed for Inception. Simulator playback failed with
  `tcp: ffurl_read returned 0xffffffc4`; pause/seek completion was not proven.
- S2 also flagged Persian subtitles as Arabic. Sample inspection found Persian;
  the tester has no Persian classifier. The correct Persian label was preserved.
- Spoken audio, physical-device playback, complete downloads, offline playback
  and full subtitle synchronization remain unverified. Multiple server names
  still depend on one provider, not independent providers.

## Owner Test

1. Select Alpha Movies, search Inception (2010), and play Movie.
2. Check video and audible dialogue, then pause/resume and seek forward/back.
3. Try each offered server and quality. Check that audio continues.
4. Select English, then Arabic where available; verify the displayed language.
5. Try Breaking Bad S1E1 and Silo S1E1, then one title of your own choice.
6. Send the playback report for a failure, including title, episode and module
   version. A returned link or successful download alone is not a playback pass.

Do not migrate favourites or remove Synthetiq Movies for this test.
