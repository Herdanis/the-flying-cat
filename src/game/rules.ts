// ============================================
// Move Rules
// ============================================

import { LAST_SQUARE, resolve } from './board';

export type MoveResult =
  | { kind: 'landed' | 'boosted' | 'dragged' | 'bounced'; at: number }
  | { kind: 'won'; at: number };

export type Dice = () => number;

export function applyMove(from: number, roll: number): MoveResult {
  const target = from + roll;

  if (target > LAST_SQUARE) {
    const excess = target - LAST_SQUARE;
    return { kind: 'bounced', at: Math.max(1, LAST_SQUARE - excess) };
  }

  if (target === LAST_SQUARE) return { kind: 'won', at: LAST_SQUARE };

  const dest = resolve(target);
  if (dest === undefined) return { kind: 'landed', at: target };
  if (dest === LAST_SQUARE) return { kind: 'won', at: dest };
  return dest > target ? { kind: 'boosted', at: dest } : { kind: 'dragged', at: dest };
}
