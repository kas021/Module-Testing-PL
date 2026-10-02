"""Assemble the metadata-only AniKoto/AniPM TEST checkpoint from bundle 132."""
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
assert index["bundle"]["version"] == catalogue["bundleVersion"] == 132
now = int(time.time() * 1000)
changes = [
    ("anipm-v1", "modules/AniPM-0.1.0-beta.5.zip"),
    ("anikoto-v4", "modules/Anikoto-5.0.5-beta.3.zip"),
]
note = "TEST ONLY: reciprocal AniKoto/AniPM exact episode mapping; playback JavaScript and saved source IDs unchanged. Requires Player 9.0.55+."
for module_id, relative in changes:
    with zipfile.ZipFile(ROOT / relative) as package:
        manifest = json.loads(package.read("module.json"))
    assert manifest["id"] == module_id
    assert manifest["config"]["catalogueMapping"]["version"] == 2
    existing = next(m for m in index["modules"] if m["moduleId"] == module_id)
    old_relative = existing["packageUrl"].removeprefix(PREFIX)
    descriptor = dict(existing)
    descriptor.update(
        version=manifest["moduleVersion"], minAppVersion="9.0.55",
        packageUrl=PREFIX + relative, packagePath=PATH_PREFIX + relative,
        sha256=digest(relative), signature="", publishedAtMs=now,
        changelog=[note] + existing.get("changelog", []),
    )
    index["modules"][index["modules"].index(existing)] = descriptor
    entry = next(m for m in catalogue["modules"] if m["file"] == old_relative)
    entry["file"] = relative
    entry["changelog"] = [note] + entry.get("changelog", [])

bundle = "bundles/Synthetiq-Module-Bundle-133.zip"
assert not (ROOT / bundle).exists(), "Do not overwrite a previous bundle"
with zipfile.ZipFile(ROOT / bundle, "w", zipfile.ZIP_DEFLATED) as archive:
    for entry in catalogue["modules"]:
        archive.write(ROOT / entry["file"], Path(entry["file"]).name)
catalogue.update(bundleVersion=133, bundleFile=bundle)
index["publishedAtMs"] = now
index["bundle"].update(
    version=133, packageUrl=PREFIX + bundle, packagePath=PATH_PREFIX + bundle,
    sha256=digest(bundle),
)
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
print(f"TEST bundle 133: {len(index['modules'])} modules; production untouched")
