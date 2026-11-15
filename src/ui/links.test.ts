import { expect, test } from 'vitest';
import { makeBoard } from '../game/randomBoard';
import { MARK, markSize, trapPairs, type MarkSize } from './board';
import { linkPath, ribbonPath, squareCentre } from './links';

const CELL = 48;
const GAP = 6;
const SIDE = 10 * CELL + 9 * GAP;
const DIAGONAL = Math.hypot(SIDE, SIDE);

function numbers(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function centre(square: number): { x: number; y: number } {
  const leg = Math.floor((square - 1) / 10);
  const offset = (square - 1) % 10;
  const column = leg % 2 === 0 ? offset : 9 - offset;
  return { x: column * (CELL + GAP) + CELL / 2, y: (9 - leg) * (CELL + GAP) + CELL / 2 };
}

test('a link starts at one square centre and ends at the other', () => {
  for (const [from, to] of [
    [1, 100],
    [100, 1],
    [7, 63],
    [44, 45],
  ]) {
    const { d, end } = linkPath(from, to, CELL, GAP);
    const n = numbers(d);
    const start = centre(from);
    const finish = centre(to);

    expect(n[0]).toBeCloseTo(start.x, 6);
    expect(n[1]).toBeCloseTo(start.y, 6);
    expect(n[n.length - 2]).toBeCloseTo(finish.x, 6);
    expect(n[n.length - 1]).toBeCloseTo(finish.y, 6);
    expect(end).toEqual({ x: n[n.length - 2], y: n[n.length - 1] });
  }
});

test('a link reports the very points it is drawn from', () => {
  for (const from of [1, 12, 44, 100]) {
    for (const to of [1, 37, 63, 100]) {
      if (from === to) continue;
      const geometry = linkPath(from, to, CELL, GAP);
      const n = numbers(geometry.d);
      expect(geometry.start).toEqual(squareCentre(from, CELL, GAP));
      expect(geometry.end).toEqual(squareCentre(to, CELL, GAP));
      expect([n[0], n[1]]).toEqual([geometry.start.x, geometry.start.y]);
      expect(n.slice(-2)).toEqual([geometry.end.x, geometry.end.y]);
    }
  }
});

test('squareCentre walks the serpentine from the bottom left', () => {
  expect(squareCentre(1, CELL, GAP)).toEqual({ x: CELL / 2, y: SIDE - CELL / 2 });
  expect(squareCentre(10, CELL, GAP)).toEqual({ x: SIDE - CELL / 2, y: SIDE - CELL / 2 });
  expect(squareCentre(11, CELL, GAP)).toEqual({ x: SIDE - CELL / 2, y: SIDE - CELL - GAP - CELL / 2 });
  expect(squareCentre(100, CELL, GAP)).toEqual({ x: CELL / 2, y: CELL / 2 });
});

test('a ribbon is a closed outline that tapers from start to end width', () => {
  const ribbon = ribbonPath(linkPath(3, 27, CELL, GAP), 6, 16);
  expect(ribbon.endsWith('Z')).toBe(true);

  const n = numbers(ribbon);
  const points = n.length / 2;
  const at = (i: number) => ({ x: n[i * 2], y: n[i * 2 + 1] });
  const gap = (a: number, b: number) => Math.hypot(at(a).x - at(b).x, at(a).y - at(b).y);

  expect(gap(0, points - 1)).toBeCloseTo(6, 1);

  let widest = 0;
  for (let i = 1; i < points; i++) widest = Math.max(widest, gap(i - 1, i));
  expect(widest).toBeCloseTo(16, 1);
});

test('every trap pair on a seeded board makes a finite path across the board', () => {
  const board = makeBoard(20261115);
  const pairs = [...board.rockets, ...board.holes];
  expect(pairs).toHaveLength(18);

  for (const [from, to] of pairs) {
    const geometry = linkPath(from, to, CELL, GAP);
    const ribbon = ribbonPath(geometry, 6, 16);
    const start = squareCentre(from, CELL, GAP);

    expect(geometry.d).not.toContain('NaN');
    expect(ribbon).not.toContain('NaN');

    const run = Math.hypot(geometry.end.x - start.x, geometry.end.y - start.y);
    expect(run).toBeGreaterThan(0);
    expect(run).toBeLessThan(DIAGONAL);
  }
});

const STARTS = { rocket: ['launchPad', 'rocketShip'], hole: ['hole'] };
const ENDS = { rocket: ['landingPad', 'rocketLanded', 'dust'], hole: ['holeExit'] };
const SPEC = {
  launchPad: MARK.pad,
  rocketShip: MARK.ship,
  landingPad: MARK.pad,
  rocketLanded: MARK.landed,
  dust: MARK.dust,
  hole: MARK.hole,
  holeExit: MARK.holeExit,
} satisfies Record<string, MarkSize>;

test('every trap mark sits on the very point its trail leaves from or reaches', () => {
  const traps = makeBoard(20261115);
  const pairs = trapPairs(traps, CELL, null);

  expect(pairs).toHaveLength(18);
  expect(pairs.reduce((sum, pair) => sum + pair.marks.length, 0)).toBe(63);

  for (const pair of pairs) {
    const keys = pair.marks.map((mark) => mark.key);
    expect(keys).toEqual([...STARTS[pair.kind], ...ENDS[pair.kind]]);

    for (const mark of pair.marks) {
      const at = STARTS[pair.kind].includes(mark.key) ? pair.geometry.start : pair.geometry.end;
      expect({ x: mark.x, y: mark.y }).toEqual(at);
      expect(mark.size).toBe(markSize(CELL, SPEC[mark.key as keyof typeof SPEC], false));
    }
  }
});

test('a resized board re-seats every mark on its trail, nothing left behind', () => {
  const traps = makeBoard(7);
  for (const cell of [30, 101.8]) {
    for (const pair of trapPairs(traps, cell, null)) {
      const end = pair.marks.at(-1)!;
      const geometry = linkPath(pair.from, pair.to, cell, 0);
      expect({ x: end.x, y: end.y }).toEqual(geometry.end);
      expect(pair.marks).toHaveLength(pair.kind === 'rocket' ? 5 : 2);
    }
  }
});

test('the live pair grows its marks and leaves the rest dimmed', () => {
  const traps = makeBoard(20261115);
  const [from, to] = traps.holes[0];
  const pairs = trapPairs(traps, CELL, { from, to });
  const live = pairs.find((pair) => pair.live)!;

  expect(live.from).toBe(from);
  expect(pairs.filter((pair) => pair.live)).toHaveLength(1);
  for (const mark of live.marks) {
    expect(mark.size).toBe(markSize(CELL, SPEC[mark.key as keyof typeof SPEC], true));
  }
});

