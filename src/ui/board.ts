// ============================================
// Board View
// ============================================

import { LAST_SQUARE, LEGS } from '../game/board';
import type { Board } from '../game/randomBoard';
import { SPECIES } from '../game/species';
import type { Game } from '../game/state';
import { asset, groundFor } from './assets';
import { el, faceImg, playerColors } from './layout';
import { linkPath, ribbonPath, type LinkGeometry } from './links';

export type TrackDir = 'right' | 'left' | 'up';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DOT_MIN_TILE = 44;
const DOT_MAX = 2;
const DARK_INK = '#2a1f08';
const LIGHT_INK = '#e8eeff';
const DARK_HALO = '#ffe9c9';
const LIGHT_HALO = '#101a3a';
// Mars, Jupiter, Saturn and Star are bright enough for dark numbers.
const BRIGHT_LEGS = new Set([4, 5, 6, 9]);
// The mock's tile size; every mark is measured against it.
const MOCK_CELL = 54;
// Room the token's ring takes outside its disc.
const RING = 2;

export interface MarkSize {
  frac: number;
  floor: number;
}

// Trap marks: a share of the cell, never under the floor a phone can show.
// The source hole is the big one; the exit keeps its own, smaller floor.
export const MARK = {
  hole: { frac: 0.8, floor: 22 },
  holeExit: { frac: 0.42, floor: 12 },
  pad: { frac: 0.68, floor: 18 },
  ship: { frac: 0.6, floor: 15 },
  landed: { frac: 0.5, floor: 15 },
  dust: { frac: 0.4, floor: 10 },
} satisfies Record<string, MarkSize>;

/** Mark size in pixels: live marks full, the rest a touch smaller, floors held. */
export function markSize(cell: number, spec: MarkSize, live: boolean): number {
  return Math.max(cell * spec.frac * (live ? 1 : 0.85), spec.floor);
}

// Token seats as a fraction of the cell; the number owns the top-left.
export interface Seat {
  x: number;
  y: number;
  size: number;
  step?: number;
}

