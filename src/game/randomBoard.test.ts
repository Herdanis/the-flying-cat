import { describe, expect, test } from 'vitest';
import type { Trap } from './board';
import { makeBoard, violations, type Board } from './randomBoard';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const SAMPLE = makeBoard(3);

function sources(board: Board): number[] {
  return [...board.rockets, ...board.holes].map(([from]) => from);
}

function boardOf(rockets: Trap[], holes: Trap[]): Board {
  const traps = new Map<number, number>();
  for (const [from, to] of [...rockets, ...holes]) traps.set(from, to);
  return { rockets, holes, resolve: (square) => traps.get(square) };
}

function replace(list: Trap[], index: number, trap: Trap): Trap[] {
  return list.map((old, i) => (i === index ? trap : old));
}

/** The seed-3 board with one trap swapped, so a single rule breaks. */
function swapped(board: Board, kind: 'rockets' | 'holes', index: number, trap: Trap): Board {
  return boardOf(
    kind === 'rockets' ? replace(board.rockets, index, trap) : board.rockets,
    kind === 'holes' ? replace(board.holes, index, trap) : board.holes,
  );
}

function names(board: Board, rule: string): boolean {
  return violations(board).some((line) => line.startsWith(rule));
}

function onLeg(square: number, lo: number): boolean {
  return square >= lo && square <= lo + 9;
}

function rocketIndex(from: number, to?: number): number {
  return SAMPLE.rockets.findIndex(([f, t]) => f === from && (to === undefined || t === to));
}

