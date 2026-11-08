"""Mirror the pinned official anime releases, retaining TEST-only manifest metadata."""
import copy
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OFFICIAL = Path('/Users/khubaibshakh/Desktop/Synthetiq-Modules')
REVISION = 'e4d5cea'
PREFIX = 'https://raw.githubusercontent.com/kas021/Module-Testing-PL/main/'
EXPECTED = {
    'synthetiq-anime-v1', 'synthetiq-anime-direct', 'anipm-v1', 'anikoto-v4',
    'animeav1-v1', 'animeunity-v1', 'shahiid-v1',
}
IDENTITY = ['id', 'moduleFamilyId', 'moduleIdentity', 'moduleIdentityNumber', 'contentType']


def digest(data):
    return hashlib.sha256(data).hexdigest()


def blob(relative):
    return subprocess.check_output(['git', 'show', f'{REVISION}:{relative}'], cwd=OFFICIAL)


def save_json(relative, value):
    (ROOT / relative).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def manifest(package, module_id):
    with ZipFile(io.BytesIO(package)) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate ZIP entry'
        assert all(not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts
                   and '\\' not in n for n in names), 'Unsafe ZIP path'
        matches = []
        for name in names:
            if name.endswith('.json'):
                value = json.loads(archive.read(name))
                if isinstance(value, dict) and value.get('id') == module_id:
                    matches.append((name, value))
        assert len(matches) == 1, f'Manifest ambiguity: {module_id}'
        return matches[0]


def refresh_sums():
    sums = {}
    for line in (ROOT / 'SHA256SUMS').read_text().splitlines():
        value, name = line.split('  ', 1)
        assert name not in sums
        sums[name] = value
    for name in changed_paths | {'repository.json', 'catalogue.json', 'subtitle-provider.json'}:
        sums[name] = digest((ROOT / name).read_bytes())
    (ROOT / 'SHA256SUMS').write_text(''.join(f'{value}  {name}\n' for name, value in sums.items()))


index = json.loads((ROOT / 'repository.json').read_text())
catalogue = json.loads((ROOT / 'catalogue.json').read_text())
original = copy.deepcopy(index)
official = json.loads(blob('repository.json'))
assert index['repositoryId'] == 'module-testing-pl'
assert index['bundle']['version'] == catalogue['bundleVersion'] == 153
assert official['bundle']['version'] == 159
assert len(index['modules']) == 45
updates = []
changed_paths = set()
for published in official['modules']:
    if published.get('presentation', {}).get('category') != 'Anime':
        continue
    target = next((m for m in index['modules'] if m['moduleId'] == published['moduleId']), None)
    if target is None or target['sha256'] == published['sha256']:
        continue
    module_id = target['moduleId']
    assert module_id in EXPECTED, f'Unexpected candidate {module_id}'
    assert published['version'] != target['version'], f'Same-version drift: {module_id}'
    source_path = 'modules/' + published['packageUrl'].rsplit('/', 1)[1]
    package = blob(source_path)
    assert digest(package) == published['sha256'], f'Official checksum: {module_id}'
    old_path = 'modules/' + target['packageUrl'].rsplit('/', 1)[1]
    old_bytes = (ROOT / old_path).read_bytes()
    assert digest(old_bytes) == target['sha256']
    name, updated = manifest(package, module_id)
    _, previous = manifest(old_bytes, module_id)
    assert all(updated.get(k) == previous.get(k) for k in IDENTITY), f'Identity drift: {module_id}'
    assert updated['moduleVersion'] == published['version']
    retained = []
    for field in ['catalogueMapping', 'sourceFallbacks']:
        value = previous.get('config', {}).get(field)
        if value is not None:
            assert field not in updated['config'] or updated['config'][field] == value
            updated['config'][field] = copy.deepcopy(value)
            retained.append(field)
    delivered = package
    if retained:
        output = io.BytesIO()
        with ZipFile(io.BytesIO(package)) as source, ZipFile(output, 'w', ZIP_DEFLATED) as archive:
            for info in source.infolist():
                data = source.read(info.filename)
                if info.filename == name:
                    data = (json.dumps(updated, indent=2, ensure_ascii=False) + '\n').encode()
                archive.writestr(info, data)
        delivered = output.getvalue()
    # Only the named manifest may differ from the published archive.
    with ZipFile(io.BytesIO(package)) as source, ZipFile(io.BytesIO(delivered)) as target_zip:
        assert source.namelist() == target_zip.namelist()
        for member in source.namelist():
            if member != name:
                assert source.read(member) == target_zip.read(member), f'Runtime changed: {module_id}'
    path = ROOT / source_path
    assert not path.exists(), f'Would overwrite existing immutable release: {path}'
    path.write_bytes(delivered)
    changed_paths.add(source_path)
    entry = next(e for e in catalogue['modules'] if e['file'] == old_path)
    entry['file'] = source_path
    old_changes = entry.get('changelog', [])
    entry['changelog'] = list(dict.fromkeys(published.get('changelog', []) + old_changes))
    old_version = target['version']
    target.update(version=published['version'], sha256=digest(delivered),
                  packageUrl=PREFIX + source_path,
                  packagePath='/kas021/Module-Testing-PL/main/' + source_path,
                  signature='', publishedAtMs=published['publishedAtMs'],
                  changelog=entry['changelog'])
    updates.append(dict(moduleId=module_id, previousVersion=old_version,
                        version=published['version'], officialSha256=published['sha256'],
                        testSha256=target['sha256'], retainedMetadata=retained))

