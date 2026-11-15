import { expect, test } from 'vitest';
import {
  dirToNext,
  badgesToDrop,
  MARK,
  markCentre,
  markSize,
  numberInk,
  seatCentre,
  SEAT,
  squarePlan,
  tokenPlan,
} from './board';

test('the number ink flips on the four bright grounds', () => {
  for (const leg of [4, 5, 6, 9]) expect(numberInk(leg)).toBe('#2a1f08');
  for (const leg of [0, 1, 2, 3, 7, 8]) expect(numberInk(leg)).toBe('#e8eeff');
});

test('crowd dots and their ring stay on the tile', () => {
  for (const tile of [44, 72, 101.8]) {
    const box = { x: 100, y: 50, size: tile };
    for (const slot of [0, 1]) {
      const { x, y } = seatCentre(box, SEAT.dot, slot);
      const half = (tile * SEAT.dot.size) / 2 + 2;
      expect(x - half).toBeGreaterThanOrEqual(box.x - 1e-9);
      expect(x + half).toBeLessThanOrEqual(box.x + tile + 1e-9);
      expect(y - half).toBeGreaterThanOrEqual(box.y - 1e-9);
      expect(y + half).toBeLessThanOrEqual(box.y + tile + 1e-9);
    }
  }
});

test('the two dots of a crowd do not share a centre', () => {
  const box = { x: 0, y: 0, size: 72 };
  expect(seatCentre(box, SEAT.dot, 1).y).toBeGreaterThan(seatCentre(box, SEAT.dot, 0).y);
});

test('the current player sits low in the tile', () => {
  const box = { x: 0, y: 0, size: 72 };
  const { x, y } = seatCentre(box, SEAT.current);
  expect(x).toBeCloseTo(72 * SEAT.current.x, 6);
  expect(y).toBeLessThan(72);
});

test('the track turns the way the snakes-and-ladders route does', () => {
  expect(dirToNext(1)).toBe('right');
  expect(dirToNext(9)).toBe('right');
  expect(dirToNext(10)).toBe('up');
  expect(dirToNext(11)).toBe('left');
  expect(dirToNext(12)).toBe('left');
  expect(dirToNext(20)).toBe('up');
  expect(dirToNext(21)).toBe('right');
  expect(dirToNext(100)).toBeNull();
});

test('crowd layout depends on how big a tile is', () => {
  expect(tokenPlan(0, 72)).toEqual({ dots: 0, chip: 0 });
  expect(tokenPlan(1, 72)).toEqual({ dots: 1, chip: 0 });
  expect(tokenPlan(2, 72)).toEqual({ dots: 2, chip: 0 });
  expect(tokenPlan(3, 72)).toEqual({ dots: 2, chip: 1 });
  expect(tokenPlan(5, 30)).toEqual({ dots: 0, chip: 5 });
});

test('a lone player on a small tile gets no chip', () => {
  // One non-current player alone at 36px: still drawn full-size, nothing to count.
  expect(squarePlan([1], 0, 36)).toEqual({ dots: 0, gone: 0, chip: 0 });
});

test('a vacated square holds no chip', () => {
  expect(squarePlan([], 0, 36)).toEqual({ dots: 0, gone: 0, chip: 0 });
  expect(squarePlan([], 0, 72)).toEqual({ dots: 0, gone: 0, chip: 0 });
});

test('the dot threshold sits between 43 and 44px', () => {
  expect(squarePlan([1, 2, 3], 0, 43)).toEqual({ dots: 0, gone: 3, chip: 3 });
  expect(squarePlan([1, 2, 3], 0, 44)).toEqual({ dots: 2, gone: 1, chip: 1 });
});

test('the current player is never counted as crowd', () => {
  expect(squarePlan([0, 1], 0, 72)).toEqual({ dots: 1, gone: 0, chip: 0 });
  expect(squarePlan([0, 1, 2, 3], 0, 30)).toEqual({ dots: 0, gone: 3, chip: 3 });
});

test('a badge on a square the plan dropped is pruned', () => {
  expect(badgesToDrop([1, 5], [5])).toEqual([1]);
  expect(badgesToDrop([5], [5])).toEqual([]);
  expect(badgesToDrop([], [5])).toEqual([]);
});

const SEATS = [0.63, 0.66, 0.7, 0.74, 0.8];

test('trap marks take a share of the cell but keep a phone floor', () => {
  expect(markSize(30, MARK.hole, false)).toBe(16);
  expect(markSize(30, MARK.holeDrop, false)).toBe(14);
  expect(markSize(30, MARK.pad, false)).toBe(14);
  expect(markSize(30, MARK.ship, false)).toBe(13);
  expect(markSize(30, MARK.landed, false)).toBe(13);
  expect(markSize(30, MARK.dust, false)).toBe(10);
  expect(markSize(100, MARK.hole, true)).toBeCloseTo(50, 6);
  expect(markSize(100, MARK.pad, false)).toBeCloseTo(39.1, 6);
});

test('every trap mark stays on its tile and clear of the number', () => {
  for (const cell of [30, 54, 101.8]) {
    const font = Math.max(7, cell * 0.25);
    const numRight = cell * 0.12 + font * 1.24;
    const numBottom = cell * 0.12 + font;
    for (const spec of Object.values(MARK)) {
      for (const live of [true, false]) {
        const size = markSize(cell, spec, live);
        for (const fy of SEATS) {
          const { x, y } = markCentre(cell, 0.5, fy, size);
          expect(x - size / 2).toBeGreaterThanOrEqual(0);
          expect(x + size / 2).toBeLessThanOrEqual(cell);
          expect(y - size / 2).toBeGreaterThanOrEqual(0);
          expect(y + size / 2).toBeLessThanOrEqual(cell);
          const onNumber = x - size / 2 < numRight && y - size / 2 < numBottom;
          expect(onNumber).toBe(false);
        }
      }
    }
  }
});
