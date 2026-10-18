# Player TestFlight 9.0.81 (261)

Import this compatibility repository using Settings > Media Sources > Advanced >
Module repositories > Add, then Install Bundle:

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/beta-261/repository.json

Do not clear app data or uninstall Player. This is the frozen, previously repaired
Bundle 141 catalogue with 40 modules and its signed Synthetiq Subtitles declaration.
It preserves the original publication timestamp, signatures and exact package hashes.
Newer Live TV trials and Movy are excluded because their declared app requirements
exceed this TestFlight build. This does not promise every upstream stream works.

Update, 2026-10-18: the root repository now admits all V9 versions and is the
recommended link for ordinary imports. This snapshot stays frozen for rollback;
its older minimum versions and original signatures are intentionally unchanged.

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

Validation: node scripts/verify_beta_261.mjs
