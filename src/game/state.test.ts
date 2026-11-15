import { describe, expect, test } from 'vitest';
import { Game } from './state';

describe('Game', () => {
  test('rejects out-of-range player counts', () => {
    expect(() => new Game(1)).toThrow(RangeError);
    expect(() => new Game(7)).toThrow(RangeError);
    expect(() => new Game(2)).not.toThrow();
    expect(() => new Game(6)).not.toThrow();
  });

  test('turns advance in order and wrap', () => {
    const g = new Game(3);
    g.roll(() => 1);
    expect(g.turn).toBe(1);
    g.roll(() => 1);
    g.roll(() => 1);
    expect(g.turn).toBe(0);
  });

  test('a win stops the game', () => {
    const g = new Game(2);
    g.players[0].position = 97;
    const r = g.roll(() => 3);
    expect(r.kind).toBe('won');
    expect(g.winner).toBe(0);
    const turnBefore = g.turn;
    g.roll(() => 1);
    expect(g.turn).toBe(turnBefore);
  });

  test('reset clears positions and winner but keeps players', () => {
    const g = new Game(2);
    g.players[0].position = 50;
    g.winner = 0;
    g.reset();
    expect(g.players.every((p) => p.position === 0)).toBe(true);
    expect(g.winner).toBeNull();
    expect(g.players).toHaveLength(2);
  });

  test('the log names what happened', () => {
    const g = new Game(2);
    g.players[0].position = 3;
    g.roll(() => 1);
    expect(g.log.at(-1)).toContain('rocket');
  });

  test('the log stays bounded', () => {
    const g = new Game(2);
    for (let i = 0; i < 60; i++) g.roll(() => 1);
    expect(g.log.length).toBeLessThanOrEqual(4);
  });
});

test('200 seeded games all finish', () => {
  let seed = 1;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed % 6) + 1;
  };
  for (let g = 0; g < 200; g++) {
    const game = new Game((g % 5) + 2);
    let turns = 0;
    while (game.winner === null) {
      game.roll(next);
      if (++turns > 20000) throw new Error(`game ${g} never finished`);
    }
  }
});
