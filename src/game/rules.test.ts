import { describe, expect, test } from 'vitest';
import type { Board } from './randomBoard';
import { applyMove } from './rules';

function boardOf(rockets: [number, number][] = [], holes: [number, number][] = []): Board {
  const traps = new Map([...rockets, ...holes]);
  return { rockets, holes, resolve: (square) => traps.get(square) };
}

describe('applyMove', () => {
  test('a plain move lands where it should', () => {
    expect(applyMove(boardOf(), 1, 5)).toEqual({ kind: 'landed', at: 6 });
  });

  test('a rocket reports boosted', () => {
    expect(applyMove(boardOf([[4, 25]]), 3, 1)).toEqual({ kind: 'boosted', at: 25 });
  });

  test('a black hole reports dragged', () => {
    expect(applyMove(boardOf([], [[17, 3]]), 16, 1)).toEqual({ kind: 'dragged', at: 3 });
  });

  test('exactly hitting the star wins', () => {
    expect(applyMove(boardOf(), 97, 3)).toEqual({ kind: 'won', at: 100 });
  });

  test('overshooting bounces by the remainder, not the whole roll', () => {
    // 99 + 2 = 101, excess 1, so bounce back 1 from 100 and stop on 99.
    expect(applyMove(boardOf(), 99, 2)).toEqual({ kind: 'bounced', at: 99 });
  });

  test('a bounce that lands on a trap does not fire it', () => {
    // 98 + 5 = 103, excess 3, lands on 97 which is a black hole.
    expect(applyMove(boardOf([], [[97, 86]]), 98, 5)).toEqual({ kind: 'bounced', at: 97 });
  });

  test('no bounce can ever win', () => {
    for (let from = 95; from <= 100; from++) {
      for (let roll = 1; roll <= 6; roll++) {
        const r = applyMove(boardOf(), from, roll);
        if (r.kind === 'bounced') expect(r.at).toBeLessThan(100);
      }
    }
  });

  test('a rocket that falls short of the star reports boosted', () => {
    // 84 + 1 lands on 85, which is a rocket to 98.
    expect(applyMove(boardOf([[85, 98]]), 84, 1)).toEqual({ kind: 'boosted', at: 98 });
  });
});
