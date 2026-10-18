// The public TEST catalogue admits every V9 build. Feature availability is
// separate from package installation; never weaken integrity or schema checks.
export const v9ImportFloor = '9.0.0';

export function v9CompatibilityErrors(index, catalogue) {
  const errors = [];
  if (index.bundle?.minAppVersion !== v9ImportFloor ||
      catalogue.minAppVersion !== v9ImportFloor) {
    errors.push('TEST bundle and catalogue must admit all V9 builds (9.0.0).');
  }
  for (const entry of index.modules || []) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(entry.minAppVersion || '');
    if (!match || Number(match[1]) > 9 ||
        (Number(match[1]) === 9 && (Number(match[2]) !== 0 || Number(match[3]) !== 0))) {
      errors.push(`${entry.moduleId}: module import requirement excludes an existing V9 build.`);
    }
  }
  return errors;
}
