export function assertTestingCapacity(manifests) {
  const fixtures = manifests.filter(m => m.id === 'testing-123-v1' &&
    m.moduleIdentityNumber === 998 && m.qaFixture === 'intentional-playback-failure');
  const liveIds = new Map([['dw-live-v1', 77], ['tagesschau-live-v1', 78], ['tvapp-live-v1', 81]]);
  const live = manifests.filter(m => liveIds.get(m.id) === m.moduleIdentityNumber &&
    m.config?.capabilities?.live_discovery_v1 === true);
  if (fixtures.length > 1 || new Set(live.map(m => m.id)).size !== live.length || manifests.length - fixtures.length - live.length > 10) {
    throw new Error('Maximum ten testing candidates, one of each approved Live candidate and one intentional failure fixture');
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
