// ============================================
// Roll-Off
// ============================================

import { rollOff, type RollRow } from '../game/startOrder';
import { SPECIES } from '../game/species';
import { createDice } from './dice';
import { el, faceImg, prefersReducedMotion } from './layout';

export function showRollOff(picks: number[], onDone: (order: number[]) => void): HTMLElement {
  const { order, rolls } = rollOff(picks.length, () => 1 + Math.floor(Math.random() * 6));
  const reduced = prefersReducedMotion();
  const nameOf = (seat: number): string => SPECIES[picks[seat]].name;

  const screen = el('div', 'screen rolloff-screen');
  const title = el('h1', 'rolloff-title', 'Roll for who goes first');
  const caption = el('p', 'roll-caption');
  const grid = el('div', 'rolloff-grid');
  const line = el('p', 'roll-order');
  const go = el('button', 'roll-start', `Start — ${nameOf(order[0])} goes first`);
  go.type = 'button';
  go.hidden = true;
  go.addEventListener('click', () => onDone(order));

  const dice = createDice(() => {});
  dice.el.disabled = true;

  const tiles = picks.map((species, seat) => {
    const tile = el('div', 'roll-tile');
    tile.dataset.seat = String(seat);
    const face = el('span', 'roll-face');
    face.style.setProperty('--c', SPECIES[species].colour);
    face.append(faceImg(SPECIES[species].key));
    const value = el('span', 'roll-value');
    tile.append(face, el('span', 'roll-name', SPECIES[species].name), value);
    grid.append(tile);
    return { tile, value };
  });

  screen.append(title, caption, dice.el, grid, line, go);

  // Rows arrive wave by wave: the first round, then one tie group per wave.
  const waves: RollRow[][] = [];
  for (const row of rolls) {
    if (row.round !== waves[waves.length - 1]?.[0]?.round) waves.push([]);
    waves[waves.length - 1].push(row);
  }

  function showOrder(): void {
    caption.textContent = '';
    line.textContent = order.map(nameOf).join(' → ');
    for (const { tile } of tiles) tile.classList.remove('live');
    go.hidden = false;
    go.focus();
  }

  async function replay(): Promise<void> {
    if (reduced) {
      for (const row of rolls) tiles[row.seat].value.textContent = String(row.value);
      showOrder();
      return;
    }

    for (const wave of waves) {
      if (wave[0].round > 1) {
        const names = wave.map((row) => nameOf(row.seat));
        caption.textContent = `${names.join(' and ')} roll again`;
      }
      for (const { tile } of tiles) tile.classList.remove('live');

      for (const row of wave) {
        tiles[row.seat].tile.classList.add('live');
        await dice.tumble(row.value);
        tiles[row.seat].value.textContent = String(row.value);
      }
    }

    showOrder();
  }

  queueMicrotask(() => void replay());
  return screen;
}
