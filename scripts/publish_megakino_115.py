"""Publish MegaKino 1.1.5 to the TESTING catalogue (update-in-place, bundle 139 -> 140).

Why: users on the TEST repo still saw 1.1.4 — the app only offers updates from the repo a module is
bound to, so the production release of 1.1.5 did not reach a testing-bound install. This promotes the
identical certified bytes into the testing repo: catalogue entry file swap + changelog prepend, index
entry updated (version/sha/url/changelog), bundle rebuilt FORWARD to 140, SHA256SUMS refreshed.
The module bytes are unchanged; identity stays SP-VID-062-MEGAKINO (#62).
"""

import hashlib
import json
from pathlib import Path
import shutil
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
CERTIFIED = Path(
    "/Users/khubaibshakh/Desktop/Synthetiq Player/dev_assets/modules/_development/"
    "megakino-fix-20261011/MegaKino-1.1.5.zip"
)
EXPECTED_SHA = "6dd028c503a9b95e94293308cb907be6467092a523cd7480696fb54bb1647f24"
OLD_ZIP = "MegaKino-1.1.4.zip"
NEW_ZIP = "MegaKino-1.1.5.zip"
RELATIVE = "modules/" + NEW_ZIP
NEW_BUNDLE = 140
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

CHANGELOG = [
    "1.1.5: Fixed the module not working — the source moved to a new address again and the module kept calling the old one, which broke the source's login handshake. Search came back empty and nothing played. The module now asks the source where it lives and follows its own redirect on start, so the next move is followed automatically.",
    "1.1.5: Verified before release — a movie and a series both play with real video segments, on both app lines (8.5.33 and 9.0.71), release gate ALL_PASSED.",
    "1.1.4: Search fixed — the source moved to a new domain and switched to GET-based search; the module now follows the current host safely and uses the new search format, with pagination. Searching for series and movies works again.",
    "1.1.4: Session hardening against the source's cookie gate and domain rotation — a stale domain can no longer take the whole catalogue down.",
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


# ---- 1. the certified package ------------------------------------------------
package_bytes = CERTIFIED.read_bytes()
package_hash = digest(package_bytes)
assert package_hash == EXPECTED_SHA, f"certified hash mismatch: {package_hash}"
with ZipFile(CERTIFIED) as archive:
    manifest = None
    for name in archive.namelist():
        if name.endswith(".json"):
            data = json.loads(archive.read(name))
            if isinstance(data, dict) and data.get("id") == "megakino-v1":
                manifest = data
    assert manifest, "manifest missing"
    assert manifest["moduleVersion"] == "1.1.5", manifest["moduleVersion"]
    assert manifest["moduleIdentity"] == "SP-VID-062-MEGAKINO", manifest["moduleIdentity"]
    assert manifest["moduleIdentityNumber"] == 62
    assert manifest["contentType"] == "video"
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}…")

# ---- 2. catalogue: swap the entry file, roll the bundle forward --------------
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 139, "unexpected catalogue base"
old = [e for e in catalogue["modules"] if e["file"] == "modules/" + OLD_ZIP]
assert len(old) == 1, "1.1.4 catalogue entry not found"
old[0]["file"] = RELATIVE
old[0]["changelog"] = CHANGELOG
assert all(e["file"] != "modules/" + OLD_ZIP for e in catalogue["modules"])
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

# ---- 3. bundle 140 from the catalogue's own file list -------------------------
bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), "bundle 140 already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    assert set(bundle.namelist()) == {Path(f).name for f in files}, "bundle contents mismatch"
    assert NEW_ZIP in bundle.namelist(), "1.1.5 missing from the bundle"
    assert OLD_ZIP not in bundle.namelist(), "1.1.4 must not travel in the new bundle"
bundle_hash = digest(bundle_path.read_bytes())
print(f"bundle   {bundle_path.name} {bundle_hash[:16]}… ({len(files)} packages)")

# ---- 4. index: update the megakino entry + bundle block in one write ----------
index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 139, "unexpected index base"
entry = [m for m in index["modules"] if m["moduleId"] == "megakino-v1"]
assert len(entry) == 1 and entry[0]["version"] == "1.1.4", "unexpected megakino index state"
entry = entry[0]
catalogue_entry = [e for e in catalogue["modules"] if e["file"] == RELATIVE][0]
assert entry.get("presentation") == catalogue_entry.get("presentation"), "presentation drifted"
now_ms = int(time.time() * 1000)
entry["version"] = "1.1.5"
entry["sha256"] = package_hash
entry["packageUrl"] = PREFIX + RELATIVE
entry["packagePath"] = "/kas021/Module-Testing-PL/main/" + RELATIVE
entry["signature"] = ""
entry["publishedAtMs"] = now_ms
entry["changelog"] = CHANGELOG
# no duplicate identity numbers anywhere in the index (the app's own rule)
seen = {}
for candidate in index["modules"]:
    num = candidate["moduleIdentityNumber"]
    assert num not in seen, f"duplicate identity number {num}: {seen[num]} vs {candidate['moduleId']}"
    seen[num] = candidate["moduleId"]
index["testingIdentity"] = "|".join(
    f"{m['moduleId']}:{m['version']}:{m['sha256']}" for m in index["modules"]
)
index["publishedAtMs"] = now_ms
index["bundle"] = {
    "version": NEW_BUNDLE,
    "minAppVersion": "9.0.55",
    "packageUrl": PREFIX + f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "packagePath": f"/kas021/Module-Testing-PL/main/bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "sha256": bundle_hash,
    "signature": "",
}
write_json(ROOT / "repository.json", index)
print(f"index    {len(index['modules'])} modules, megakino -> 1.1.5, bundle {NEW_BUNDLE}")

# ---- 5. SHA256SUMS: package + bundle lines, then the JSON self-hashes LAST ----
sums = (ROOT / "SHA256SUMS").read_text()
if not sums.endswith("\n"):
    sums += "\n"
existing = {l.split("  ", 1)[1] for l in sums.splitlines() if "  " in l}
for path, value in (
    (RELATIVE, package_hash),
    (f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip", bundle_hash),
):
    if path not in existing:
        sums += f"{value}  {path}\n"
    else:
        raise SystemExit(f"unexpected pre-existing line for {path}")
for self_path in ("catalogue.json", "repository.json"):
    value = digest((ROOT / self_path).read_bytes())
    lines = sums.splitlines()
    replaced = False
    for i, line in enumerate(lines):
        if line.endswith("  " + self_path):
            lines[i] = f"{value}  {self_path}"
            replaced = True
    assert replaced, f"no SHA256SUMS self-line for {self_path}"
    sums = "\n".join(lines) + "\n"
(ROOT / "SHA256SUMS").write_text(sums)
print("SHA256SUMS updated (packages + bundle + JSON self-hashes refreshed)")
