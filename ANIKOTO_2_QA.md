# Anikoto 2 - testing only

Owner requested the independent DeepSeek candidate under the name Anikoto 2.
Version 0.1.0-beta.7 changes only manifest name/version from beta.6.
Identity remains synthetiq-anime-direct / SP-VID-077-ANIME-DIRECT (77),
separate from official anikoto-v4. No official module or app code changed.

Frozen input ZIP SHA256:
a349257991141b7ec6321e72df0c6885a4a742dcde368d3d6ffc240fe2827eba.
Unchanged index.js SHA256:
afb468cf78b297193facd2302d9010c2126ab9d782a55a050a022e11c557a55b.

DeepSeek's earlier beta.5 report records 30/30 resolutions and 29/30 host
decodes. Those are not fresh beta.7 playback results. Its native simulator
certification did not complete. Device playback, seek/resume, full downloads,
offline playback and broad language verification remain unverified.

Provider outages/rate limits can withhold episode lists. Flow and Zuri are
provider server names, not proof of independent infrastructure.

Fresh renamed-package S2 quick PASS:
2026-09-13T00-09-19-605Z_s2_synthetiq-anime-direct_d66f9c92.
Dr. Stone Sub real Flutter runtime and first/middle/latest media checks passed;
sampled speech identified Japanese. Italian caption detector result was Portuguese
at low confidence (0.396), so broad caption-language accuracy is not certified.
No simulator run in this quick profile.

Initial run 4c571fa4 reported LANGUAGE_CONTRADICTION because English was supplied
as the expectation while the tester's generic journey selected default Sub for
its media probes. Inspection of the recorded journey confirmed lang=sub. This
was a test invocation mismatch, not a verified wrong-Dub result. Corrected run
above preserves the original evidence and does not certify Dub audio.
