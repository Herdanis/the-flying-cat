// ============================================
// Dino Picker
// ============================================

import { SPECIES } from '../game/species';
import { el, faceImg } from './layout';

export function showPicker(count: number, onDone: (picks: number[]) => void): HTMLElement {
  const picks: number[] = [];
  const screen = el('div', 'screen picker-screen');

  const title = el('h1', 'picker-title');
  const strip = el('div', 'picker-strip');
  const grid = el('div', 'picker-grid');
  screen.append(title, strip, grid);

  const tiles = SPECIES.map((species, i) => {
    const tile = el('button', 'picker-tile');
    tile.type = 'button';
    tile.dataset.dino = species.key;

    const face = el('span', 'picker-face');
    face.style.setProperty('--c', species.colour);
    face.append(faceImg(species.key));

    const state = el('span', 'picker-state');
    tile.append(face, el('span', 'picker-name', species.name), state);
    tile.addEventListener('click', () => pick(i));
    grid.append(tile);
    return { tile, state };
  });

  function pick(species: number): void {
    if (picks.includes(species) || picks.length >= count) return;
    picks.push(species);
    paint();
    if (picks.length === count) onDone(picks);
  }

  function paint(): void {
    title.textContent = `Player ${Math.min(picks.length + 1, count)}, pick your dino`;

    strip.replaceChildren(
      ...Array.from({ length: count }, (_, seat) => {
        const chip = el('span', 'picker-seat');
        if (seat < picks.length) chip.textContent = `${seat + 1} · ${SPECIES[picks[seat]].name}`;
        else if (seat === picks.length) chip.textContent = `${seat + 1} picking…`;
        else chip.textContent = String(seat + 1);
        chip.classList.toggle('picker-now', seat === picks.length);
        return chip;
      }),
    );

    tiles.forEach(({ tile, state }, i) => {
      const taken = picks.includes(i);
      tile.classList.toggle('picker-taken', taken);
      tile.disabled = taken;
      tile.setAttribute('aria-label', taken ? `${SPECIES[i].name}, taken` : SPECIES[i].name);
      state.textContent = taken ? 'taken' : '';
    });
  }

  paint();
  return screen;
}
