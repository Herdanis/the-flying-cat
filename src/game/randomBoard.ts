// ============================================
// Random Board
// ============================================
// Notes: every seed obeys the board rules `violations()` spells out.
// - No trap starts or ends on squares 1-10.
// - No trap starts on squares 91-100.
// - Each leg of ten (11-20 … 81-90) holds two or three traps, always both kinds.
// - Two legs hold three: one with two rockets, another with two holes; the rest one of each.
// - Rockets lift at least as far in total as the holes drag back.

import { LAST_SQUARE, type Trap } from './board';

export interface Board {
  rockets: Trap[];
  holes: Trap[];
  resolve(square: number): number | undefined;
}

const LEGS = 8;
const FIRST_SOURCE = 11;
const LAST_SOURCE = 90;
const FIRST_TARGET = 11;
const LAST_TARGET = LAST_SQUARE - 1;
const MIN_HOP = 6;
const MAX_HOP = 20;
const PER_KIND = 9;
// Random picks per trap; a starved leg hands the attempt back to the caller.
const CANDIDATES = 60;
// Salted attempts before the tight one, which caps every hole hop.
const TRIES = 20;
const SALT = 0x9e3779b1;

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function between(rand: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

/** The ten squares of one leg: 0 is 11-20, 7 is 81-90. */
function legRange(leg: number): [number, number] {
  const lo = FIRST_SOURCE + leg * 10;
  return [lo, lo + 9];
}

interface Slot {
  from: number;
  to: number;
  up: boolean;
}

function trapsOf(board: Board): Slot[] {
  return [
    ...board.rockets.map(([from, to]) => ({ from, to, up: true })),
    ...board.holes.map(([from, to]) => ({ from, to, up: false })),
  ];
}

// ============================================
// Rules
// ============================================

/** Every rule the board breaks, in plain words; empty when it obeys them all. */
export function violations(board: Board): string[] {
  const out: string[] = [];
  const traps = trapsOf(board);
  const starts = new Set(traps.map((trap) => trap.from));
  const ends = new Set(traps.map((trap) => trap.to));

  for (const trap of traps) {
    const hop = Math.abs(trap.to - trap.from);
    if (trap.from < FIRST_SOURCE || trap.to < FIRST_TARGET) {
      out.push(`start zone: ${trap.from} -> ${trap.to}`);
    }
    if (trap.from > LAST_SOURCE) out.push(`home stretch: ${trap.from}`);
    if (hop < MIN_HOP || hop > MAX_HOP) out.push(`hop out of range: ${trap.from} -> ${trap.to}`);
    if (trap.up !== (trap.to > trap.from)) out.push(`wrong way: ${trap.from} -> ${trap.to}`);
    if (starts.has(trap.to)) out.push(`lands on a source: ${trap.to}`);
  }

  for (let leg = 0; leg < LEGS; leg++) {
    const [lo, hi] = legRange(leg);
    const here = traps.filter((trap) => trap.from >= lo && trap.from <= hi);
    const name = `leg ${lo}-${hi}`;
    if (here.length < 2 || here.length > 3) out.push(`${name}: ${here.length} traps`);
    if (!here.some((trap) => trap.up)) out.push(`${name}: no rocket`);
    if (!here.some((trap) => !trap.up)) out.push(`${name}: no hole`);
  }

  const sorted = [...starts].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < 2) out.push(`sources touch: ${sorted[i - 1]}, ${sorted[i]}`);
  }
  if (starts.size !== traps.length) out.push('a source is reused');
  if (ends.size !== traps.length) out.push('a landing is reused');
  if (board.rockets.length !== PER_KIND) out.push(`rockets: ${board.rockets.length}`);
  if (board.holes.length !== PER_KIND) out.push(`holes: ${board.holes.length}`);

  const lift = board.rockets.reduce((sum, [from, to]) => sum + (to - from), 0);
  const drag = board.holes.reduce((sum, [from, to]) => sum + (from - to), 0);
  if (lift < drag) out.push(`forward bias: rockets +${lift}, holes -${drag}`);

  return out;
}

// ============================================
// Placement
// ============================================

function addTrap(
  up: boolean,
  leg: number,
  rand: () => number,
  starts: Set<number>,
  ends: Set<number>,
  out: Slot[],
  tight: boolean,
): boolean {
  const [lo, hi] = legRange(leg);

  for (let pick = 0; pick < CANDIDATES; pick++) {
    const from = between(rand, lo, hi);
    if (starts.has(from) || ends.has(from)) continue;
    if (starts.has(from - 1) || starts.has(from + 1)) continue;

    // Room for the shortest legal hop that still lands in the target zone.
    const room = (up ? LAST_TARGET - from : from - FIRST_TARGET);
    const span = Math.min(tight ? MIN_HOP : MAX_HOP, room);
    if (span < MIN_HOP) continue;

    const hop = between(rand, MIN_HOP, span);
    const to = up ? from + hop : from - hop;
    if (starts.has(to) || ends.has(to)) continue;

    starts.add(from);
    ends.add(to);
    out.push({ from, to, up });
    return true;
  }

  return false;
}

function attempt(seed: number, tight: boolean): Board {
  const rand = lcg(seed);
  const starts = new Set<number>();
  const ends = new Set<number>();
  const traps: Slot[] = [];

  // Quotas first: two legs of three, the rest one rocket and one hole.
  const extraRockets = between(rand, 0, LEGS - 1);
  let extraHoles = between(rand, 0, LEGS - 2);
  if (extraHoles >= extraRockets) extraHoles += 1;

  for (let leg = 0; leg < LEGS; leg++) {
    const rockets = leg === extraRockets ? 2 : 1;
    const holes = leg === extraHoles ? 2 : 1;
    for (let i = 0; i < rockets; i++) addTrap(true, leg, rand, starts, ends, traps, tight);
    for (let i = 0; i < holes; i++) addTrap(false, leg, rand, starts, ends, traps, tight);
  }

  const rockets = traps.filter((trap) => trap.up).map((trap) => [trap.from, trap.to] as const);
  const holes = traps.filter((trap) => !trap.up).map((trap) => [trap.from, trap.to] as const);
  const byStart = new Map<number, number>();
  for (const { from, to } of traps) byStart.set(from, to);

  return { rockets, holes, resolve: (square) => byStart.get(square) };
}

export function makeBoard(seed: number): Board {
  let board = attempt(seed, false);
  for (let i = 1; i < TRIES && violations(board).length > 0; i++) {
    board = attempt(seed + i * SALT, i === TRIES - 1);
  }
  return board;
}
