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
    expect(g.log.at(-1)).toBe('Dino 1 wins!');
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

  test('the log names the roll and what it did', () => {
    const g = new Game(2);
    g.players[0].position = 3;
    g.roll(() => 1);
    expect(g.log.at(-1)).toBe('Dino 1 rolled 1 — rocket! Up to 25.');
  });

  test('the log names a black hole', () => {
    const g = new Game(2);
    g.players[0].position = 60;
    g.roll(() => 1);
    expect(g.log.at(-1)).toBe('Dino 1 rolled 1 — black hole. Down to 41.');
  });

  test('the log names a bounce', () => {
    const g = new Game(2);
    g.players[0].position = 98;
    g.roll(() => 5);
    expect(g.log.at(-1)).toBe('Dino 1 rolled 5, bounced back to 97.');
  });

  test('the log names a plain landing', () => {
    const g = new Game(2);
    g.players[0].position = 0;
    g.roll(() => 2);
    expect(g.log.at(-1)).toBe('Dino 1 rolled 2. Now on 2.');
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