export const SEAT = {
  current: { x: 0.4, y: 0.7, size: 0.62 } satisfies Seat,
  other: { x: 0.42, y: 0.66, size: 0.52 } satisfies Seat,
  dot: { x: 0.82, y: 0.52, size: 0.34, step: 0.3 } satisfies Seat,
  chip: { x: 0.97, y: 0.03 },
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

/** Badged squares the current plan no longer wants. */
export function badgesToDrop(have: Iterable<number>, want: Iterable<number>): number[] {
  const keep = new Set(want);
  return [...have].filter((square) => !keep.has(square));
}

export interface SeatBox {
  x: number;
  y: number;
  size: number;
}

/** Where a token sits: its seat, kept on the tile with room for the ring. */
export function seatCentre(box: SeatBox, seat: Seat, slot = 0): { x: number; y: number } {
  const half = (box.size * seat.size) / 2 + RING;
  const low = half;
  const high = box.size - half;
  const keep = (value: number): number =>
    high < low ? box.size / 2 : Math.min(Math.max(value, low), high);
  return {
    x: box.x + keep(box.size * seat.x),
    y: box.y + keep(box.size * (seat.y + (seat.step ?? 0) * slot)),
  };
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

/** Number colour for a leg: dark on the bright grounds, light on the rest. */
export function numberInk(leg: number): string {
  return BRIGHT_LEGS.has(leg) ? DARK_INK : LIGHT_INK;
}

export interface LinkPair {
  from: number;
  to: number;
}

export interface BoardView {
  el: HTMLElement;
  render(game: Game): void;
  place(playerIndex: number, square: number, instant?: boolean): void;
  reflow(game: Game): void;
  markLink(link: LinkPair | null): void;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

export function createBoard(traps: Board): BoardView {
  const board = el('div', 'board');
  board.setAttribute('role', 'img');
  board.setAttribute('aria-label', `Board of ${LAST_SQUARE} squares from Earth to Star`);

  const cells = new Map<number, HTMLElement>();

  for (let square = 1; square <= LAST_SQUARE; square++) {
    const { column, row } = cellGridPos(square);
    const leg = Math.floor((square - 1) / 10);
    const ink = numberInk(leg);
    const cell = el('div', 'cell');
    cell.dataset.square = String(square);
    cell.style.gridColumn = String(column);
    cell.style.gridRow = String(row);
    cell.style.backgroundImage = `url("${groundFor(leg)}")`;
    cell.style.setProperty('--num', ink);
    cell.style.setProperty('--halo', ink === DARK_INK ? DARK_HALO : LIGHT_HALO);

    const num = el('span', 'cell-num', String(square));
    num.setAttribute('aria-hidden', 'true');
    cell.append(num);

    const dir = dirToNext(square);
    if (dir) cell.dataset.dir = dir;

    if (square === LAST_SQUARE) {
      const star = document.createElement('img');
      star.className = 'cell-mark';
      star.src = asset('marks', 'star');
      star.alt = '';
      star.draggable = false;
      cell.append(star);
    }

    cells.set(square, cell);
    board.append(cell);
  }

  LEGS.forEach((name, leg) => {
    const label = el('div', 'leg', name);
    label.style.gridRow = String(10 - leg);
    board.append(label);
  });

  const links = svg('svg');
  links.setAttribute('class', 'links');
  links.setAttribute('aria-hidden', 'true');
  board.append(links);

  const overlay = el('div', 'overlay');
  board.append(overlay);

  const pieces: HTMLElement[] = [];
  const badges = new Map<number, HTMLElement>();
  const colors = playerColors();
  let live: LinkPair | null = null;

  // ============================================
  // Links
  // ============================================

  function mark(key: string, at: { x: number; y: number }, size: number): SVGImageElement {
    const image = svg('image');
    image.setAttribute('href', asset('marks', key));
    image.setAttribute('x', String(at.x - size / 2));
    image.setAttribute('y', String(at.y - size / 2));
    image.setAttribute('width', String(size));
    image.setAttribute('height', String(size));
    return image;
  }

  function trail(
    geometry: LinkGeometry,
    pairs: [number, number][],
    fill: string,
    k: number,
  ): SVGPathElement[] {
    return pairs.map(([start, end], i) => {
      const path = svg('path');
      path.setAttribute('d', ribbonPath(geometry, start * k, end * k));
      path.setAttribute('fill', fill);
      path.setAttribute('opacity', i === 0 ? '0.3' : '0.9');
      return path;
    });
  }

  function put(
    key: string,
    at: { x: number; y: number },
    spec: MarkSize,
    cell: number,
    live: boolean,
  ): SVGImageElement {
    return mark(key, at, markSize(cell, spec, live));
  }

  function drawRocket(from: number, to: number, cell: number, live: boolean): SVGGElement {
    const k = live ? 1 : 0.85;
    const geometry = linkPath(from, to, cell, 0);
    const group = svg('g');

    group.append(
      ...trail(geometry, [[5, 13], [3.4, 7.5]], '#7ee7a4', (cell / MOCK_CELL) * k),
      put('launchPad', geometry.start, MARK.pad, cell, live),
      put('rocketShip', geometry.start, MARK.ship, cell, live),
      put('landingPad', geometry.end, MARK.pad, cell, live),
      put('rocketLanded', geometry.end, MARK.landed, cell, live),
      put('dust', geometry.end, MARK.dust, cell, live),
    );
    return group;
  }

  function drawHole(from: number, to: number, cell: number, live: boolean): SVGGElement {
    const k = live ? 1 : 0.85;
    const geometry = linkPath(from, to, cell, 0);
    const group = svg('g');

    group.append(
      ...trail(geometry, [[22, 5], [13, 3]], '#c9a6ff', (cell / MOCK_CELL) * k),
      put('hole', geometry.start, MARK.hole, cell, live),
      put('holeExit', geometry.end, MARK.holeExit, cell, live),
    );
    return group;
  }

  function drawLinks(): void {
    const box = links.getBoundingClientRect();
    const cell = cells.get(1)?.getBoundingClientRect().width ?? 0;
    links.replaceChildren();
    if (box.width <= 0 || cell <= 0) return;
    links.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

    const draw = (kind: 'rocket' | 'hole', from: number, to: number): void => {
      const on = live?.from === from && live.to === to;
      const group = kind === 'rocket'
        ? drawRocket(from, to, cell, on)
        : drawHole(from, to, cell, on);
      group.setAttribute('class', 'link');
      group.dataset.live = String(on);
      group.dataset.from = String(from);
      group.dataset.to = String(to);
      links.append(group);
    };

    traps.holes.forEach(([from, to]) => draw('hole', from, to));
    traps.rockets.forEach(([from, to]) => draw('rocket', from, to));
  }

  function markLink(link: LinkPair | null): void {
    live = link;
    drawLinks();
  }

  // ============================================
  // Pieces
  // ============================================

  function ensurePieces(count: number): void {
    while (pieces.length < count) {
      const species = SPECIES[pieces.length % SPECIES.length];
      const piece = el('div', 'token');
      piece.append(faceImg(species.key));
      pieces.push(piece);
      overlay.append(piece);
    }
  }

  function cellBox(square: number): { x: number; y: number; size: number } {
    const cell = cells.get(Math.min(Math.max(square, 1), LAST_SQUARE));
    if (!cell) return { x: 0, y: 0, size: 0 };
    const c = cell.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    return { x: c.left - o.left, y: c.top - o.top, size: c.width };
  }

  function place(playerIndex: number, square: number, instant = false): void {
    const piece = pieces[playerIndex];
    if (!piece) return;

    const box = cellBox(square);
    const slot = Number(piece.dataset.slot ?? '0');
    const seat = piece.classList.contains('dot')
      ? SEAT.dot
      : piece.classList.contains('current')
        ? SEAT.current
        : SEAT.other;
    const { x: cx, y: cy } = seatCentre(box, seat, slot);

    piece.style.setProperty('--tk', `${box.size * seat.size}px`);
    if (instant) piece.classList.add('no-anim');
    piece.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    if (instant) {
      void piece.offsetWidth;
      piece.classList.remove('no-anim');
    }
  }

  function seatChip(badge: HTMLElement, square: number): void {
    const { x, y, size } = cellBox(square);
    badge.style.transform =
      `translate(${x + size * SEAT.chip.x}px, ${y + size * SEAT.chip.y}px) translate(-100%, 0)`;
  }

  function planPieces(game: Game): Map<number, SquarePlan> {
    const groups = new Map<number, number[]>();
    game.players.forEach((player, i) => {
      const square = displaySquare(player.position);
      const list = groups.get(square) ?? [];
      list.push(i);
      groups.set(square, list);
    });

    const plans = new Map<number, SquarePlan>();
    for (const [square, group] of groups) {
      plans.set(square, squarePlan(group, game.turn, cellBox(square).size));
    }

    game.players.forEach((player, i) => {
      const square = displaySquare(player.position);
      const group = groups.get(square) ?? [];
      const plan = plans.get(square) ?? squarePlan([], game.turn, 0);
      const piece = pieces[i];
      const dot = i !== game.turn && group.length > 1;
      const slot = group.filter((n) => n !== game.turn).indexOf(i);

      piece.style.setProperty('--c', colors[player.colorIndex] ?? colors[0]);
      piece.classList.toggle('current', i === game.turn);
      piece.classList.toggle('dot', dot);
      piece.classList.toggle('gone', dot && slot >= plan.dots);
      if (dot) piece.dataset.slot = String(slot);
    });

    return plans;
  }

  function paintChips(plans: Map<number, SquarePlan>): void {
    for (const square of badgesToDrop(badges.keys(), plans.keys())) {
      badges.get(square)?.remove();
      badges.delete(square);
    }

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

  /** Full repaint: also the resize path, since a tile can cross the dot threshold. */
  function paint(game: Game): void {
    ensurePieces(game.players.length);
    if (links.childElementCount === 0) drawLinks();
    paintChips(planPieces(game));
    game.players.forEach((player, i) => place(i, displaySquare(player.position), true));
  }

  function reflow(game: Game): void {
    drawLinks();
    paint(game);
  }

  return { el: board, render: paint, place, reflow, markLink };
}
