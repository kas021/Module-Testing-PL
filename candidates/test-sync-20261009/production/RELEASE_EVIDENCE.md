# Production Sync Candidate Evidence

Date: 2026-10-09

## Source and Scope

Fetched the current `main` index from:

`https://raw.githubusercontent.com/kas021/Synthetiq-Modules/main/repository.json`

The index identifies repository `synthetiq-official-modules` and contains 38
entries. `candidate_entries.json` is the four complete upstream records, with
production URLs, hashes, signatures, versions and changelogs preserved. This
candidate-sync task did not edit the root TEST index.

The TEST worktree was clean at start (`bdff47c`). A later status check found
separate concurrent edits to `repository.json` and other root files. They were
not made or reconciled by this task and remain untouched. The current root
index now has TEST-hosted paths for these four versions, plus X-Stream
`1.3.4-beta.1`, MovieDB `0.1.0-beta.14`, and Bundle 136. The candidate JSON
retains production URLs; it does not rewrite the root index.

At TEST commit `bdff47c`, KickAssAnime was `4.1.0` and Shahiid was `2.1.1`;
CimaCub and Anime4up were absent.

| Module | TEST state | Candidate | ZIP SHA-256 | Manifest identity |
|---|---|---|---|---|
| `kickassanime-v3` | `4.1.0` | `4.2.0` | `4f31c3cd519a37ecf552e838f6d4e3b41fa72e8ab91f5489ff8c326b4bc8748f` | `SP-VID-038-KICKASSANIME` / 38 |
| `shahiid-v1` | `2.1.1` | `2.1.2` | `242d17684dd2576d6407fa5e09304a0c53f8607f64b82a92996dc998f0971688` | `SP-VID-055-SHAHIID` / 55 |
| `cimacub-v1` | absent | `1.2.0` | `3ddee1d22400b00963d5085b92efd648f36e64128c8af0a9dffbea55b995de86` | `SP-VID-287-CIMACLUB` / 287 |
| `anime4up-site-v1` | absent | `1.0.0-beta.10` | `3a28b4175a7030105490930820720fde63f9a49fffe1013cbc51d33c74668a2c` | `SP-VID-101-ANIME4UP` / 101 |

## Failure Evidence

- **KickAssAnime:** TEST `4.1.0` release evidence records five sampled failures: no stream for Tomo-chan Is a Girl! episode 7, Spy x Family episode 12, Rowdy Sumo Wrestler Matsutaro!! episode 24, and Amanchu! Advance episode 12; Naruto Shippuden episode 1 returned Sub/Dub playlists without decodable audio. Its S2 simulator summary was missing because Xcode could not build with the Mac filesystem full. Production `4.2.0` changelog evidence is for search recall and season ordering (natural-query hits 22/24 to 24/24; season-qualified cases 2/8 to 8/8); it does **not** claim those media failures or the simulator blocker are fixed.
- **Shahiid:** TEST `2.1.1` records a 500-episode ceiling for the tested One Piece season, a removed Google Drive special, Boruto episode 150 returning Share4Max 404, and backup servers that can fail decoding after HTTP success. Production `2.1.2` reports direct page walking beyond 500 (One Piece 530 to 860 reachable; episode 1180 plays), safe handling of `/seasons/` entries with no player, and ranking specials below seasons. Its index changelog does not say the removed upstream file, Boruto 404, or all backup-server failures are resolved.
- **CimaCub:** Production `1.2.0` says episodes with all three listed mirrors deleted can now use extra mirrors found in the page's download section. It still reports dead individual mirrors; DoodStream is behind a bot wall and Cybervynx playlists resolve to ad images, so those hosts remain excluded.
- **Anime4up:** Production `1.0.0-beta.10` says the app runtime's JSON response had empty `text()`, which discarded Share4Max server lists. The release notes report JSON-based parsing and both payload shapes, a 9-second phase bound, 6/6 live Share4Max shares after the fix versus 0/6 before, 20/20 parser checks, and 2,000 accepted episode URLs.

These failure/fix statements are release-index and existing TEST release-note
evidence, not fresh playback results for these four downloaded ZIPs.

## Local Verification

- All four release downloads returned HTTP 200.
- Downloaded ZIP hashes match the corresponding production `sha256` values.
- All four archives pass `unzip -t`; each contains only `module.json` and
  `index.js`.
- Every manifest's `id`, `moduleVersion`, `moduleFamilyId`,
  `moduleIdentity`, and `moduleIdentityNumber` match its production index
  record.
- No JavaScript handlers were run; no S2, playback, language, or device tests
  were performed. This is a hash/identity-verified candidate sync, not module
  certification.
