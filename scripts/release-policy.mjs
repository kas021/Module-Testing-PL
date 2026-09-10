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
