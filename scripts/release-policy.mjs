export function assertTestingCapacity(manifests) {
  const fixtures = manifests.filter(m => m.id === 'testing-123-v1' &&
    m.moduleIdentityNumber === 998 && m.qaFixture === 'intentional-playback-failure');
  const live = manifests.filter(m => m.id === 'dw-live-v1' &&
    m.moduleIdentityNumber === 77 && m.config?.capabilities?.live_discovery_v1 === true);
  if (fixtures.length > 1 || live.length > 1 || manifests.length - fixtures.length - live.length > 3) {
    throw new Error('Maximum three testing candidates, one DW Live candidate and one intentional failure fixture');
  }
}

export function supersedesCandidate(published, candidate) {
  if (published === candidate) return true;
  const stable = /^(\d+)\.(\d+)\.(\d+)$/.exec(published || '');
  const beta = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(candidate || '');
  if (!stable || !beta) return false;
  for (let i = 1; i <= 3; i++) {
    const delta = Number(stable[i]) - Number(beta[i]);
    if (delta !== 0) return delta > 0;
  }
  return true;
}
