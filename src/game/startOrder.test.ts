import { expect, test } from 'vitest';
import { rollOff } from './startOrder';

/** A dice that plays back a script, then repeats the last value. */
function scripted(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

test('the owner example orders D, B, C, A, F, E', () => {
  // Seats A..F are 0..5. First round: A2 B4 C2 D5 E1 F1.
  // Ties resolve from the biggest number down: the 2s first, then the 1s.
  const dice = scripted([2, 4, 2, 5, 1, 1, 1, 4, 1, 3]);
  const { order, rolls } = rollOff(6, dice);
  expect(order).toEqual([3, 1, 2, 0, 5, 4]);
  expect(rolls.filter((r) => r.round === 1)).toHaveLength(6);
  expect(rolls.filter((r) => r.round === 2)).toEqual([
    { seat: 0, value: 1, round: 2 },
    { seat: 2, value: 4, round: 2 },
    { seat: 4, value: 1, round: 2 },
    { seat: 5, value: 3, round: 2 },
  ]);
});

test('distinct rolls need no re-roll', () => {
  const { order, rolls } = rollOff(3, scripted([2, 6, 4]));
  expect(order).toEqual([1, 2, 0]);
  expect(rolls).toHaveLength(3);
  expect(rolls.every((r) => r.round === 1)).toBe(true);
});

test('a tie group keeps the place its first number earned', () => {
  // A5 B3 C3 D1: the 3s re-roll to 1 and 6 — still third and fourth.
  const { order } = rollOff(4, scripted([5, 3, 3, 1, 1, 6]));
  expect(order).toEqual([0, 2, 1, 3]);
});

test('a three-way tie keeps re-rolling until it breaks', () => {
  const { order, rolls } = rollOff(3, scripted([4, 4, 4, 2, 2, 2, 5, 1, 3]));
  expect(order).toEqual([0, 2, 1]);
  expect(Math.max(...rolls.map((r) => r.round))).toBe(3);
});

test('two players who tie on the same number re-roll once', () => {
  const { order, rolls } = rollOff(2, scripted([6, 6, 1, 5]));
  expect(order).toEqual([1, 0]);
  expect(rolls).toHaveLength(4);
});
