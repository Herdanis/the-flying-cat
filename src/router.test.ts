import { expect, test } from 'vitest';
import { GAMES } from './games';
import { routeFor } from './router';

test('the root and every unknown hash land on home', () => {
  for (const hash of ['', '#', '#/', '#/nope', '#//']) {
    expect(routeFor(hash)).toBe('home');
  }
});

test('a registered game key routes to that game, with or without a trailing slash', () => {
  const key = GAMES[0].key;
  for (const hash of [`#/${key}`, `#/${key}/`]) expect(routeFor(hash)).toBe(key);
});

test('the home key cannot be a game', () => {
  expect(GAMES.some((game) => game.key === 'home')).toBe(false);
});
