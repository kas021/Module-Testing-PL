# Player TestFlight 9.0.81 (261)

Import this compatibility repository using Settings > Media Sources > Advanced >
Module repositories > Add, then Install Bundle:

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/beta-261/repository.json

Do not clear app data or uninstall Player. This is the frozen, previously repaired
Bundle 141 catalogue with 40 modules and its signed Synthetiq Subtitles declaration.
It preserves the original publication timestamp, signatures and exact package hashes.
Newer Live TV trials and Movy are excluded because their declared app requirements
exceed this TestFlight build. This does not promise every upstream stream works.

The root repository.json remains the newer development catalogue, requiring 9.0.92.
Users already on a compatible newer build should continue using the root link.
Do not lower that bundle's minimum to work around an old-client error.

Validation: node scripts/verify_beta_261.mjs
