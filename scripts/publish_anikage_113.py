"""Publish AniKage 1.1.3 to Module-Testing-PL (bundle 152 -> 153). Same certified bytes as production."""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
CERTIFIED = Path("/Volumes/ZX20/tmp/spain-vet/Anikage-1.1.3.zip")
EXPECTED_SHA = "70002c6570c46129d00e71c9cf623f7b44bc2ddea2cb559933b10ede1554fff4"
OLD_ZIP = "Anikage-1.1.2.zip"
NEW_ZIP = "Anikage-1.1.3.zip"
RELATIVE = "modules/" + NEW_ZIP
NEW_BUNDLE = 153
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

NEW_LINES = [
    "1.1.3: Playback restored. The source now hands back an opaque token instead of a direct URL and the module discarded it as \"not a URL\", so every provider looked dead. Tokens are expanded through the source's own proxy now, the live providers (wave/koto/megg) are tried first, and quality labels come from the stream itself (720p/360p) instead of a bare Auto. Verified: release gate ALL_PASSED.",
]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


package_bytes = CERTIFIED.read_bytes()
package_hash = digest(package_bytes)
assert package_hash == EXPECTED_SHA, f"certified hash mismatch: {package_hash}"
with ZipFile(CERTIFIED) as archive:
    manifest = None
    for name in archive.namelist():
        if name.endswith(".json"):
            data = json.loads(archive.read(name))
            if isinstance(data, dict) and data.get("id") == "anikage-v1":
                manifest = data
    assert manifest, "manifest missing"
    assert manifest["moduleVersion"] == "1.1.3"
    assert manifest["moduleIdentity"] == "SP-VID-063-ANIKAGE"
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}...")

catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 152, "unexpected catalogue base"
old = [e for e in catalogue["modules"] if e["file"] == "modules/" + OLD_ZIP]
assert len(old) == 1, "old AniKage entry not found"
kept = old[0].get("changelog", [])
old[0]["file"] = RELATIVE
old[0]["changelog"] = NEW_LINES + [line for line in kept if not line.startswith("1.1.3:")]
assert all(e["file"] != "modules/" + OLD_ZIP for e in catalogue["modules"])
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)

bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), f"bundle {NEW_BUNDLE} already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    names = set(bundle.namelist())
    assert names == {Path(f).name for f in files}, "bundle contents mismatch"
    assert NEW_ZIP in names and OLD_ZIP not in names
bundle_hash = digest(bundle_path.read_bytes())
print(f"bundle   {bundle_path.name} {bundle_hash[:16]}... ({len(files)} packages)")

index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 152, "unexpected index base"
entry = [m for m in index["modules"] if m["moduleId"] == "anikage-v1"]
assert len(entry) == 1 and entry[0]["version"] == "1.1.2", "unexpected index state"
entry = entry[0]
catalogue_entry = [e for e in catalogue["modules"] if e["file"] == RELATIVE][0]
assert entry.get("presentation") == catalogue_entry.get("presentation"), "presentation drifted"
now_ms = int(time.time() * 1000)
entry["version"] = "1.1.3"
entry["sha256"] = package_hash
entry["packageUrl"] = PREFIX + RELATIVE
entry["packagePath"] = "/kas021/Module-Testing-PL/main/" + RELATIVE
entry["signature"] = ""
entry["publishedAtMs"] = now_ms
entry["changelog"] = catalogue_entry["changelog"]
seen = {}
for candidate in index["modules"]:
    num = candidate["moduleIdentityNumber"]
    assert num not in seen, f"duplicate identity number {num}"
    seen[num] = candidate["moduleId"]
index["testingIdentity"] = "|".join(f"{m['moduleId']}:{m['version']}:{m['sha256']}" for m in index["modules"])
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

sums_path = ROOT / "SHA256SUMS"
sums = sums_path.read_text() if sums_path.exists() else ""
if not sums.endswith("\n"):
    sums += "\n"
for path, value in ((RELATIVE, package_hash), (f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip", bundle_hash)):
    lines = sums.splitlines()
    if any(line.endswith("  " + path) for line in lines):
        sums = "\n".join(f"{value}  {path}" if line.endswith("  " + path) else line for line in lines) + "\n"
    else:
        sums += f"{value}  {path}\n"
for self_path in ("catalogue.json", "repository.json"):
    value = digest((ROOT / self_path).read_bytes())
    lines = sums.splitlines()
    for i, line in enumerate(lines):
        if line.endswith("  " + self_path):
            lines[i] = f"{value}  {self_path}"
    sums = "\n".join(lines) + "\n"
sums_path.write_text(sums)
print("SHA256SUMS updated")
subprocess.run(["node", str(ROOT / "scripts/sign_repository.mjs"), "--community", "--write"], check=True)
print("signed")
