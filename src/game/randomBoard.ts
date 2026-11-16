// ============================================
// Random Board
// ============================================
// Notes: every seed obeys the themed board rules `violations()` spells out.
// - Earth (1-10) holds one rocket starting on 2-10; no trap ever lands on 1-10.
// - The Belt and Neptune trade one trap each way, and only that pair may hop up to 49.
// - The Belt rocket starts above the square the Neptune hole drops you on.
// - Two rockets never touch, two holes never touch; a rocket may neighbour a hole.
// - Nine rockets and nine holes; every leg except Earth and Star holds two or three, both kinds.

import { LAST_SQUARE, LEGS as LEG_NAMES, type Trap } from './board';

export interface Board {
  rockets: Trap[];
  holes: Trap[];
  resolve(square: number): number | undefined;
}

interface Slot {
  from: number;
  to: number;
  up: boolean;
}

interface Leg {
  name: string;
  lo: number;
  hi: number;
}

// Square ranges per leg; the names come from the board's own list, so they exist once.
const LEGS: Leg[] = [
  [1, 10],
  [11, 20],
  [21, 30],
  [31, 40],
  [41, 50],
  [51, 60],
  [61, 70],
  [71, 80],
  [81, 90],
  [91, LAST_SQUARE],
].map(([lo, hi], i) => ({ name: LEG_NAMES[i], lo, hi }));

const BELT = 3;
const NEPTUNE = 7;
// Orbit, Moon, Mars, Jupiter, Saturn, Deep Space: the legs free to hold the extra hole.
const OPEN_LEGS = [1, 2, 4, 5, 6, 8];

const MIN_HOP = 6;
const MAX_HOP = 20;
const PAIR_HOP = 49;
// Holes stay short so the board always lifts at least as far as it drags back.
const HOLE_HOP = 12;
const LAST_TARGET = LAST_SQUARE - 1;
const PER_KIND = 9;
// Random picks per trap; a starved leg hands the attempt back to the caller.
const CANDIDATES = 60;
// Salted attempts before the tight one, which takes every hop to its extreme.
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

function inLeg(square: number, leg: number): boolean {
  return square >= LEGS[leg].lo && square <= LEGS[leg].hi;
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
  const sources = new Set(traps.map((trap) => trap.from));
  const lands = new Set(traps.map((trap) => trap.to));

  // Earth launches once and nothing comes back to the start.
  const earth = traps.filter((trap) => trap.from <= LEGS[0].hi);
  const earthRockets = earth.filter((trap) => trap.up);
  const earthHoles = earth.filter((trap) => !trap.up);
  if (earthRockets.length !== 1) out.push(`earth: ${earthRockets.length} rockets`);
  if (earthHoles.length) out.push(`earth: ${earthHoles.length} holes`);
  if (earthRockets[0]?.from === 1) out.push('earth: starts on 1');
  for (const trap of traps) {
    if (trap.to < LEGS[1].lo) out.push(`start: lands on ${trap.to}`);
  }

  // One rocket Belt -> Neptune, one hole Neptune -> Belt, the only long hops.
  const outbound = traps.filter((t) => t.up && inLeg(t.from, BELT) && inLeg(t.to, NEPTUNE));
  const homeward = traps.filter((t) => !t.up && inLeg(t.from, NEPTUNE) && inLeg(t.to, BELT));
  if (outbound.length !== 1) out.push(`belt pair: ${outbound.length} rockets out`);
  if (homeward.length !== 1) out.push(`belt pair: ${homeward.length} holes back`);
  for (const trap of traps) {
    if (outbound.includes(trap) || homeward.includes(trap)) continue;
    if (Math.abs(trap.to - trap.from) > MAX_HOP) out.push(`long hop: ${trap.from} -> ${trap.to}`);
  }

  // Dropped into the Belt, the rocket out of it sits later on the track.
  if (outbound[0] && homeward[0] && outbound[0].from <= homeward[0].to) {
    out.push(`sequence: rocket ${outbound[0].from} is not above landing ${homeward[0].to}`);
  }

  // Same kinds keep their distance; different kinds may touch.
  for (const up of [true, false]) {
    const starts = traps.filter((trap) => trap.up === up).map((trap) => trap.from).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) {
      if (starts[i] - starts[i - 1] < 2) {
        out.push(`adjacent ${up ? 'rockets' : 'holes'}: ${starts[i - 1]}, ${starts[i]}`);
      }
    }
  }

  // Everything else: counts, hops, uniqueness and the two-or-three rule.
  for (const trap of traps) {
    const hop = Math.abs(trap.to - trap.from);
    if (trap.from > LEGS[LEGS.length - 2].hi) out.push(`home stretch: ${trap.from}`);
    if (hop < MIN_HOP) out.push(`hop out of range: ${trap.from} -> ${trap.to}`);
    if (trap.up !== (trap.to > trap.from)) out.push(`wrong way: ${trap.from} -> ${trap.to}`);
    if (sources.has(trap.to)) out.push(`lands on a source: ${trap.to}`);
  }
  if (sources.size !== traps.length) out.push('a source is reused');
  if (lands.size !== traps.length) out.push('a landing is reused');
  if (board.rockets.length !== PER_KIND) out.push(`rockets: ${board.rockets.length}`);
  if (board.holes.length !== PER_KIND) out.push(`holes: ${board.holes.length}`);

  for (let leg = 1; leg <= 8; leg++) {
    const here = traps.filter((trap) => inLeg(trap.from, leg));
    const name = LEGS[leg].name;
    if (here.length < 2 || here.length > 3) out.push(`${name}: ${here.length} traps`);
    if (!here.some((trap) => trap.up)) out.push(`${name}: no rocket`);
    if (!here.some((trap) => !trap.up)) out.push(`${name}: no hole`);
  }

  const lift = board.rockets.reduce((sum, [from, to]) => sum + (to - from), 0);
  const drag = board.holes.reduce((sum, [from, to]) => sum + (from - to), 0);
  if (lift < drag) out.push(`forward bias: rockets +${lift}, holes -${drag}`);

  return out;
}

