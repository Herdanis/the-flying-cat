import { expect, test } from 'vitest';
import { makeBoard } from '../game/randomBoard';
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
