// ============================================
// Dice Button
// ============================================

import { el, prefersReducedMotion } from './layout';

export const TUMBLE_MS = 2000;
// Every roll turns at least two full turns before it lands, so it reads as a tumble.
const SPIN = 720;
const FACES = [1, 2, 3, 4, 5, 6];

// Cube rotation that turns each face to the front.
// Its other half is the `.dice-face[data-face=…]` placement in styles.css: change both.
const FACE_ROT: Record<number, readonly [number, number]> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
};

export const PIPS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export interface Angles {
  x: number;
  y: number;
}

export interface DiceView {
  el: HTMLButtonElement;
  showFace(value: number): void;
  tumble(face: number): Promise<void>;
}

/** A forward-only angle: at least `least` further, landing on the target face. */
function forward(current: number, target: number, least: number): number {
  const spun = current + least;
  const rest = ((spun % 360) + 360) % 360;
  return spun + (((target - rest) % 360) + 360) % 360;
}

function endAngles(from: Angles, face: number): Angles {
  const [x, y] = FACE_ROT[face] ?? FACE_ROT[1];
  return { x: forward(from.x, x, SPIN), y: forward(from.y, y, SPIN) };
}

function turn(from: Angles, end: Angles, part: number): string {
  const x = from.x + (end.x - from.x) * part;
  const y = from.y + (end.y - from.y) * part;
  return `rotateX(${x}deg) rotateY(${y}deg)`;
}

/** One roll: a single eased turn from the old face to the new one. */
export function tumbleFrames(from: Angles, face: number): Keyframe[] {
  const end = endAngles(from, face);
  return [
    { offset: 0, transform: turn(from, end, 0), easing: 'cubic-bezier(0.15, 0.9, 0.25, 1)' },
    { offset: 1, transform: turn(from, end, 1) },
  ];
}

export function createDice(onRoll: () => void): DiceView {
  const button = el('button', 'dice');
  button.type = 'button';
  button.title = 'Roll';

  const cube = el('span', 'dice-cube');
  for (const face of FACES) {
    const side = el('span', 'dice-face');
    side.dataset.face = String(face);
    for (let i = 0; i < 9; i++) side.append(el('span', 'pip'));
    for (const i of PIPS[face]) side.children[i].classList.add('on');
    cube.append(side);
  }
  button.append(cube);
  button.addEventListener('click', onRoll);

  let angleX = 0;
  let angleY = 0;
  let spinning: Animation | null = null;

  function showFace(value: number): void {
    const [x, y] = FACE_ROT[value] ?? FACE_ROT[1];
    angleX = x;
    angleY = y;
    cube.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    button.setAttribute('aria-label', value > 0 ? `Roll, showing ${value}` : 'Roll');
  }

  async function tumble(face: number): Promise<void> {
    spinning?.cancel();

    const from = { x: angleX, y: angleY };
    const end = endAngles(from, face);

    if (!prefersReducedMotion()) {
      spinning = cube.animate(tumbleFrames(from, face), { duration: TUMBLE_MS, fill: 'forwards' });
      await new Promise((resolve) => setTimeout(resolve, TUMBLE_MS));
      spinning.cancel();
    }

    angleX = end.x;
    angleY = end.y;
    cube.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    button.setAttribute('aria-label', `Roll, showing ${face}`);
  }

  showFace(1);
  return { el: button, showFace, tumble };
}
