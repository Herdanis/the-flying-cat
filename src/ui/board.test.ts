import { expect, test } from 'vitest';
import {
  bayOrder,
  baySeat,
  badgesToDrop,
  cellGridPos,
  MARK,
  markSize,
  numberInk,
  seatCentre,
  SEAT,
  squarePlan,
  tokenPlan,
} from './board';
import { squareCentre } from './links';

test('the number ink flips on the four bright grounds', () => {
  for (const leg of [4, 5, 6, 9]) expect(numberInk(leg)).toBe('#2a1f08');
  for (const leg of [0, 1, 2, 3, 7, 8]) expect(numberInk(leg)).toBe('#e8eeff');
});

test('the css grid and the link layer put every square in the same place', () => {
  const CELL = 48;
  const GAP = 6;
  for (let n = 1; n <= 100; n++) {
    const grid = cellGridPos(n);
    expect(squareCentre(n, CELL, GAP)).toEqual({
      x: (grid.column - 2) * (CELL + GAP) + CELL / 2,
      y: (grid.row - 1) * (CELL + GAP) + CELL / 2,
    });
  }
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

test('crowd layout depends on how big a tile is', () => {
  expect(tokenPlan(0, 72)).toEqual({ dots: 0, chip: 0 });
  expect(tokenPlan(1, 72)).toEqual({ dots: 1, chip: 0 });
  expect(tokenPlan(2, 72)).toEqual({ dots: 2, chip: 0 });
  expect(tokenPlan(3, 72)).toEqual({ dots: 2, chip: 1 });
  expect(tokenPlan(5, 30)).toEqual({ dots: 0, chip: 5 });
});

test('a lone player on a small tile gets no chip', () => {
  // One non-current player alone at 36px: still drawn full-size, nothing to count.
  expect(squarePlan([1], 0, 36)).toEqual({ dots: 0, chip: 0 });
});

test('a vacated square holds no chip', () => {
  expect(squarePlan([], 0, 36)).toEqual({ dots: 0, chip: 0 });
  expect(squarePlan([], 0, 72)).toEqual({ dots: 0, chip: 0 });
});

test('the dot threshold sits between 43 and 44px', () => {
  expect(squarePlan([1, 2, 3], 0, 43)).toEqual({ dots: 0, chip: 3 });
  expect(squarePlan([1, 2, 3], 0, 44)).toEqual({ dots: 2, chip: 1 });
});

test('the current player is never counted as crowd', () => {
  expect(squarePlan([0, 1], 0, 72)).toEqual({ dots: 1, chip: 0 });
  expect(squarePlan([0, 1, 2, 3], 0, 30)).toEqual({ dots: 0, chip: 3 });
});

test('waiting players keep player order', () => {
  expect(bayOrder([0, 4, 0, 0, 7, 0])).toEqual([0, 2, 3, 5]);
  expect(bayOrder([1, 2])).toEqual([]);
});

test('a bay seat spreads the waiting dinos evenly around the middle', () => {
  const box = { x: 100, y: 20, width: 600, height: 40 };

  expect(baySeat(0, 1, box).x).toBeCloseTo(box.x + box.width / 2, 6);

  const three = [0, 1, 2].map((i) => baySeat(i, 3, box).x);
  expect(three[1]).toBeCloseTo(box.x + box.width / 2, 6);
  expect(three[0]! < three[1]!).toBe(true);
  expect(three[1]! < three[2]!).toBe(true);
  expect(three[0]! + three[2]!).toBeCloseTo(2 * three[1]!, 6);

  for (const count of [2, 6]) {
    for (let i = 0; i < count; i++) {
      const { x, y } = baySeat(i, count, box);
      expect(x).toBeGreaterThan(box.x);
      expect(x).toBeLessThan(box.x + box.width);
      expect(y).toBeCloseTo(box.y + box.height / 2, 6);
    }
  }
});

test('a badge on a square the plan dropped is pruned', () => {
  expect(badgesToDrop([1, 5], [5])).toEqual([1]);
  expect(badgesToDrop([5], [5])).toEqual([]);
  expect(badgesToDrop([], [5])).toEqual([]);
});

test('trap marks take a share of the cell but keep a phone floor', () => {
  expect(markSize(30, MARK.hole, false)).toBe(22);
  expect(markSize(30, MARK.holeExit, false)).toBe(12);
  expect(markSize(30, MARK.pad, false)).toBeCloseTo(25.5, 6);
  expect(markSize(30, MARK.ship, false)).toBeCloseTo(23.46, 6);
  expect(markSize(30, MARK.landed, false)).toBeCloseTo(20.4, 6);
  expect(markSize(30, MARK.dust, false)).toBeCloseTo(15.81, 6);
  expect(markSize(100, MARK.hole, true)).toBeCloseTo(80, 6);
  expect(markSize(100, MARK.holeExit, true)).toBeCloseTo(42, 6);
  expect(markSize(100, MARK.pad, false)).toBeCloseTo(85, 6);
  expect(markSize(100, MARK.ship, true)).toBeCloseTo(92, 6);
  expect(markSize(100, MARK.landed, true)).toBeCloseTo(80, 6);
  expect(markSize(100, MARK.dust, true)).toBeCloseTo(62, 6);
});

test('the hole you fall into stays bigger than the one you come out of', () => {
  for (const cell of [30, 72, 101.8]) {
    for (const live of [true, false]) {
      const source = markSize(cell, MARK.hole, live);
      const dest = markSize(cell, MARK.holeExit, live);
      expect(source - dest).toBeGreaterThanOrEqual(4);
    }
  }
});

test('trap marks share one centre and stay inside the tile', () => {
  for (const cell of [30, 54, 101.8]) {
    const centre = cell * 0.5;
    for (const [key, spec] of Object.entries(MARK)) {
      for (const live of [true, false]) {
        const half = markSize(cell, spec, live) / 2;
        expect(centre - half).toBeGreaterThanOrEqual(-1e-9);
        expect(centre + half).toBeLessThanOrEqual(cell + 1e-9);
        // Only a pad may reach the tile's edge; the art's margin keeps it inside.
        if (key !== 'pad') expect(centre - half).toBeGreaterThan(0);
      }
    }
  }
});
