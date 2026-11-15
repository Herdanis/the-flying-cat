import { describe, expect, test } from 'vitest';
import { SPECIES } from './species';
import { Game } from './state';

function plainNearStart(game: Game): number {
  for (let square = 2; square < 8; square++) {
    if (game.board.resolve(square) === undefined) return square;
  }
  throw new Error('seed leaves no plain square near the start');
}

describe('Game', () => {
  test('rejects out-of-range player counts', () => {
    expect(() => new Game(1, 1)).toThrow(RangeError);
    expect(() => new Game(7, 1)).toThrow(RangeError);
    expect(() => new Game(2, 1)).not.toThrow();
    expect(() => new Game(6, 1)).not.toThrow();
  });

  test('names players after the species in order', () => {
    const g = new Game(6, 1);
    expect(g.players.map((p) => p.name)).toEqual(SPECIES.map((s) => s.name));
  });

  test('everyone starts on square 1 and a roll of 1 moves them on', () => {
    const g = new Game(3, 1);
    expect(g.players.map((p) => p.position)).toEqual([1, 1, 1]);
    expect(g.roll(() => 1).at).toBeGreaterThan(1);
  });

  test('turns advance in order and wrap', () => {
    const g = new Game(3, 1);
    g.roll(() => 1);
    expect(g.turn).toBe(1);
    g.roll(() => 1);
    g.roll(() => 1);
    expect(g.turn).toBe(0);
  });

  test('a win stops the game', () => {
    const g = new Game(2, 1);
    g.players[0].position = 97;
    const r = g.roll(() => 3);
    expect(r.kind).toBe('won');
    expect(g.winner).toBe(0);
    expect(g.log.at(-1)).toBe('Rex wins!');
    const turnBefore = g.turn;
    g.roll(() => 1);
    expect(g.turn).toBe(turnBefore);
  });

  test('a different seed lays out a different board', () => {
    expect(new Game(2, 1).board.rockets).not.toEqual(new Game(2, 2).board.rockets);
  });

  test('the log names the roll and what it did', () => {
    const g = new Game(2, 1);
    const [from, to] = g.board.rockets[0];
    g.players[0].position = from - 1;
    g.roll(() => 1);
    expect(g.log.at(-1)).toBe(`Rex rolled 1 — rocket! Up to ${to}.`);
  });

  test('the log names a black hole', () => {
    const g = new Game(2, 1);
    const [from, to] = g.board.holes[0];
    g.players[0].position = from - 1;
    g.roll(() => 1);
    expect(g.log.at(-1)).toBe(`Rex rolled 1 — black hole. Down to ${to}.`);
  });

  test('the log names a bounce', () => {
    const g = new Game(2, 1);
    g.players[0].position = 98;
    g.roll(() => 5);
    expect(g.log.at(-1)).toBe('Rex rolled 5, bounced back to 97.');
  });

  test('the log names a plain landing', () => {
    const g = new Game(2, 1);
    const square = plainNearStart(g);
    g.players[0].position = square - 1;
    g.roll(() => 1);
    expect(g.log.at(-1)).toBe(`Rex rolled 1. Now on ${square}.`);
  });

  test('the log stays bounded', () => {
    const g = new Game(2, 1);
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
    const game = new Game((g % 5) + 2, g + 1);
    let turns = 0;
    while (game.winner === null) {
      game.roll(next);
      if (++turns > 20000) throw new Error(`game ${g} never finished`);
    }
  }
});