function holeIndex(from: number): number {
  return SAMPLE.holes.findIndex(([f]) => f === from);
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

  test('Earth holds one rocket, starting on 2 to 10, and nothing lands on 1-10', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const earth = board.rockets.filter(([from]) => from <= 10);
      expect(earth).toHaveLength(1);
      expect(earth[0][0]).toBeGreaterThanOrEqual(2);
      expect(board.holes.filter(([from]) => from <= 10)).toEqual([]);
      for (const [, to] of [...board.rockets, ...board.holes]) expect(to).toBeGreaterThanOrEqual(11);
    }
  });

  test('the Belt and Neptune trade exactly one trap each way', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const out = board.rockets.filter(([from, to]) => onLeg(from, 31) && onLeg(to, 71));
      const back = board.holes.filter(([from, to]) => onLeg(from, 71) && onLeg(to, 31));
      expect(out).toHaveLength(1);
      expect(back).toHaveLength(1);
    }
  });

  test('the rocket out of the Belt starts above where the Neptune hole drops you', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const [rocket] = board.rockets.find(([from, to]) => onLeg(from, 31) && onLeg(to, 71))!;
      const [, landing] = board.holes.find(([from, to]) => onLeg(from, 71) && onLeg(to, 31))!;
      expect(rocket).toBeGreaterThan(landing);
    }
  });

  test('two rockets never touch, and neither do two holes', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      for (const kind of [board.rockets, board.holes]) {
        const starts = kind.map(([from]) => from).sort((a, b) => a - b);
        for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThan(1);
      }
    }
  });

  test('keeps the rest: short hops, unique ends, no trap into a trap', () => {
    for (const seed of SEEDS) {
      const board = makeBoard(seed);
      const all = [...board.rockets, ...board.holes];

      for (const [from, to] of all) {
        const hop = Math.abs(to - from);
        const pair =
          (onLeg(from, 31) && onLeg(to, 71)) || (onLeg(from, 71) && onLeg(to, 31));
        expect(hop).toBeGreaterThanOrEqual(6);
        expect(hop).toBeLessThanOrEqual(pair ? 49 : 20);
        expect(from).toBeLessThanOrEqual(90);
      }

      const froms = new Set(sources(board));
      const tos = all.map(([, to]) => to);
      expect(froms.size).toBe(all.length);
      expect(new Set(tos).size).toBe(tos.length);
      for (const to of tos) expect(froms.has(to)).toBe(false);
      for (const [from, to] of all) expect(board.resolve(from)).toBe(to);
    }
  });

  test('violations names the earth and start rules', () => {
    expect(names(swapped(SAMPLE, 'rockets', rocketIndex(4), [4, 18]), 'earth: ')).toBe(false);
    const noEarth = boardOf(
      SAMPLE.rockets.filter(([from]) => from > 10),
      [...SAMPLE.holes, [5, 25] as Trap],
    );
    expect(names(noEarth, 'earth: 0 rockets')).toBe(true);
    expect(names(noEarth, 'earth: 1 holes')).toBe(true);
    expect(names(swapped(SAMPLE, 'holes', holeIndex(32), [32, 5]), 'start: lands on 5')).toBe(true);
  });

  test('violations names the belt pair rule', () => {
    const cut = SAMPLE.rockets.findIndex(([from, to]) => onLeg(from, 31) && onLeg(to, 71));
    expect(names(swapped(SAMPLE, 'rockets', cut, [40, 60]), 'belt pair: 0 rockets out')).toBe(true);
    const holesCut = SAMPLE.holes.findIndex(([from, to]) => onLeg(from, 71) && onLeg(to, 31));
    expect(names(swapped(SAMPLE, 'holes', holesCut, [79, 60]), 'belt pair: 0 holes back')).toBe(true);
  });

  test('violations names a long hop outside the pair', () => {
    expect(names(swapped(SAMPLE, 'rockets', rocketIndex(17), [17, 50]), 'long hop: 17 -> 50')).toBe(
      true,
    );
  });

  test('violations names the belt sequence rule', () => {
    const rocket = SAMPLE.rockets.find(([from, to]) => onLeg(from, 31) && onLeg(to, 71))!;
    const landing = SAMPLE.holes.find(([from, to]) => onLeg(from, 71) && onLeg(to, 31))![1];
    expect(names(swapped(SAMPLE, 'rockets', rocketIndex(rocket[0]), [landing, rocket[1]]), 'sequence:')).toBe(
      true,
    );
  });

  test('violations names the adjacency rules', () => {
    expect(names(swapped(SAMPLE, 'rockets', rocketIndex(51), [43, 63]), 'adjacent rockets: 42, 43')).toBe(
      true,
    );
    expect(names(swapped(SAMPLE, 'holes', holeIndex(57), [56, 46]), 'adjacent holes: 55, 56')).toBe(true);
  });

  test('violations names a leg that lost its traps or one of its kinds', () => {
    const noHoles = SAMPLE.holes.filter(([from]) => !onLeg(from, 51));
    const noRockets = SAMPLE.rockets.filter(([from]) => !onLeg(from, 51));
    expect(names(boardOf(SAMPLE.rockets, noHoles), 'Jupiter: no hole')).toBe(true);
    expect(names(boardOf(noRockets, noHoles), 'Jupiter: 0 traps')).toBe(true);
  });

  test('violations names the forward bias rule', () => {
    const rockets = SAMPLE.rockets.map(([from]) => [from, from + 6] as Trap);
    const holes = SAMPLE.holes.map(([from]) => [from, Math.max(11, from - 12)] as Trap);
    expect(names(boardOf(rockets, holes), 'forward bias')).toBe(true);
  });

  test('a seed decides the board, and neighbours differ', () => {
    expect(makeBoard(7).rockets).toEqual(makeBoard(7).rockets);
    expect(makeBoard(7).holes).toEqual(makeBoard(7).holes);
    for (let seed = 1; seed < 500; seed++) {
      expect(makeBoard(seed).rockets).not.toEqual(makeBoard(seed + 1).rockets);
    }
  });

  test('plain squares resolve to nothing', () => {
    const froms = new Set(sources(SAMPLE));
    for (let square = 1; square <= 100; square++) {
      if (!froms.has(square)) expect(SAMPLE.resolve(square)).toBeUndefined();
    }
  });
});
