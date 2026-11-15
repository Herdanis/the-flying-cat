import { expect, test } from 'vitest';
import { dirToNext, tokenPlan } from './board';

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
