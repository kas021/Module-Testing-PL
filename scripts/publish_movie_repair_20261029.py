"""Publish MovieDB 0.1.0-beta.15 + Alpha Movies 0.2.0-beta.4 to the TESTING catalogue (bundle 150 -> 151).

Same certified bytes as production. Update-in-place for both modules.
"""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"
NEW_BUNDLE = 151

MODULES = [
    {
        "certified": Path("/Volumes/ZX20/tmp/spain-vet/MovieDB-0.1.0-beta.15.zip"),
        "expected": "78b3b4afdd3b372227ee6a4f2de3336b25a8f389593353aee8e6f315f05f0cbb",
        "old_zip": "MovieDB-0.1.0-beta.14.zip",
        "new_zip": "MovieDB-0.1.0-beta.15.zip",
        "module_id": "moviedb-wiki-v1",
        "version": "0.1.0-beta.15",
        "identity": "SP-VID-083-MOVIEDB",
        "identity_number": 83,
        "lines": [
            "0.1.0-beta.15: Revived the catalogue and playback after the old source disappeared. Search, details, episodes and the home row fall back to TMDB, and streams come from the MoviesAPI/VidSpark provider with English subtitles; the original providers stay behind it as fallbacks. Verified on the exact bytes: release gate ALL_PASSED, TRON: Ares plays at 804p with a subtitle track.",
        ],
        "drop_prefix": "0.1.0-beta.15:",
    },
    {
        "certified": Path("/Volumes/ZX20/tmp/spain-vet/AlphaMovies-0.2.0-beta.4.zip"),
        "expected": "fa442fd94cb07e66d054d9ffa79dd7e569ba144e0db10ae8ab3b54fe2206f329",
        "old_zip": "Alpha-Movies-0.2.0-beta.2.zip",
        "new_zip": "Alpha-Movies-0.2.0-beta.4.zip",
        "module_id": "alpha-movies",
        "version": "0.2.0-beta.4",
        "identity": "SP-VID-079-ALPHA-MOVIES",
        "identity_number": 79,
        "lines": [
            "0.2.0-beta.4: Playback restored. The old providers are gone (Videasy's backend no longer exists and Stream Unity was retired), so streams now come from the MoviesAPI/VidSpark provider first with English subtitles, and the old chain stays behind it as a fallback. Verified on the exact bytes: release gate ALL_PASSED, TRON: Ares plays with a subtitle track.",
        ],
        "drop_prefix": "0.2.0-beta.4:",
    },
]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


for mod in MODULES:
    package_bytes = mod["certified"].read_bytes()
    package_hash = digest(package_bytes)
    assert package_hash == mod["expected"], f"{mod['new_zip']}: certified hash mismatch {package_hash}"
    with ZipFile(mod["certified"]) as archive:
        manifest = None
        for name in archive.namelist():
            if name.endswith(".json"):
                data = json.loads(archive.read(name))
                if isinstance(data, dict) and data.get("id") == mod["module_id"]:
                    manifest = data
        assert manifest, f"{mod['new_zip']}: manifest missing"
        assert manifest["moduleVersion"] == mod["version"], manifest["moduleVersion"]
        assert manifest["moduleIdentity"] == mod["identity"]
        assert manifest["moduleIdentityNumber"] == mod["identity_number"]
    target = ROOT / "modules" / mod["new_zip"]
    if target.exists():
        assert digest(target.read_bytes()) == package_hash, f"{mod['new_zip']}: existing file differs"
    else:
        shutil.copyfile(mod["certified"], target)
    mod["sha"] = package_hash
    mod["relative"] = "modules/" + mod["new_zip"]
    print(f"package  {mod['relative']} {package_hash[:16]}...")

catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 150, "unexpected catalogue base"

for mod in MODULES:
    old = [e for e in catalogue["modules"] if e["file"] == "modules/" + mod["old_zip"]]
    assert len(old) == 1, f"{mod['old_zip']}: catalogue entry not found"
    kept = old[0].get("changelog", [])
    old[0]["file"] = mod["relative"]
    old[0]["changelog"] = mod["lines"] + [line for line in kept if not line.startswith(mod["drop_prefix"])]
    assert all(e["file"] != "modules/" + mod["old_zip"] for e in catalogue["modules"])
    mod["presentation"] = old[0].get("presentation")

catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

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
    for mod in MODULES:
        assert mod["new_zip"] in names
        assert mod["old_zip"] not in names, f"{mod['old_zip']}: superseded ZIP must not travel in the new bundle"
bundle_hash = digest(bundle_path.read_bytes())
print(f"bundle   {bundle_path.name} {bundle_hash[:16]}... ({len(files)} packages)")

index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 150, "unexpected index base"
now_ms = int(time.time() * 1000)
for mod in MODULES:
    entry = [m for m in index["modules"] if m["moduleId"] == mod["module_id"]]
    assert len(entry) == 1, f"{mod['module_id']}: index entry not found"
    entry = entry[0]
    catalogue_entry = [e for e in catalogue["modules"] if e["file"] == mod["relative"]][0]
    assert entry.get("presentation") == catalogue_entry.get("presentation"), f"{mod['module_id']}: presentation drifted"
    entry["version"] = mod["version"]
    entry["sha256"] = mod["sha"]
    entry["packageUrl"] = PREFIX + mod["relative"]
    entry["packagePath"] = "/kas021/Module-Testing-PL/main/" + mod["relative"]
    entry["signature"] = ""
    entry["publishedAtMs"] = now_ms
    entry["changelog"] = catalogue_entry["changelog"]

seen = {}
for candidate in index["modules"]:
    num = candidate["moduleIdentityNumber"]
    assert num not in seen, f"duplicate identity number {num}"
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
print(f"index    {len(index['modules'])} modules, bundle {NEW_BUNDLE}")

sums_path = ROOT / "SHA256SUMS"
sums = sums_path.read_text() if sums_path.exists() else ""
if not sums.endswith("\n"):
    sums += "\n"
for mod in MODULES:
    for path, value in ((mod["relative"], mod["sha"]),
                        (f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip", bundle_hash)):
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
