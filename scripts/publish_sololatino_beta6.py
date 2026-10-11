"""Correct the SoloLatino testing candidate: identity 61 -> 67, package beta.5 -> beta.6.

Why: animeunity-v1 already owns SP-VID-061 in both the testing and production indexes, so the
published index carried a duplicate identity number and the app rejected the WHOLE testing
repository ("Repository contains duplicate module identity numbers"). beta.5 is withdrawn from
the index/catalogue/bundle (its file stays for rollback); nothing else changes.
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
    "sololatino-next/SoloLatino-0.1.0-beta.6.zip"
)
EXPECTED_SHA = "8173cadef04d35710009ec663f449b290cc4645fd0063941d85a3c93f1c45893"
NEW_ZIP = "SoloLatino-0.1.0-beta.6.zip"
OLD_ZIP = "SoloLatino-0.1.0-beta.5.zip"
RELATIVE = "modules/" + NEW_ZIP
ICON_URL = "https://sololatino.net/images/logo.png"
NEW_BUNDLE = 139
MIN_APP = "9.0.55"
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

CHANGELOG = [
    "0.1.0-beta.6 - testing identity corrected to SP-VID-067-SOLOLATINO: the previous 0.1.0-beta.5 package reused identity number 61 (owned by AnimeUnity), which made the app reject the whole TEST repository with \"duplicate module identity numbers\". The package itself is unchanged.",
    "0.1.0-beta.5 - new TEST source: SoloLatino (sololatino.net), Spanish-Latino movies, series and anime.",
    "Search runs on the site's own JSON API; every season's episodes come from the series pages.",
    "Playback decodes the site's embedded player module-side (client-side proof-of-work + AES-decrypted server links) and resolves Vidhide-family servers with real quality labels (e.g. 720p).",
    "Verified: house tester PASS, release gate ALL_PASSED (segments byte-verified on first attempt), both app runtimes (8.5.33 + V9) ALL PASS, S2 quick PASS with Spanish audio confirmed.",
    "Known limits: the site's PREMIUM player host is dead server-side and unused; Streamwish/Voe mirrors are not resolved yet; Spanish audio only; the source serves no caption tracks.",
]

PRESENTATION = {
    "category": "Movies & TV",
    "purpose": "Spanish-Latino movies, series and anime",
    "recommended": False,
    "language": "Español Latino",
    "languages": ["dub"],
    "iconUrl": ICON_URL,
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


# ---- 1. the corrected certified package ------------------------------------
package_bytes = CERTIFIED.read_bytes()
package_hash = digest(package_bytes)
assert package_hash == EXPECTED_SHA, f"certified hash mismatch: {package_hash}"
with ZipFile(CERTIFIED) as archive:
    manifest = None
    for name in archive.namelist():
        if name.endswith(".json"):
            data = json.loads(archive.read(name))
            if isinstance(data, dict) and data.get("id") == "sololatino-v1":
                manifest = data
    assert manifest, "manifest missing"
    assert manifest["moduleVersion"] == "0.1.0-beta.6", manifest["moduleVersion"]
    assert manifest["moduleIdentity"] == "SP-VID-067-SOLOLATINO", manifest["moduleIdentity"]
    assert manifest["moduleIdentityNumber"] == 67
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}…")

# ---- 2. catalogue: replace the beta.5 entry, roll the bundle forward -------
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 138, "unexpected catalogue base"
old = [e for e in catalogue["modules"] if e["file"] == "modules/" + OLD_ZIP]
assert len(old) == 1, "beta.5 catalogue entry not found"
old[0]["file"] = RELATIVE
old[0]["changelog"] = CHANGELOG
assert all(e["file"] != "modules/" + OLD_ZIP for e in catalogue["modules"])
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

# ---- 3. index: drop the duplicate-identity entry, add the corrected one ----
index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 138, "unexpected index base"
before = len(index["modules"])
index["modules"] = [m for m in index["modules"] if m["moduleId"] != "sololatino-v1"]
assert len(index["modules"]) == before - 1, "old sololatino entry not found"
now_ms = int(time.time() * 1000)
index["modules"].append(
    {
        "moduleId": manifest["id"],
        "moduleFamilyId": manifest["moduleFamilyId"],
        "moduleIdentity": manifest["moduleIdentity"],
        "moduleIdentityNumber": manifest["moduleIdentityNumber"],
        "contentType": manifest["contentType"],
        "version": manifest["moduleVersion"],
        "minAppVersion": MIN_APP,
        "packageUrl": PREFIX + RELATIVE,
        "packagePath": "/kas021/Module-Testing-PL/main/" + RELATIVE,
        "sha256": package_hash,
        "signature": "",
        "publishedAtMs": now_ms,
        "changelog": CHANGELOG,
        "presentation": PRESENTATION,
    }
)
# no duplicate identity numbers anywhere in the index (the app's own rule)
seen = {}
for entry in index["modules"]:
    num = entry["moduleIdentityNumber"]
    assert num not in seen, f"duplicate identity number {num}: {seen[num]} vs {entry['moduleId']}"
    seen[num] = entry["moduleId"]
index["testingIdentity"] = "|".join(
    f"{m['moduleId']}:{m['version']}:{m['sha256']}" for m in index["modules"]
)
index["publishedAtMs"] = now_ms
print(f"index     {len(index['modules'])} modules, unique identity numbers verified")

# ---- 4. bundle 139 ---------------------------------------------------------
bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), "bundle 139 already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    assert set(bundle.namelist()) == {Path(f).name for f in files}, "bundle contents mismatch"
    assert OLD_ZIP not in bundle.namelist(), "beta.5 must not travel in the new bundle"
    assert NEW_ZIP in bundle.namelist(), "beta.6 missing from the bundle"
bundle_hash = digest(bundle_path.read_bytes())
index["bundle"] = {
    "version": NEW_BUNDLE,
    "minAppVersion": MIN_APP,
    "packageUrl": PREFIX + f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "packagePath": f"/kas021/Module-Testing-PL/main/bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip",
    "sha256": bundle_hash,
    "signature": "",
}
write_json(ROOT / "repository.json", index)
print(f"bundle    {bundle_path.name} {bundle_hash[:16]}… ({len(files)} packages)")

# ---- 5. SHA256SUMS ---------------------------------------------------------
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
(ROOT / "SHA256SUMS").write_text(sums)
print("SHA256SUMS updated")
