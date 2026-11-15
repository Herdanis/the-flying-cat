// ============================================
// Motion
// ============================================

import type { BoardView } from './board';

const HOP_MS = 120;
const ARC_MS = 420;
const SKIP_POLL_MS = 40;

export interface MoveOptions {
  reduced: boolean;
  arc?: boolean;
  skipped?: () => boolean;
}

export function movePath(from: number, to: number): number[] {
  const step = Math.sign(to - from);
  const path: number[] = [];
  for (let square = from; square !== to; square += step) path.push(square);
  path.push(to);
  return path;
}

export async function animateMove(
  board: BoardView,
  player: number,
  path: number[],
  options: MoveOptions,
): Promise<void> {
  const dest = path[path.length - 1];

  if (options.reduced || path.length === 1) {
    board.place(player, dest, true);
    return;
  }

  if (options.arc) {
    board.el.style.setProperty('--hop', `${ARC_MS}ms`);
    try {
      board.place(player, dest);
      await wait(ARC_MS, options.skipped);
    } finally {
      board.el.style.removeProperty('--hop');
    }
    return;
  }

  for (const square of path) {
    board.place(player, square);
    if (square === dest) break;
    await wait(HOP_MS, options.skipped);
    if (options.skipped?.()) {
      board.place(player, dest, true);
      break;
    }
  }
}

function wait(ms: number, skipped?: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    let left = ms;
    const tick = (): void => {
      if (skipped?.()) return resolve();
      left -= SKIP_POLL_MS;
      if (left <= 0) return resolve();
      setTimeout(tick, SKIP_POLL_MS);
    };
    setTimeout(tick, SKIP_POLL_MS);
  });
}
