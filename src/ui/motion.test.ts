import { expect, test } from 'vitest';
import { movePath } from './motion';

test('movePath walks forward one square at a time', () => {
  expect(movePath(3, 7)).toEqual([3, 4, 5, 6, 7]);
  expect(movePath(1, 1)).toEqual([1]);
});

test('movePath walks backward for a black hole', () => {
  expect(movePath(40, 37)).toEqual([40, 39, 38, 37]);
});
