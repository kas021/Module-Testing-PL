# Synthetiq Movies 1.2.4-beta.3

Opt-in test candidate only. No app-code or production-backend changes.

## Changes

- StreamUnity Sub route with explicit English audio metadata required; never request its Italian Dub route.
- Cinejoy subtitles first. Wyzie is called only when primary subtitles are missing or unusable.
- Small, bounded, on-demand subtitle caches and coalesced requests.
- Existing backend backup retained, but unknown or non-English audio is rejected.

## Evidence

- 14 subtitle regression tests passed.
- 20 title/episode subtitle cases: 18 Cinejoy successes, one successful Wyzie fallback, one failure (Wyzie returned exhausted-balance HTTP 402).
- Three combined stream/subtitle checks passed for Inception, Toy Story and Breaking Bad S1E1. These verify resolution and media, not native playback.
- Final beta.3 Flutter runtime import, catalogue, episode, stream and media/download probes passed.
- ZIP SHA-256: `ab22a6bd949a5e56e451e9ccb4fa247fa5819e594bd34bc70c073b42a7076be3`.

## Remaining checks

Native playback, repeated seeking, spoken-English confirmation, full subtitle synchronization, offline playback and slow-provider recovery still require device testing. The earlier beta.2 S2 run failed its simulator gate because compilation timed out; this candidate is not S2-certified. Cinejoy usage terms and quotas are not established. A resolved URL or downloaded file is not proof of successful player playback.

Check movies and TV episodes on your device, including a server change and a long seek. Report the title, episode, device, audio language and exact failure. Keep the official repository linked; this candidate does not change the official release.
