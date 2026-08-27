export function smoothLevel(next: number, previous: number) {
  return previous * 0.78 + next * 0.22;
}

export function createPulseLevel(seed: number, now = performance.now()) {
  const wave = (Math.sin(now / 140 + seed) + 1) / 2;
  return 0.2 + wave * 0.8;
}

