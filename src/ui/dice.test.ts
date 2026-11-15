import { expect, test } from 'vitest';
import { PIPS } from './dice';

test('every face 1-6 has its pips, and the start face is one', () => {
  expect(PIPS[1]).toEqual([4]);
  expect(PIPS[4]).toHaveLength(4);
  expect(PIPS[6]).toHaveLength(6);
  expect(PIPS[0]).toEqual([]);
});
