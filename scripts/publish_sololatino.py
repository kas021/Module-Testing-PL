"""Publish the SoloLatino testing candidate (sololatino-v1 0.1.0-beta.5).

Only the TEST repository is touched: one new package, its index/catalogue entries,
a fresh bundle, SHA256SUMS lines, README + QA doc. Bundles roll FORWARD (136 -> 137).
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
    "sololatino-next/SoloLatino-0.1.0-beta.5.zip"
)
EXPECTED_SHA = "1b2a20095ab0a951c07979e908a475b003e7d9230f06ad42c51fe8c4d772158c"
ZIP_NAME = "SoloLatino-0.1.0-beta.5.zip"
RELATIVE = "modules/" + ZIP_NAME
ICON_URL = "https://sololatino.net/images/logo.png"
NEW_BUNDLE = 138
MIN_APP = "9.0.55"
PREFIX = "https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/"

CHANGELOG = [
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


# ---- 1. the certified package, byte-for-byte -------------------------------
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
    assert manifest and manifest["moduleVersion"] == "0.1.0-beta.5", "manifest mismatch"
target = ROOT / RELATIVE
if target.exists():
    assert digest(target.read_bytes()) == package_hash, "existing file differs"
else:
    shutil.copyfile(CERTIFIED, target)
print(f"package  {RELATIVE} {package_hash[:16]}…")

# ---- 2. catalogue entry + bundle pointer -----------------------------------
catalogue = json.loads((ROOT / "catalogue.json").read_text())
assert catalogue["bundleVersion"] == 137, "unexpected catalogue base"
if all(entry["file"] != RELATIVE for entry in catalogue["modules"]):
    catalogue["modules"].append(
        {"file": RELATIVE, "presentation": PRESENTATION, "changelog": CHANGELOG}
    )
catalogue["bundleVersion"] = NEW_BUNDLE
catalogue["bundleFile"] = f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
write_json(ROOT / "catalogue.json", catalogue)
print(f"catalogue {len(catalogue['modules'])} entries -> bundle {NEW_BUNDLE}")

# ---- 3. repository index ---------------------------------------------------
index = json.loads((ROOT / "repository.json").read_text())
assert index["bundle"]["version"] == 137, "unexpected index base"
assert all(entry["moduleId"] != "sololatino-v1" for entry in index["modules"])
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
index["testingIdentity"] = "|".join(
    f"{entry['moduleId']}:{entry['version']}:{entry['sha256']}"
    for entry in index["modules"]
)
index["publishedAtMs"] = now_ms
print(f"index     {len(index['modules'])} modules, testingIdentity rebuilt")

# ---- 4. bundle 137 (flat zip of the active packages) -----------------------
bundle_path = ROOT / f"bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"
assert not bundle_path.exists(), "bundle 138 already exists"
files = [entry["file"] for entry in catalogue["modules"]]
with ZipFile(bundle_path, "w", ZIP_DEFLATED) as bundle:
    for relative in files:
        source = ROOT / relative
        assert source.exists(), f"missing catalogue package {relative}"
        bundle.write(source, Path(relative).name)
with ZipFile(bundle_path) as bundle:
    assert set(bundle.namelist()) == {Path(f).name for f in files}, "bundle contents mismatch"
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
for line in (f"{package_hash}  {RELATIVE}", f"{bundle_hash}  bundles/Synthetiq-Module-Bundle-{NEW_BUNDLE}.zip"):
    assert line.split("  ", 1)[1] not in {l.split("  ", 1)[1] for l in sums.splitlines() if "  " in l}
    sums += line + "\n"
(ROOT / "SHA256SUMS").write_text(sums)
print("SHA256SUMS updated with the package and bundle lines")
