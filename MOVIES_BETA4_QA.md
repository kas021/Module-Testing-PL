# Moana subtitle mismatch: beta.4

Live investigation on 2026-09-10 reproduced an upstream mislabeled file for
TMDB movie 1108427 (Moana 2026). The first English entry named Moana.2016
contained 20,235 Arabic-range characters and zero Latin letters. The second
English entry contained zero Arabic-range characters and 22,755 Latin letters.

The module previously validated subtitle timing syntax, but trusted the list's
language label. Beta.4 rejects obvious non-Latin-script dominance in English
tracks and tries the next bounded primary candidate before Wyzie. Hydration
also rejects such mismatches in English fallback tracks. Arabic requested
explicitly remains supported. This heuristic is not complete language detection.

18 regression tests passed. Live final-package subtitle calls for Moana 2026,
Moana 2016 and Moana 2 returned English-labeled captions with zero Arabic-range
characters, respectively 1125, 1233 and 1785 cues, and no Wyzie calls.
Native player rendering and full-film synchronization remain unverified.
No app code changed. Previous immutable beta packages are preserved.
