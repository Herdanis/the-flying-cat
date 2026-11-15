// ============================================
// Start Screen
// ============================================

import { SPECIES } from '../game/species';
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/state';
import { asset } from './assets';
import { el, playerColors } from './layout';

export function showStart(onPick: (count: number) => void): HTMLElement {
  const screen = el('div', 'screen start-screen');
  const row = el('div', 'start-row');
  const colors = playerColors();

  for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
    const btn = el('button', 'start-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', `${count} players`);

    const faces = el('span', 'start-faces');
    for (let i = 0; i < count; i++) {
      const face = document.createElement('img');
      face.src = asset('dinos', SPECIES[i].key);
      face.alt = '';
      face.draggable = false;
      face.style.setProperty('--c', colors[i] ?? colors[0]);
      faces.append(face);
    }

    btn.append(el('span', 'start-count', String(count)), faces);
    btn.addEventListener('click', () => onPick(count));
    row.append(btn);
  }

  screen.append(
    el('h1', 'start-title', 'Dino Ladder'),
    el('p', 'start-prompt', 'How many dinos?'),
    row,
    el('div', 'start-foot'),
  );

  return screen;
}
