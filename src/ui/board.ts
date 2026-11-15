// ============================================
// Board View
// ============================================

import { BLACK_HOLES, LAST_SQUARE, LEGS, ROCKETS } from '../game/board';
import type { Game } from '../game/state';
import { hole, rocket, star } from './icons';
import { el } from './layout';

export type TrackDir = 'right' | 'left' | 'up';

const DINO = '\u{1F996}';
const DOTS_FIT = 3;

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
      const at = el('div', 'at');
      at.append(el('div', 'puck'), el('div', 'face', DINO));
      token.append(at);
      tokens.push(token);
      overlay.append(token);
    }
  }

  function tokenRect(square: number): { x: number; y: number } {
    const cell = cells.get(Math.min(Math.max(square, 1), LAST_SQUARE));
    if (!cell) return { x: 0, y: 0 };
    const c = cell.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    return { x: c.left - o.left, y: c.top - o.top };
  }

  function place(playerIndex: number, square: number, instant = false): void {
    const token = tokens[playerIndex];
    if (!token) return;
    const { x, y } = tokenRect(square);
    if (instant) token.classList.add('no-anim');
    token.style.transform = `translate(${x}px, ${y}px)`;
    if (instant) {
      void token.offsetWidth;
      token.classList.remove('no-anim');
    }
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
    const needed = new Set<number>();

    game.players.forEach((player, i) => {
      const square = displaySquare(player.position);
      const group = groups.get(square) ?? [];
      const token = tokens[i];
      const isCurrent = i === current;
      const shared = group.length > 1;

      token.style.setProperty('--c', colors[player.colorIndex] ?? colors[0]);
      token.classList.toggle('current', isCurrent);
      token.classList.toggle('dot', !isCurrent && shared);

      if (!isCurrent && shared) {
        const others = group.filter((n) => n !== current);
        const shown = others.length > DOTS_FIT ? DOTS_FIT - 1 : others.length;
        const slot = others.indexOf(i);
        token.classList.toggle('gone', slot >= shown);
        token.style.setProperty('--i', String(slot));
        if (others.length > DOTS_FIT) needed.add(square);
      } else {
        token.classList.remove('gone');
      }

      place(i, square, true);
    });

    for (const [square, badge] of badges) {
      if (!needed.has(square)) {
        badge.remove();
        badges.delete(square);
      }
    }

    for (const square of needed) {
      const group = groups.get(square) ?? [];
      const surplus = group.length - DOTS_FIT;
      let badge = badges.get(square);
      if (!badge) {
        badge = el('div', 'more');
        badges.set(square, badge);
        overlay.append(badge);
      }
      badge.textContent = `+${surplus}`;
      const { x, y } = tokenRect(square);
      badge.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  function reflow(game: Game): void {
    game.players.forEach((player, i) => place(i, displaySquare(player.position), true));
    for (const [square, badge] of badges) {
      const { x, y } = tokenRect(square);
      badge.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  return { el: board, render, tokenRect, place, reflow };
}
