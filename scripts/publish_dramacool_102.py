"""Publish DramaCool 1.0.2 (subtitle fix) to the TESTING catalogue — update-in-place, bundle 140 -> 141.

Same certified bytes as the production release: users on the TEST repo (and the owner's testers) get
the subtitle fix too, instead of waiting for a production-bound update they would never see.
The module bytes are unchanged; identity stays SP-VID-066-DRAMACOOL (#66).
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
    "dramacool-subtitle-fix-20261011/DramaCool-1.0.2.zip"
)
EXPECTED_SHA = "311718668b9c95837ec60cb3df0f6bb716c7bed030afccbca20476f9fa29a43a"
OLD_ZIP = "DramaCool-1.0.1.zip"
NEW_ZIP = "DramaCool-1.0.2.zip"
RELATIVE = "modules/" + NEW_ZIP
NEW_BUNDLE = 141
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

CHANGELOG = [
    "1.0.2: Subtitles fixed — the source's player API (which carries the caption tracks) was unreadable to the module, so episodes played without the subtitles the site itself shows. The module now reads it, prefers the player that carries captions, and delivers every track with the headers it needs — English first, auto-selected.",
    "1.0.2: Also fixed the empty home row and hardened captions (HLS subtitle renditions are surfaced; a stale caption link is hidden instead of showing a broken option). Verified on both app lines and S2 with captions confirmed in-app — up to 6 languages per episode.",
    "1.0.1: Fixed multi-server stream extraction (KissKH, VidHide, VidBasic, Vidmoly) for 2026 dramas",
    "1.0.1: Scoped episode parsing and prevented genre leaks across all drama series",
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
            if isinstance(data, dict) and data.get("id") == "dramacool-v1":
                manifest = data
    assert manifest, "manifest missing"
    assert manifest["moduleVersion"] == "1.0.2", manifest["moduleVersion"]
    assert manifest["moduleIdentity"] == "SP-VID-066-DRAMACOOL", manifest["moduleIdentity"]
    assert manifest["moduleIdentityNumber"] == 66
    assert manifest["contentType"] == "video"
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}…")

# ---- 2. catalogue: swap the entry file, roll the bundle forward --------------
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 140, "unexpected catalogue base"
old = [e for e in catalogue["modules"] if e["file"] == "modules/" + OLD_ZIP]
assert len(old) == 1, "1.0.1 catalogue entry not found"
old[0]["file"] = RELATIVE
old[0]["changelog"] = CHANGELOG
assert all(e["file"] != "modules/" + OLD_ZIP for e in catalogue["modules"])
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

# ---- 3. bundle 141 from the catalogue's own file list -------------------------
bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), "bundle 141 already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    assert set(bundle.namelist()) == {Path(f).name for f in files}, "bundle contents mismatch"
    assert NEW_ZIP in bundle.namelist(), "1.0.2 missing from the bundle"
    assert OLD_ZIP not in bundle.namelist(), "1.0.1 must not travel in the new bundle"
bundle_hash = digest(bundle_path.read_bytes())
print(f"bundle   {bundle_path.name} {bundle_hash[:16]}… ({len(files)} packages)")

# ---- 4. index: update the dramacool entry + bundle block in one write --------
index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 140, "unexpected index base"
entry = [m for m in index["modules"] if m["moduleId"] == "dramacool-v1"]
assert len(entry) == 1 and entry[0]["version"] == "1.0.1", "unexpected dramacool index state"
entry = entry[0]
catalogue_entry = [e for e in catalogue["modules"] if e["file"] == RELATIVE][0]
assert entry.get("presentation") == catalogue_entry.get("presentation"), "presentation drifted"
now_ms = int(time.time() * 1000)
entry["version"] = "1.0.2"
entry["sha256"] = package_hash
entry["packageUrl"] = PREFIX + RELATIVE
entry["packagePath"] = "/kas021/Module-Testing-PL/main/" + RELATIVE
entry["signature"] = ""
entry["publishedAtMs"] = now_ms
entry["changelog"] = CHANGELOG
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
print(f"index    {len(index['modules'])} modules, dramacool -> 1.0.2, bundle {NEW_BUNDLE}")

# ---- 5. SHA256SUMS: package + bundle lines, then the JSON self-hashes LAST ----
sums = (ROOT / "SHA256SUMS").read_text()
if not sums.endswith("\n"):
    sums += "\n"
existing = {l.split("  ", 1)[1] for l in sums.splitlines() if "  " in l}
for path, value in (
    (RELATIVE, package_hash),
    (f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip", bundle_hash),
):
    assert path not in existing, f"unexpected pre-existing line for {path}"
    sums += f"{value}  {path}\n"
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
