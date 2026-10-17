"""Publish Synthetiq Anime 1.0.5-beta.4 (real-resolution quality labels) to the TESTING catalogue.

Update-in-place, bundle 146 -> 147. Test variant = certified beta.4 code + the TEST-only
catalogueMapping/sourceFallbacks manifest blocks the testing channel carries, so test-bound
installs get the fix without losing the test metadata.
"""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
CERTIFIED = Path("/Volumes/ZX20/tmp/spain-vet/tpl-anime/Synthetiq-Anime-1.0.5-beta.4.zip")
EXPECTED_SHA = "58b3be1fd70f09963c8d83b5bf8f489718805d6218f8c38686fcb943841479a3"
OLD_ZIP = "Synthetiq-Anime-1.0.5-beta.3.zip"
NEW_ZIP = "Synthetiq-Anime-1.0.5-beta.4.zip"
RELATIVE = "modules/" + NEW_ZIP
NEW_BUNDLE = 147
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

NEW_LINES = [
    "1.0.5-beta.4: Quality labels now report the real verified resolution - a single-height stream shows its actual height (e.g. 720p) instead of a bare \"Auto\", and the duplicate quality rows are gone.",
    "1.0.5-beta.4: Same certified code as production. Streaming and subtitle handling unchanged; captions appear only when the source actually serves a subtitle track.",
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
            if isinstance(data, dict) and data.get("id") == "synthetiq-anime-v1":
                manifest = data
    assert manifest, "manifest missing"
    assert manifest["moduleVersion"] == "1.0.5-beta.4", manifest["moduleVersion"]
    assert manifest["moduleIdentity"] == "SP-VID-074-SYNTHETIQ-ANIME"
    assert manifest["moduleIdentityNumber"] == 74
    assert manifest["contentType"] == "video"
    assert manifest.get("config", {}).get("catalogueMapping"), "TEST-only catalogueMapping missing"
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}...")

# ---- 2. catalogue: swap the entry file, roll the bundle forward ---------------
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 146, "unexpected catalogue base"
old = [e for e in catalogue["modules"] if e["file"] == "modules/" + OLD_ZIP]
assert len(old) == 1, "1.0.5-beta.3 catalogue entry not found"
kept = old[0].get("changelog", [])
old[0]["file"] = RELATIVE
old[0]["changelog"] = NEW_LINES + [line for line in kept if not line.startswith("1.0.5-beta.4:")]
assert all(e["file"] != "modules/" + OLD_ZIP for e in catalogue["modules"])
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

# ---- 3. bundle 147 from the catalogue's own file list ------------------------
bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), f"bundle {NEW_BUNDLE} already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    assert set(bundle.namelist()) == {Path(f).name for f in files}, "bundle contents mismatch"
    assert NEW_ZIP in bundle.namelist()
    assert OLD_ZIP not in bundle.namelist(), "superseded ZIP must not travel in the new bundle"
bundle_hash = digest(bundle_path.read_bytes())
print(f"bundle   {bundle_path.name} {bundle_hash[:16]}... ({len(files)} packages)")

# ---- 4. index: module entry + bundle block in one write ---------------------
index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 146, "unexpected index base"
entry = [m for m in index["modules"] if m["moduleId"] == "synthetiq-anime-v1"]
assert len(entry) == 1 and entry[0]["version"] == "1.0.5-beta.3", "unexpected index state"
entry = entry[0]
catalogue_entry = [e for e in catalogue["modules"] if e["file"] == RELATIVE][0]
assert entry.get("presentation") == catalogue_entry.get("presentation"), "presentation drifted"
now_ms = int(time.time() * 1000)
entry["version"] = "1.0.5-beta.4"
entry["sha256"] = package_hash
entry["packageUrl"] = PREFIX + RELATIVE
entry["packagePath"] = "/kas021/Module-Testing-PL/main/" + RELATIVE
entry["signature"] = ""
entry["publishedAtMs"] = now_ms
entry["changelog"] = catalogue_entry["changelog"]
seen = {}
for candidate in index["modules"]:
    num = candidate["moduleIdentityNumber"]
    assert num not in seen, f"duplicate identity number {num}: {seen[num]} vs {candidate['moduleId']}"
    seen[num] = candidate["moduleId"]
index["testingIdentity"] = "|".join(
    f"{m['moduleId']}:{m['version']}:{m['sha256']}" for m in index["modules"]
)
index["publishedAtMs"] = now_ms
bundle_block = dict(index["bundle"])
bundle_block.update({
    "version": NEW_BUNDLE,
    "packageUrl": PREFIX + f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "packagePath": f"/kas021/Module-Testing-PL/main/bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "sha256": bundle_hash,
    "signature": "",
})
index["bundle"] = bundle_block
write_json(ROOT / "repository.json", index)
print(f"index    {len(index['modules'])} modules, synthetiq-anime -> 1.0.5-beta.4, bundle {NEW_BUNDLE}")

# ---- 5. SHA256SUMS, then sign -----------------------------------------------
sums_path = ROOT / "SHA256SUMS"
sums = sums_path.read_text() if sums_path.exists() else ""
if not sums.endswith("\n"):
    sums += "\n"
existing = {l.split("  ", 1)[1] for l in sums.splitlines() if "  " in l}
for path, value in (
    (RELATIVE, package_hash),
    (f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip", bundle_hash),
):
    if path in existing:
        sums = "\n".join(
            f"{value}  {path}" if line.endswith("  " + path) else line
            for line in sums.splitlines()
        ) + "\n"
    else:
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
sums_path.write_text(sums)
print("SHA256SUMS updated")
subprocess.run(["node", str(ROOT / "scripts/sign_repository.mjs"), "--community", "--write"], check=True)
print("signed")
