// ============================================
// Random Board
// ============================================

import { LAST_SQUARE, type Trap } from './board';

export interface Board {
  rockets: Trap[];
  holes: Trap[];
  resolve(square: number): number | undefined;
}

const FIRST = 2;
const LAST = LAST_SQUARE - 1;
const MIN_HOP = 6;
const MAX_HOP = 24;
const ATTEMPTS = 80;

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

export function makeBoard(seed: number, perKind = 9): Board {
  const rand = lcg(seed);
  const rockets: Trap[] = [];
  const holes: Trap[] = [];
  const sources = new Set<number>();
  const taken = new Set<number>();

  const sourceFree = (square: number): boolean =>
    !taken.has(square) && !sources.has(square - 1) && !sources.has(square + 1);

  function commit(list: Trap[], from: number, to: number): void {
    sources.add(from);
    taken.add(from);
    taken.add(to);
    list.push([from, to]);
  }

  function place(list: Trap[], up: boolean): boolean {
    const reach = (from: number): boolean => (up ? from + MIN_HOP <= LAST : from - MIN_HOP >= FIRST);

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const from = between(rand, FIRST, LAST);
      if (!sourceFree(from) || !reach(from)) continue;
      const span = Math.min(MAX_HOP, up ? LAST - from : from - FIRST);
      const hop = between(rand, MIN_HOP, span);
      const to = up ? from + hop : from - hop;
      if (taken.has(to)) continue;
      commit(list, from, to);
      return true;
    }

    // Bounded: sweep the shortest legal hop before giving up.
    for (let hop = MIN_HOP; hop <= LAST; hop++) {
      for (let from = FIRST; from <= LAST; from++) {
        const to = up ? from + hop : from - hop;
        if (to < FIRST || to > LAST) continue;
        if (!sourceFree(from) || taken.has(to)) continue;
        commit(list, from, to);
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < perKind; i++) {
    if (!place(rockets, true) || !place(holes, false)) break;
  }

  const traps = new Map<number, number>();
  for (const [from, to] of [...rockets, ...holes]) traps.set(from, to);

  return { rockets, holes, resolve: (square) => traps.get(square) };
}