assert {u['moduleId'] for u in updates} == EXPECTED
for before in original['modules']:
    if before['moduleId'] not in EXPECTED:
        assert before == next(m for m in index['modules'] if m['moduleId'] == before['moduleId'])
assert index['artworkModules'] == original['artworkModules']
assert index['subtitleProviders'] == original['subtitleProviders']
bundle_path = 'bundles/Synthetiq-Module-Bundle-154.zip'
assert not (ROOT / bundle_path).exists()
catalogue.update(bundleVersion=154, bundleFile=bundle_path)
index['publishedAtMs'] = max(int(time.time() * 1000), original['publishedAtMs'] + 1)
index['testingIdentity'] = '|'.join(f"{m['moduleId']}:{m['version']}:{m['sha256']}" for m in index['modules'])
index['bundle'].update(version=154, packageUrl=PREFIX + bundle_path,
                       packagePath='/kas021/Module-Testing-PL/main/' + bundle_path, signature='')
changed_paths.add(bundle_path)


def bundle(provider=None):
    with ZipFile(ROOT / bundle_path, 'w', ZIP_DEFLATED) as archive:
        for entry in catalogue['modules']:
            archive.write(ROOT / entry['file'], Path(entry['file']).name)
        if provider is not None:
            archive.writestr('synthetiq-subtitles.provider.json', provider)
    index['bundle']['sha256'] = digest((ROOT / bundle_path).read_bytes())
    save_json('repository.json', index)


save_json('catalogue.json', catalogue)
bundle()
refresh_sums()
subprocess.run(['node', 'scripts/sign_repository.mjs', '--community', '--write'], cwd=ROOT, check=True)
# The provider signature binds publication/config, not the bundle hash. Include
# that exact signed envelope, then update only the unsigned community bundle hash.
index = json.loads((ROOT / 'repository.json').read_text())
bundle((ROOT / 'subtitle-provider.json').read_bytes())
refresh_sums()
save_json('docs/ANIME_SYNC_20261108.json', dict(
    officialCommit=subprocess.check_output(['git', 'rev-parse', REVISION], cwd=OFFICIAL, text=True).strip(),
    testBase='1c36f1f', bundle=154, modules=updates,
    verification='Byte-identical published runtime files; TEST fallback manifests retained. Not fresh playback certification.',
))
print(json.dumps({'bundle': 154, 'updatedModules': len(updates), 'totalModules': len(index['modules'])}))
