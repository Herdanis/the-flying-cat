import { expect, test } from 'vitest';
import { movePath, planFor } from './motion';

test('movePath walks forward one square at a time', () => {
  expect(movePath(3, 7)).toEqual([3, 4, 5, 6, 7]);
  expect(movePath(1, 1)).toEqual([1]);
});

test('movePath walks backward for a black hole', () => {
  expect(movePath(40, 37)).toEqual([40, 39, 38, 37]);
});

test('a plain landing walks straight to the square, with no trap', () => {
  expect(planFor(3, 4, { kind: 'landed', at: 7 })).toEqual({
    walk: [3, 4, 5, 6, 7],
    trap: null,
  });
});

test('a trap carries the hop from the die landing to where it drops you', () => {
  expect(planFor(40, 3, { kind: 'boosted', at: 55 })).toEqual({
    walk: [40, 41, 42, 43],
    trap: { from: 43, to: 55 },
  });
  expect(planFor(60, 2, { kind: 'dragged', at: 44 })).toEqual({
    walk: [60, 61, 62],
    trap: { from: 62, to: 44 },
  });
});

test('a bounce walks to the last square and back, with no trap', () => {
  expect(planFor(98, 5, { kind: 'bounced', at: 97 })).toEqual({
    walk: [98, 99, 100, 99, 98, 97],
    trap: null,
  });
});