// ============================================
// Placement
// ============================================

interface Tally {
  sources: Set<number>;
  lands: Set<number>;
  rockets: Set<number>;
  holes: Set<number>;
  slots: Slot[];
}

function place(
  up: boolean,
  fromLo: number,
  fromHi: number,
  toLo: number,
  toHi: number,
  maxHop: number,
  rand: () => number,
  tally: Tally,
  fixed = false,
): Slot | null {
  const kin = up ? tally.rockets : tally.holes;

  for (let pick = 0; pick < CANDIDATES; pick++) {
    const from = between(rand, fromLo, fromHi);
    if (tally.sources.has(from) || tally.lands.has(from)) continue;
    if (kin.has(from - 1) || kin.has(from + 1)) continue;

    const low = up ? Math.max(toLo, from + MIN_HOP) : Math.max(toLo, from - maxHop);
    const high = up ? Math.min(toHi, from + maxHop) : Math.min(toHi, from - MIN_HOP);
    if (low > high) continue;

    const to = fixed ? (up ? from + maxHop : from - MIN_HOP) : between(rand, low, high);
    if (to < low || to > high) continue;
    if (tally.sources.has(to) || tally.lands.has(to)) continue;

    tally.sources.add(from);
    tally.lands.add(to);
    kin.add(from);
    const slot = { from, to, up };
    tally.slots.push(slot);
    return slot;
  }

  return null;
}

function toBoard(tally: Tally): Board {
  const rockets = tally.slots.filter((s) => s.up).map((s) => [s.from, s.to] as const);
  const holes = tally.slots.filter((s) => !s.up).map((s) => [s.from, s.to] as const);
  const byStart = new Map<number, number>(tally.slots.map((s) => [s.from, s.to]));
  return { rockets, holes, resolve: (square) => byStart.get(square) };
}

function attempt(seed: number, tight: boolean): Board {
  const rand = lcg(seed);
  const tally: Tally = {
    sources: new Set(),
    lands: new Set(),
    rockets: new Set(),
    holes: new Set(),
    slots: [],
  };

  // Earth: one rocket off the pad, never landing back in 1-10.
  place(true, LEGS[0].lo + 1, LEGS[0].hi, LEGS[1].lo, LEGS[2].hi, MAX_HOP, rand, tally, tight);

  // Neptune's hole first, so the rocket out of the Belt can start above its landing.
  const back = place(
    false,
    LEGS[NEPTUNE].lo,
    LEGS[NEPTUNE].hi,
    LEGS[BELT].lo,
    LEGS[BELT].hi,
    PAIR_HOP,
    rand,
    tally,
  );
  if (back && back.to < LEGS[BELT].hi) {
    place(true, back.to + 1, LEGS[BELT].hi, LEGS[NEPTUNE].lo, LEGS[NEPTUNE].hi, PAIR_HOP, rand, tally);
  }

  // The pair's own second traps, both short.
  place(true, LEGS[NEPTUNE].lo, LEGS[NEPTUNE].hi, LEGS[1].lo, LAST_TARGET, MAX_HOP, rand, tally, tight);
  place(false, LEGS[BELT].lo, LEGS[BELT].hi, LEGS[1].lo, LAST_TARGET, HOLE_HOP, rand, tally, tight);

  // The open legs: one rocket and one hole each, one of them with a second hole.
  const extra = OPEN_LEGS[between(rand, 0, OPEN_LEGS.length - 1)];
  for (const leg of OPEN_LEGS) {
    const { lo, hi } = LEGS[leg];
    place(true, lo, hi, LEGS[1].lo, LAST_TARGET, MAX_HOP, rand, tally, tight);
    place(false, lo, hi, LEGS[1].lo, LAST_TARGET, HOLE_HOP, rand, tally, tight);
    if (leg === extra) {
      place(false, lo, hi, LEGS[1].lo, LAST_TARGET, HOLE_HOP, rand, tally, tight);
    }
  }

  return toBoard(tally);
}

export function makeBoard(seed: number): Board {
  let board = attempt(seed, false);
  for (let i = 1; i < TRIES && violations(board).length > 0; i++) {
    board = attempt(seed + i * SALT, i === TRIES - 1);
  }
  return board;
}
