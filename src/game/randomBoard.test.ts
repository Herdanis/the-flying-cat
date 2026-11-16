import { describe, expect, test } from 'vitest';
import type { Trap } from './board';
import { makeBoard, violations, type Board } from './randomBoard';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);

function sources(board: Board): number[] {
  return [...board.rockets, ...board.holes].map(([from]) => from);
}

function boardOf(rockets: Trap[], holes: Trap[]): Board {
  const traps = new Map<number, number>();
  for (const [from, to] of [...rockets, ...holes]) traps.set(from, to);
  return { rockets, holes, resolve: (square) => traps.get(square) };
}

/** The seed-3 board with one trap swapped, so a single rule breaks. */
function swapped(kind: 'rockets' | 'holes', index: number, trap: Trap): Board {
  const board = makeBoard(3);
  const swap = (list: Trap[]): Trap[] => list.map((old, i) => (i === index ? trap : old));
  return boardOf(
    kind === 'rockets' ? swap(board.rockets) : board.rockets,
    kind === 'holes' ? swap(board.holes) : board.holes,
  );
}

function names(board: Board, rule: string): boolean {
  return violations(board).some((line) => line.startsWith(rule));
}

function inLeg(list: Trap[], leg: number): Trap[] {
  const lo = 11 + leg * 10;
  return list.filter(([from]) => from >= lo && from <= lo + 9);
}

describe('makeBoard', () => {
  test('every seed obeys every board rule', () => {
    for (const seed of SEEDS) expect(violations(makeBoard(seed))).toEqual([]);
  });

  test('gives nine rockets and nine holes for every seed', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      expect(board.rockets).toHaveLength(9);
      expect(board.holes).toHaveLength(9);
    }
  });

  test('keeps the start zone and the home stretch clean', () => {
    for (const seed of SEEDS) {
      for (const [from, to] of [...makeBoard(seed).rockets, ...makeBoard(seed).holes]) {
        expect(from).toBeGreaterThanOrEqual(11);
        expect(from).toBeLessThanOrEqual(90);
        expect(to).toBeGreaterThanOrEqual(11);
      }
    }
  });

  test('puts two or three traps on every leg, always both kinds', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      for (let leg = 0; leg < 8; leg++) {
        const rockets = inLeg(board.rockets, leg).length;
        const holes = inLeg(board.holes, leg).length;
        expect(rockets).toBeGreaterThanOrEqual(1);
        expect(holes).toBeGreaterThanOrEqual(1);
        expect(rockets + holes).toBeLessThanOrEqual(3);
      }
    }
  });

  test('lifts at least as far as it drags back', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const lift = board.rockets.reduce((sum, [from, to]) => sum + (to - from), 0);
      const drag = board.holes.reduce((sum, [from, to]) => sum + (from - to), 0);
      expect(lift).toBeGreaterThanOrEqual(drag);
    }
  });

  test('keeps its old limits: hops 6-20, no touching sources, no trap into a trap', () => {
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

      const all = sources(board).sort((a, b) => a - b);
      for (let i = 1; i < all.length; i++) expect(all[i] - all[i - 1]).toBeGreaterThan(1);

      const froms = new Set(all);
      const tos = [...board.rockets, ...board.holes].map(([, to]) => to);
      expect(new Set(tos).size).toBe(tos.length);
      for (const to of tos) expect(froms.has(to)).toBe(false);
      for (const [from, to] of [...board.rockets, ...board.holes]) {
        expect(board.resolve(from)).toBe(to);
      }
    }
  });

  test('violations names the start zone rule', () => {
    expect(names(swapped('rockets', 0, [5, 25]), 'start zone')).toBe(true);
    expect(names(swapped('holes', 0, [40, 8]), 'start zone')).toBe(true);
  });

  test('violations names the home stretch rule', () => {
    expect(names(swapped('rockets', 0, [95, 100]), 'home stretch')).toBe(true);
  });

  test('violations names a leg that lost its traps or one of its kinds', () => {
    const kept = (list: Trap[], add: Trap[] = []): Trap[] =>
      [...inLeg(list, 0), ...add, ...list.filter(([from]) => from < 21 || from > 30)];

    const board = makeBoard(3);
    expect(names(boardOf(kept(board.rockets), kept(board.holes)), 'leg 21-30: 0 traps')).toBe(true);
    expect(names(boardOf(kept(board.rockets, [[25, 45]]), kept(board.holes)), 'leg 21-30: no hole')).toBe(
      true,
    );
  });

  test('violations names the forward bias rule', () => {
    const board = makeBoard(3);
    // Rockets take their shortest hop; holes drag as far as their square allows.
    const rockets = board.rockets.map(([from]) => [from, from + 6] as Trap);
    const holes = board.holes.map(([from]) => [from, Math.max(11, from - 20)] as Trap);
    expect(names(boardOf(rockets, holes), 'forward bias')).toBe(true);
  });

  test('violations names the old limits', () => {
    expect(names(swapped('rockets', 0, [20, 36]), 'sources touch')).toBe(true);
    expect(names(swapped('rockets', 0, [19, 41]), 'hop out of range')).toBe(true);
    expect(names(swapped('holes', 0, [17, 21]), 'lands on a source')).toBe(true);
    expect(names(swapped('rockets', 1, [19, 36]), 'a source is reused')).toBe(true);
    expect(names(swapped('holes', 1, [30, 11]), 'a landing is reused')).toBe(true);
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
