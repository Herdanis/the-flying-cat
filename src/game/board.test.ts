import { describe, expect, test } from 'vitest';
import { LAST_SQUARE, LEGS } from './board';

describe('board', () => {
  test('has ten legs covering the journey', () => {
    expect(LEGS).toHaveLength(10);
    expect(LEGS[0]).toBe('Earth');
    expect(LEGS.at(-1)).toBe('Star');
  });

  test('ends on the star', () => {
    expect(LAST_SQUARE).toBe(100);
  });
});
