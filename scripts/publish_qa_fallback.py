"""Mechanically assemble the isolated AniPM fallback TEST bundle."""
import hashlib
import json
from pathlib import Path
import time
import zipfile

ROOT = Path(__file__).resolve().parent.parent
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"
PATH_PREFIX = "/kas021/Module-Testing-PL/main/"


def digest(relative):
    return hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()


def write_json(relative, value):
    (ROOT / relative).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


index = json.loads((ROOT / "repository.json").read_text())
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert index["repositoryId"] == catalogue["repositoryId"] == "module-testing-pl"
assert index["bundle"]["version"] == catalogue["bundleVersion"] == 131
now = int(time.time() * 1000)
changes = [
    ("anipm-v1", "modules/AniPM-0.1.0-beta.4.zip", "Metadata-only TEST update: exact catalogue mapping for the QA fallback fixture; playback JavaScript unchanged."),
    ("qa-fallback-anipm-v1", "modules/Fallback-Test-AniPM-1.0.0-beta.1.zip", "TEST ONLY: intentionally fails every stream request to exercise fallback into real AniPM. Adopt its fallback group before testing."),
]
for module_id, relative, note in changes:
    with zipfile.ZipFile(ROOT / relative) as package:
        manifest = json.loads(package.read("module.json"))
    assert manifest["id"] == module_id
    existing = next((m for m in index["modules"] if m["moduleId"] == module_id), None)
    old_relative = existing["packageUrl"].removeprefix(PREFIX) if existing else None
    presentation = dict(existing["presentation"] if existing else manifest["presentation"])
    presentation["recommended"] = False if module_id.startswith("qa-") else presentation.get("recommended", False)
    descriptor = dict(existing or {})
    descriptor.update({
        "moduleId": module_id, "moduleFamilyId": manifest["moduleFamilyId"],
        "moduleIdentity": manifest["moduleIdentity"],
        "moduleIdentityNumber": manifest["moduleIdentityNumber"],
        "contentType": "video", "version": manifest["moduleVersion"],
        "minAppVersion": "9.0.53", "packageUrl": PREFIX + relative,
        "packagePath": PATH_PREFIX + relative, "sha256": digest(relative),
        "signature": "", "publishedAtMs": now, "presentation": presentation,
        "changelog": [note] + (existing.get("changelog", []) if existing else []),
    })
    if existing:
        index["modules"][index["modules"].index(existing)] = descriptor
        entry = next(m for m in catalogue["modules"] if m["file"] == old_relative)
        entry["file"] = relative
        entry["changelog"] = [note] + entry.get("changelog", [])
    else:
        index["modules"].append(descriptor)
        catalogue["modules"].append({"file": relative, "presentation": presentation, "changelog": [note]})

bundle = "bundles/Synthetiq-Module-Bundle-132.zip"
with zipfile.ZipFile(ROOT / bundle, "w", zipfile.ZIP_DEFLATED) as archive:
    for entry in catalogue["modules"]:
        archive.write(ROOT / entry["file"], Path(entry["file"]).name)
catalogue.update(bundleVersion=132, bundleFile=bundle)
index["publishedAtMs"] = now
index["bundle"].update(version=132, packageUrl=PREFIX + bundle, packagePath=PATH_PREFIX + bundle, sha256=digest(bundle))
write_json("catalogue.json", catalogue)
if "catalogueSha256" in index:
    index["catalogueSha256"] = digest("catalogue.json")
if isinstance(index.get("catalogue"), dict) and "sha256" in index["catalogue"]:
    index["catalogue"]["sha256"] = digest("catalogue.json")
write_json("repository.json", index)
paths = [line.split(None, 1)[1].lstrip("*") for line in (ROOT / "SHA256SUMS").read_text().splitlines() if line.strip()]
for relative in [bundle] + [change[1] for change in changes]:
    if relative not in paths:
        paths.append(relative)
(ROOT / "SHA256SUMS").write_text("".join(f"{digest(relative)}  {relative}\n" for relative in paths))
print(f"TEST bundle 132: {len(index['modules'])} modules; production untouched")
