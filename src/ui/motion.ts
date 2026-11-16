// ============================================
// Motion
// ============================================

import { LAST_SQUARE } from '../game/board';
import type { MoveResult } from '../game/rules';
import type { BoardView, LinkPair } from './board';

export const HOP_MS = 300;
const FLY_MS = 1500;
// How far a flying dino swells at the top of its arc.
const LIFT = 0.14;

export interface MovePlan {
  walk: number[];
  trap: LinkPair | null;
}

export function movePath(from: number, to: number): number[] {
  const step = Math.sign(to - from);
  const path: number[] = [];
  for (let square = from; square !== to; square += step) path.push(square);
  path.push(to);
  return path;
}

export function planFor(from: number, face: number, result: MoveResult): MovePlan {
  if (result.kind === 'bounced') {
    return {
      walk: movePath(from, LAST_SQUARE).concat(movePath(LAST_SQUARE, result.at).slice(1)),
      trap: null,
    };
  }
  if (result.kind === 'boosted' || result.kind === 'dragged') {
    return { walk: movePath(from, from + face), trap: { from: from + face, to: result.at } };
  }
  return { walk: movePath(from, result.at), trap: null };
}

export async function animateMove(
  board: BoardView,
  player: number,
  plan: MovePlan,
  reduced: boolean,
): Promise<void> {
  const last = plan.walk.length - 1;
  const dest = plan.trap ? plan.trap.to : plan.walk[last];

  if (reduced) {
    board.place(player, dest, true);
    return;
  }

  for (const square of plan.walk) {
    board.place(player, square);
    if (square === plan.walk[last]) break;
    await wait(HOP_MS);
  }

  if (!plan.trap) return;
  await fly(board, player, board.curveFor(plan.trap.from, plan.trap.to), FLY_MS);
  // Settle into the seat, so the last few pixels glide instead of snapping.
  board.place(player, dest);
}

async function fly(
  board: BoardView,
  player: number,
  curve: (t: number) => { x: number; y: number },
  ms: number,
): Promise<void> {
  board.lift(player);
  try {
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (): void => {
        const t = Math.min((performance.now() - start) / ms, 1);
        const { x, y } = curve(t);
        board.placeAt(player, x, y, 1 + Math.sin(t * Math.PI) * LIFT);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  } finally {
    board.lift(player, false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
