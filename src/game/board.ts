// ============================================
// Board Data
// ============================================

export const LAST_SQUARE = 100;

export type Trap = readonly [from: number, to: number];

export const LEGS: readonly string[] = [
  'Earth',
  'Orbit',
  'Moon',
  'Asteroid Belt',
  'Mars',
  'Jupiter',
  'Saturn',
  'Neptune',
  'Deep Space',
  'Star',
];

export function legName(square: number): string {
  const perLeg = Math.ceil(LAST_SQUARE / LEGS.length);
  const clamped = Math.min(Math.max(square, 1), LAST_SQUARE);
  return LEGS[Math.min(Math.floor((clamped - 1) / perLeg), LEGS.length - 1)];
}
