import { describe, expect, test } from 'vitest';
import { LAST_SQUARE, LEGS, legName } from './board';

describe('board', () => {
  test('has ten legs covering the journey', () => {
    expect(LEGS).toHaveLength(10);
    expect(legName(1)).toBe('Earth');
    expect(legName(100)).toBe('Star');
  });

  test('clamps squares outside the track', () => {
    expect(LAST_SQUARE).toBe(100);
    expect(legName(0)).toBe('Earth');
    expect(legName(101)).toBe('Star');
  });
});
