import { test } from 'node:test';
import assert from 'node:assert/strict';
import { v9CompatibilityErrors } from './v9_compatibility.mjs';

const fixture = () => ({
  bundle: { minAppVersion: '9.0.0' },
  modules: [{ moduleId: 'source', minAppVersion: '9.0.0' }],
});
const catalogue = { minAppVersion: '9.0.0' };

test('V9 baseline and pre-V9 compatible sources are admitted', () => {
  const index = fixture();
  index.modules.push({ moduleId: 'legacy', minAppVersion: '8.0.0' });
  assert.deepEqual(v9CompatibilityErrors(index, catalogue), []);
});
test('a patch-only bundle bump cannot block existing betas again', () => {
  const index = fixture();
  index.bundle.minAppVersion = '9.0.94';
  assert.equal(v9CompatibilityErrors(index, catalogue).length, 1);
});
test('catalogue authoring floor cannot drift', () => {
  assert.equal(v9CompatibilityErrors(fixture(), { minAppVersion: '9.0.94' }).length, 1);
});
for (const minimum of ['9.0.81', '9.1.0', '10.0.0', '', 'not-a-version', '9.0.0-beta.1']) {
  test(`publication rejects a source admission gate of ${JSON.stringify(minimum)}`, () => {
    const index = fixture();
    index.modules[0].minAppVersion = minimum;
    assert.equal(v9CompatibilityErrors(index, catalogue).length, 1);
  });
}
test('optional native provider capability declaration is not a source admission gate', () => {
  const index = fixture();
  index.subtitleProviders = [{ config: { minAppVersion: '9.0.74' } }];
  assert.deepEqual(v9CompatibilityErrors(index, catalogue), []);
});
