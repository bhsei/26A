// Seeded pseudo-random numbers, so the same seed always produces the same
// data, including IDs. Not for security: passwords use node:crypto instead.

export interface Random {
  // Float in [0, 1).
  next(): number;
  // Integer in [min, max], both inclusive.
  int(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  // `count` distinct items, in random order.
  sample<T>(items: readonly T[], count: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  // Picks a key with probability proportional to its weight.
  weighted<K extends string>(weights: Record<K, number>): K;
  // Random version-4 UUID built from this generator.
  uuid(): string;
}

// mulberry32: small, fast and good enough for test data.
export function createRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  const shuffle = <T>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty list");
    }
    return items[int(0, items.length - 1)] as T;
  };

  return {
    next,
    int,
    chance: (probability) => next() < probability,
    pick,
    shuffle,
    sample: (items, count) => shuffle(items).slice(0, Math.min(count, items.length)),
    weighted: (weights) => {
      const entries = Object.entries(weights) as [keyof typeof weights, number][];
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = next() * total;
      for (const [key, weight] of entries) {
        roll -= weight;
        if (roll < 0) {
          return key;
        }
      }
      return entries[entries.length - 1]![0];
    },
    uuid: () => {
      const bytes = Array.from({ length: 16 }, () => int(0, 255));
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
  };
}
