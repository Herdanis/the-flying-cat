// ============================================
// Board View
// ============================================

import { BLACK_HOLES, LAST_SQUARE, LEGS, ROCKETS } from '../game/board';
import type { Game } from '../game/state';
import { hole, rocket, star } from './icons';
import { el } from './layout';

export type TrackDir = 'right' | 'left' | 'up';

const DINO = '\u{1F996}';
const DOT_MIN_TILE = 44;
const DOT_MAX = 2;

// Token seats as a fraction of the cell; 0.7 would clip the tile number.
interface Seat {
  x: number;
  y: number;
  size: number;
}

const SEAT = {
  current: { x: 0.55, y: 0.68, size: 0.62 } satisfies Seat,
  other: { x: 0.5, y: 0.63, size: 0.52 } satisfies Seat,
  dot: { x: 0.63, y: 0.2, size: 0.15, step: 0.19 } satisfies Seat & { step: number },
  chip: { x: 0.9, y: 0.9 },
};

export interface TokenPlan {
  dots: number;
  chip: number;
}

export function tokenPlan(count: number, tilePx: number): TokenPlan {
  const dots = tilePx >= DOT_MIN_TILE ? Math.min(count, DOT_MAX) : 0;
  return { dots, chip: count - dots };
}

export interface SquarePlan extends TokenPlan {
  gone: number;
}

/** What one square draws: crowd dots, hidden players, chip count. */
export function squarePlan(group: number[], current: number, tilePx: number): SquarePlan {
  // A lone player keeps a full-size token, so only a shared tile has crowd.
  const others = group.length > 1 ? group.filter((i) => i !== current).length : 0;
  const { dots, chip } = tokenPlan(others, tilePx);
  return { dots, gone: others - dots, chip };
}

export interface BoardView {
  el: HTMLElement;
  render(game: Game): void;
  tokenRect(square: number): { x: number; y: number };
  place(playerIndex: number, square: number, instant?: boolean): void;
  reflow(game: Game): void;
}

export function displaySquare(position: number): number {
  return position === 0 ? 1 : position;
}

export function cellGridPos(square: number): { column: number; row: number } {
  const leg = Math.floor((square - 1) / 10);
  const offset = (square - 1) % 10;
  const column = leg % 2 === 0 ? offset + 1 : 10 - offset;
  return { column: column + 1, row: 10 - leg };
}

export function dirToNext(square: number): TrackDir | null {
  if (square < 1 || square >= LAST_SQUARE) return null;
  const leg = Math.floor((square - 1) / 10);
  if ((square - 1) % 10 === 9) return 'up';
  return leg % 2 === 0 ? 'right' : 'left';
}

