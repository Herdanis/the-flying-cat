// ============================================
// Board Data
// ============================================

export const LAST_SQUARE = 100;

export type Trap = readonly [from: number, to: number];

export const ROCKETS: readonly Trap[] = [
  [4, 25],
  [13, 46],
  [21, 42],
  [28, 47],
  [36, 57],
  [51, 72],
  [63, 81],
  [71, 90],
  [78, 96],
  [85, 98],
];

export const BLACK_HOLES: readonly Trap[] = [
  [17, 3],
  [32, 11],
  [44, 24],
  [55, 34],
  [61, 41],
  [73, 52],
  [82, 61],
  [88, 68],
  [93, 74],
  [97, 86],
];

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

export function resolve(square: number): number | undefined {
  for (const [from, to] of ROCKETS) if (from === square) return to;
  for (const [from, to] of BLACK_HOLES) if (from === square) return to;
  return undefined;
}

export function legName(square: number): string {
  const perLeg = Math.ceil(LAST_SQUARE / LEGS.length);
  const clamped = Math.min(Math.max(square, 1), LAST_SQUARE);
  return LEGS[Math.min(Math.floor((clamped - 1) / perLeg), LEGS.length - 1)];
}
