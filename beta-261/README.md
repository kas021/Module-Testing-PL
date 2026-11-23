# Player TestFlight 9.0.81 (261)

Import this compatibility repository using Settings > Media Sources > Advanced >
Module repositories > Add, then Install Bundle:

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/beta-261/repository.json

Do not clear app data or uninstall Player. This compatibility edition of Bundle
141 lists 39 modules. Synthetiq One is excluded from both individual imports
and Install Bundle. Its removal does not uninstall existing copies.
The edition preserves the original timestamp, retained packages, signatures
and signed Synthetiq Subtitles declaration. Its ZIP is served from its own
beta-261 path; the original 40-module ZIP has not been replaced.
Newer Live TV trials and Movy are excluded because their declared app requirements
exceed this TestFlight build. This does not promise every upstream stream works.

Update, 2026-10-18: the root repository now admits all V9 versions and is the
recommended link for ordinary imports. This snapshot is for rollback;
its older minimum versions and original signatures are intentionally unchanged.

https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/repository.json

Validation: `node scripts/verify_beta_261.mjs`. In a checkout containing the
historical revision, add `--self-test` to verify the exact retirement delta.