export function createBoard(): BoardView {
  const board = el('div', 'board');
  board.setAttribute('role', 'img');
  board.setAttribute('aria-label', `Board of ${LAST_SQUARE} squares from Earth to Star`);

  const rocketAt = new Set(ROCKETS.map(([from]) => from));
  const holeAt = new Set(BLACK_HOLES.map(([from]) => from));
  const cells = new Map<number, HTMLElement>();

  for (let square = 1; square <= LAST_SQUARE; square++) {
    const { column, row } = cellGridPos(square);
    const cell = el('div', 'cell');
    cell.dataset.square = String(square);
    cell.style.gridColumn = String(column);
    cell.style.gridRow = String(row);
    if (square % 2 === 0) cell.classList.add('alt');
    const dir = dirToNext(square);
    if (dir) cell.dataset.dir = dir;

    const num = el('span', 'cell-num', String(square));
    num.setAttribute('aria-hidden', 'true');
    cell.append(num);

    let marker = '';
    if (rocketAt.has(square)) {
      cell.classList.add('rocket');
      marker = rocket();
    } else if (holeAt.has(square)) {
      cell.classList.add('hole');
      marker = hole();
    } else if (square === LAST_SQUARE) {
      cell.classList.add('star');
      marker = star();
    }

    if (marker) {
      const mark = el('span', 'cell-mark');
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = marker;
      cell.append(mark);
    }

    cells.set(square, cell);
    board.append(cell);
  }

  LEGS.forEach((name, leg) => {
    const label = el('div', 'leg', name);
    label.style.gridRow = String(10 - leg);
    board.append(label);
  });

  const overlay = el('div', 'overlay');
  board.append(overlay);

  const tokens: HTMLElement[] = [];
  const badges = new Map<number, HTMLElement>();
  let colors: string[] = [];

  function ensureTokens(count: number): void {
    if (colors.length === 0) {
      const style = getComputedStyle(document.documentElement);
      colors = [1, 2, 3, 4, 5, 6].map((n) => style.getPropertyValue(`--p${n}`).trim());
    }
    while (tokens.length < count) {
      const token = el('div', 'token');
      token.append(el('div', 'face', DINO));
      tokens.push(token);
      overlay.append(token);
    }
  }

  function cellBox(square: number): { x: number; y: number; size: number } {
    const cell = cells.get(Math.min(Math.max(square, 1), LAST_SQUARE));
    if (!cell) return { x: 0, y: 0, size: 0 };
    const c = cell.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    return { x: c.left - o.left, y: c.top - o.top, size: c.width };
  }

  function tokenRect(square: number): { x: number; y: number } {
    const { x, y } = cellBox(square);
    return { x, y };
  }

  function place(playerIndex: number, square: number, instant = false): void {
    const token = tokens[playerIndex];
    if (!token) return;

    const box = cellBox(square);
    const board = overlay.getBoundingClientRect();
    const slot = Number(token.dataset.slot ?? '0');
    const seat = token.classList.contains('dot')
      ? { ...SEAT.dot, x: SEAT.dot.x + slot * SEAT.dot.step }
      : token.classList.contains('current')
        ? SEAT.current
        : SEAT.other;

    const size = box.size * seat.size;
    const half = size / 2;
    const cx = Math.min(Math.max(box.x + box.size * seat.x, half), board.width - half);
    const cy = Math.min(Math.max(box.y + box.size * seat.y, half), board.height - half);

    token.style.setProperty('--tk', `${size}px`);
    if (instant) token.classList.add('no-anim');
    token.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    if (instant) {
      void token.offsetWidth;
      token.classList.remove('no-anim');
    }
  }

  function seatChip(badge: HTMLElement, square: number): void {
    const { x, y, size } = cellBox(square);
    badge.style.transform =
      `translate(${x + size * SEAT.chip.x}px, ${y + size * SEAT.chip.y}px) translate(-100%, -100%)`;
  }

  function render(game: Game): void {
    ensureTokens(game.players.length);

    const groups = new Map<number, number[]>();
    game.players.forEach((player, i) => {
      const square = displaySquare(player.position);
      const list = groups.get(square) ?? [];
      list.push(i);
      groups.set(square, list);
    });

    const current = game.turn;
    const plans = new Map<number, SquarePlan>();
    for (const [square, group] of groups) {
      plans.set(square, squarePlan(group, current, cellBox(square).size));
    }

    for (const [square, badge] of badges) {
      if (plans.has(square)) continue;
      badge.remove();
      badges.delete(square);
    }

    game.players.forEach((player, i) => {
      const square = displaySquare(player.position);
      const group = groups.get(square) ?? [];
      const plan = plans.get(square) ?? squarePlan([], current, 0);
      const token = tokens[i];
      const isCurrent = i === current;
      const dot = !isCurrent && group.length > 1;
      const slot = group.filter((n) => n !== current).indexOf(i);

      token.style.setProperty('--c', colors[player.colorIndex] ?? colors[0]);
      token.classList.toggle('current', isCurrent);
      token.classList.toggle('dot', dot);
      token.classList.toggle('gone', dot && slot >= plan.dots);
      if (dot) token.dataset.slot = String(slot);

      place(i, square, true);
    });

    for (const [square, plan] of plans) {
      let badge = badges.get(square);
      if (plan.chip === 0) {
        badge?.remove();
        badges.delete(square);
        continue;
      }
      if (!badge) {
        badge = el('div', 'more');
        badges.set(square, badge);
        overlay.append(badge);
      }
      badge.textContent = `+${plan.chip}`;
      seatChip(badge, square);
    }
  }

  function reflow(game: Game): void {
    game.players.forEach((player, i) => place(i, displaySquare(player.position), true));
    for (const [square, badge] of badges) seatChip(badge, square);
  }

  return { el: board, render, tokenRect, place, reflow };
}
