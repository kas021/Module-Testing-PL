# Movies 1.2.4-beta.5: visible subtitle languages

Removes the one-track cap. Returns up to 64 distinct language tracks in the
normal subtitle list, including each server's list, rather than relying on an
unsupported lazy-language menu. Available languages come from the title's
subtitle catalogue; only one candidate per base language is offered. Other
language files remain URL-backed and load on selection, not all at startup.
English keeps the beta.4 script-mismatch rejection. This is not comprehensive
language detection or subtitle synchronization validation.

20 regression tests passed. Three live module-VM stream checks returned:
- Moana 2026: 36 languages on the main source and all three servers.
- Inception: 28 languages on the main source and all three servers.
- Breaking Bad S1E1: 23 languages on the main source and all three servers.

Arabic caption files were fetched successfully and contained Arabic text for
all three. Other advertised language files were not all downloaded or verified.

Real Flutter runtime run
`2026-09-10T11-00-07-349Z_s2_runtime_synthetiq-movies-v1_e2493d6f`
passed import, catalogue, details, episodes, stream and media/download probes.
Flutter parsed 36 subtitle tracks for Moana. No failure codes. This is runtime
contract evidence, not native video playback or full-film subtitle timing.

Background YFlix quality enrichment is NOT implemented. Current quality options
cannot carry their own subtitles, and no post-resolution update callback exists.
Implementing the requested flow needs an optional app capability, source-backed
quality choices, generation checks and physical-device switching tests. No app
code was changed; no production module was published.
