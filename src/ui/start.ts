// ============================================
// Start Screen
// ============================================

import { MAX_PLAYERS, MIN_PLAYERS } from '../game/state';
import { el } from './layout';

const DINO = '\u{1F996}';

export function showStart(onPick: (count: number) => void): HTMLElement {
  const screen = el('div', 'screen start-screen');
  const row = el('div', 'start-row');

  for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
    const btn = el('button', 'start-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', `${count} players`);
    btn.textContent = DINO.repeat(count);
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
