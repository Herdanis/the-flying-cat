// ============================================
// Game Shelf
// ============================================

import { GAMES } from '../games';
import { asset } from './assets';
import { el } from './layout';

export function showHome(): HTMLElement {
  const screen = el('div', 'screen home-screen');

  const title = el('h1', 'home-title', 'My board games');
  const shelf = el('div', 'shelf');

  for (const game of GAMES) {
    const tile = el('button', 'shelf-tile');
    tile.type = 'button';

    const mark = document.createElement('img');
    mark.className = 'shelf-mark';
    mark.src = asset('marks', game.mark);
    mark.alt = '';
    mark.draggable = false;

    tile.append(
      mark,
      el('span', 'shelf-name', game.title),
      el('span', 'shelf-blurb', game.blurb),
    );
    tile.addEventListener('click', () => {
      location.hash = `#/${game.key}`;
    });
    shelf.append(tile);
  }

  shelf.append(el('div', 'shelf-tile shelf-empty', '+ more games soon'));
  screen.append(title, shelf);
  return screen;
}
