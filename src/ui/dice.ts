// ============================================
// Dice Button
// ============================================

import { el, prefersReducedMotion } from './layout';

const TUMBLE_MS = 420;
const FRAME_MS = 70;

const PIPS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export interface DiceView {
  el: HTMLButtonElement;
  showFace(value: number): void;
  tumble(): Promise<void>;
}

export function createDice(onRoll: () => void): DiceView {
  const button = el('button', 'dice');
  button.type = 'button';
  button.title = 'Roll';

  const grid = el('div', 'pips');
  const cells = Array.from({ length: 9 }, () => {
    const pip = el('div', 'pip');
    grid.append(pip);
    return pip;
  });
  button.append(grid);
  button.addEventListener('click', onRoll);

  function showFace(value: number): void {
    const on = PIPS[value] ?? [];
    cells.forEach((pip, i) => pip.classList.toggle('on', on.includes(i)));
    button.setAttribute('aria-label', value > 0 ? `Roll, showing ${value}` : 'Roll');
  }

  async function tumble(): Promise<void> {
    if (prefersReducedMotion()) return;
    button.classList.add('tumbling');
    const spin = setInterval(() => showFace(1 + Math.floor(Math.random() * 6)), FRAME_MS);
    await new Promise((resolve) => setTimeout(resolve, TUMBLE_MS));
    clearInterval(spin);
    button.classList.remove('tumbling');
  }

  showFace(0);
  return { el: button, showFace, tumble };
}
