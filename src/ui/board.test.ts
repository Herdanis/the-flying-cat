import { expect, test } from 'vitest';
import { dirToNext, badgesToDrop, squarePlan, tokenPlan } from './board';

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
