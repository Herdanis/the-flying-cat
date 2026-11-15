import { describe, expect, test } from 'vitest';
import { BLACK_HOLES, LAST_SQUARE, LEGS, ROCKETS, legName, resolve } from './board';

describe('board fixture', () => {
  test('has ten legs covering the journey', () => {
    expect(LEGS).toHaveLength(10);
    expect(legName(1)).toBe('Earth');
    expect(legName(100)).toBe('Star');
  });

  test('rockets go up and black holes go down', () => {
    for (const [from, to] of ROCKETS) {
      expect(to).toBeGreaterThan(from);
      expect(resolve(from)).toBe(to);
    }
    for (const [from, to] of BLACK_HOLES) {
      expect(to).toBeLessThan(from);
      expect(resolve(from)).toBe(to);
    }
  });

  test('no square is both a rocket and a black hole', () => {
    const rocketFroms = new Set(ROCKETS.map(([f]) => f));
    for (const [from] of BLACK_HOLES) expect(rocketFroms.has(from)).toBe(false);
  });

  test('no trap sits immediately after another trap', () => {
    for (const [from] of [...ROCKETS, ...BLACK_HOLES]) {
      expect(resolve(from - 1)).toBeUndefined();
    }
  });

  test('no trap on the start or the star', () => {
    expect(resolve(1)).toBeUndefined();
    expect(resolve(LAST_SQUARE)).toBeUndefined();
  });
});
