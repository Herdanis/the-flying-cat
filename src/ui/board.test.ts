import { expect, test } from 'vitest';
import { dirToNext } from './board';

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
