// ============================================
// Router
// ============================================

import { GAMES } from './games';
import { showHome } from './ui/home';
import { mount } from './ui/layout';

const HOME = 'home';

/** `#/dino-ladder/` → `dino-ladder`; empty, unknown and odd variants → `home`. */
export function routeFor(hash: string): string {
  const key = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  return GAMES.some((game) => game.key === key) ? key : HOME;
}

function show(): void {
  const game = GAMES.find((entry) => entry.key === routeFor(location.hash));
  if (game) game.mount();
  else mount(showHome());
}

export function start(): void {
  show();
  addEventListener('hashchange', show);
}
