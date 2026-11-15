import { describe, expect, test } from 'vitest';
import { makeBoard, type Board } from './randomBoard';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);

function sources(board: Board): number[] {
  return [...board.rockets, ...board.holes].map(([from]) => from);
}

describe('makeBoard', () => {
  test('gives nine rockets and nine holes for every seed', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      expect(board.rockets).toHaveLength(9);
      expect(board.holes).toHaveLength(9);
    }
  });

  test('keeps every source off the start and the star, none reused', () => {
    for (const seed of SEEDS) {
      const all = sources(makeBoard(seed));
      expect(new Set(all).size).toBe(all.length);
      for (const from of all) {
        expect(from).toBeGreaterThanOrEqual(2);
        expect(from).toBeLessThanOrEqual(99);
      }
    }
  });

  test('never puts two sources next to each other', () => {
    for (const seed of SEEDS) {
      const all = sources(makeBoard(seed)).sort((a, b) => a - b);
      for (let i = 1; i < all.length; i++) {
        expect(all[i] - all[i - 1]).toBeGreaterThan(1);
      }
    }
  });

  test('rockets climb and holes drop between six and twenty', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      for (const [from, to] of board.rockets) {
        expect(to).toBeGreaterThan(from + 5);
        expect(to).toBeLessThanOrEqual(from + 20);
      }
      for (const [from, to] of board.holes) {
        expect(to).toBeLessThan(from - 5);
        expect(to).toBeGreaterThanOrEqual(from - 20);
      }
    }
  });

  test('no trap ends on another trap source or another landing', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const all = [...board.rockets, ...board.holes];
      const froms = new Set(all.map(([from]) => from));
      const tos = all.map(([, to]) => to);
      expect(new Set(tos).size).toBe(tos.length);
      for (const to of tos) expect(froms.has(to)).toBe(false);
      for (const [from, to] of all) expect(board.resolve(from)).toBe(to);
    }
  });

  test('a seed decides the board, and neighbours differ', () => {
    expect(makeBoard(7).rockets).toEqual(makeBoard(7).rockets);
    expect(makeBoard(7).holes).toEqual(makeBoard(7).holes);
    for (let seed = 1; seed < 500; seed++) {
      expect(makeBoard(seed).rockets).not.toEqual(makeBoard(seed + 1).rockets);
    }
  });

  test('plain squares resolve to nothing', () => {
    const board = makeBoard(3);
    const froms = new Set(sources(board));
    for (let square = 1; square <= 100; square++) {
      if (!froms.has(square)) expect(board.resolve(square)).toBeUndefined();
    }
  });
});
