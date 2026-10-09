"""Assemble the reviewed production catch-up without losing V9 TEST metadata."""

import hashlib
import json
from pathlib import Path
import shutil
import time
from urllib.parse import urlparse
from urllib.request import urlopen
from zipfile import ZipFile, ZIP_DEFLATED


ROOT = Path(__file__).resolve().parent.parent
CANDIDATES = ROOT / "candidates/test-sync-20261009"
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"
EXPECTED = {
    "xstream-v1": "1.3.4-beta.1",
    "moviedb-wiki-v1": "0.1.0-beta.14",
    "kickassanime-v3": "4.2.0",
    "shahiid-v1": "2.1.2",
    "cimacub-v1": "1.2.0",
    "anime4up-site-v1": "1.0.0-beta.10",
}
CUSTOM = {"xstream-v1", "moviedb-wiki-v1"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def manifest(path):
    with ZipFile(path) as archive:
        choices = []
        for name in archive.namelist():
            if name.endswith(".json"):
                data = json.loads(archive.read(name))
                if isinstance(data, dict) and "id" in data and "moduleVersion" in data:
                    choices.append(data)
        assert len(choices) == 1, path
        return choices[0]


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


index = json.loads((ROOT / "repository.json").read_text())
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert index["repositoryId"] == catalogue["repositoryId"] == "module-testing-pl"
assert index["bundle"]["version"] == 135, "Already assembled or unexpected base"
with urlopen("https://raw.githubusercontent.com/kas021/Synthetiq-Modules/main/repository.json", timeout=30) as response:
    production = json.load(response)
prod = {entry["moduleId"]: entry for entry in production["modules"]}
now = int(time.time() * 1000)
updated = []

for module_id, version in EXPECTED.items():
    subdirectory = "modules" if module_id in CUSTOM else "production"
    matches = []
    for path in (CANDIDATES / subdirectory).glob("*.zip"):
        data = manifest(path)
        if data["id"] == module_id and data["moduleVersion"] == version:
            matches.append((path, data))
    assert len(matches) == 1, (module_id, matches)
    candidate, data = matches[0]
    package_hash = digest(candidate.read_bytes())
    if module_id not in CUSTOM:
        assert prod[module_id]["version"] == version
        assert prod[module_id]["sha256"] == package_hash
    else:
        assert data["config"]["catalogueMapping"]["version"] == 2
        assert data["config"]["sourceFallbacks"]
    for key in ("moduleFamilyId", "moduleIdentity", "moduleIdentityNumber"):
        assert data[key] == prod[module_id][key], (module_id, key)
    relative = "modules/" + candidate.name
    target = ROOT / relative
    assert not target.exists() or digest(target.read_bytes()) == package_hash
    shutil.copyfile(candidate, target)
    previous = next((entry for entry in index["modules"] if entry["moduleId"] == module_id), None)
    entry = dict(prod[module_id])
    if previous and "presentation" in previous:
        entry["presentation"] = previous["presentation"]
    entry.update(version=version, packageUrl=PREFIX + relative,
                 packagePath="/kas021/Module-Testing-PL/main/" + relative,
                 sha256=package_hash, publishedAtMs=now)
    if module_id in CUSTOM:
        entry.update(signature="", minAppVersion="9.0.55")
        entry["changelog"] = [
            f"{version}: TEST catch-up to production {prod[module_id]['version']} playback code, retaining V9 exact TV fallback mapping. Native playback reliability remains under testing."
        ] + prod[module_id].get("changelog", [])
    if previous:
        index["modules"][index["modules"].index(previous)] = entry
    else:
        index["modules"].append(entry)
    updated.append(relative)

# The import index is authoritative; the old authoring catalogue lagged at 134.
catalogue["modules"] = [
    {"file": "modules/" + Path(urlparse(entry["packageUrl"]).path).name,
     "presentation": entry.get("presentation", {}),
     "changelog": entry.get("changelog", [])}
    for entry in index["modules"]
]
assert len({entry["moduleId"] for entry in index["modules"]}) == len(index["modules"]) == 39
bundle_path = "bundles/Synthetiq-Module-Bundle-136.zip"
assert not (ROOT / bundle_path).exists(), "Never overwrite an old bundle"
with ZipFile(ROOT / bundle_path, "w", ZIP_DEFLATED) as archive:
    for entry, item in zip(index["modules"], catalogue["modules"]):
        package = ROOT / item["file"]
        assert digest(package.read_bytes()) == entry["sha256"], entry["moduleId"]
        data = manifest(package)
        assert data["id"] == entry["moduleId"] and data["moduleVersion"] == entry["version"]
        archive.write(package, package.name)
catalogue.update(bundleVersion=136, bundleFile=bundle_path, minAppVersion="9.0.55")
index["publishedAtMs"] = now
index["bundle"].update(version=136, minAppVersion="9.0.55",
                       packageUrl=PREFIX + bundle_path,
                       packagePath="/kas021/Module-Testing-PL/main/" + bundle_path,
                       sha256=digest((ROOT / bundle_path).read_bytes()), signature="")
index["testingIdentity"] = "|".join(
    f"{entry['moduleId']}:{entry['version']}:{entry['sha256']}" for entry in index["modules"])
write_json(ROOT / "catalogue.json", catalogue)
if "catalogueSha256" in index:
    index["catalogueSha256"] = digest((ROOT / "catalogue.json").read_bytes())
write_json(ROOT / "repository.json", index)
paths = [line.split(None, 1)[1].lstrip("*") for line in (ROOT / "SHA256SUMS").read_text().splitlines() if line.strip()]
for relative in updated + [bundle_path, "repository.json", "catalogue.json"]:
    if relative not in paths:
        paths.append(relative)
(ROOT / "SHA256SUMS").write_text("".join(
    f"{digest((ROOT / path).read_bytes())}  {path}\n" for path in paths))
print("Assembled TEST bundle 136: 39 modules; production unchanged")
