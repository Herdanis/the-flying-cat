// ============================================
// Dice Button
// ============================================

import { el, prefersReducedMotion } from './layout';

export const TUMBLE_MS = 1000;
// Every roll turns at least this far before it lands, so it reads as a tumble.
const SPIN_X = 540;
const SPIN_Y = 720;
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
  return { x: forward(from.x, x, SPIN_X), y: forward(from.y, y, SPIN_Y) };
}

function turn(from: Angles, end: Angles, part: number): string {
  const x = from.x + (end.x - from.x) * part;
  const y = from.y + (end.y - from.y) * part;
  return `rotateX(${x}deg) rotateY(${y}deg)`;
}

/** One roll: a fast spin, then a long settle onto the face. */
export function tumbleFrames(from: Angles, face: number): Keyframe[] {
  const end = endAngles(from, face);
  return [
    { offset: 0, transform: turn(from, end, 0), easing: 'linear' },
    { offset: 0.6, transform: turn(from, end, 0.72), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { offset: 0.85, transform: turn(from, end, 0.96), easing: 'ease-in-out' },
    { offset: 1, transform: turn(from, end, 1) },
  ];
}

// The die hitting the table: two bounces, each smaller.
const BOUNCE: Keyframe[] = [
  { offset: 0, transform: 'translateY(0)', easing: 'ease-out' },
  { offset: 0.16, transform: 'translateY(-10px)', easing: 'ease-in' },
  { offset: 0.32, transform: 'translateY(0)', easing: 'ease-out' },
  { offset: 0.46, transform: 'translateY(-5px)', easing: 'ease-in' },
  { offset: 0.6, transform: 'translateY(0)', easing: 'ease-out' },
  { offset: 0.7, transform: 'translateY(-2px)', easing: 'ease-in' },
  { offset: 0.8, transform: 'translateY(0)' },
  { offset: 1, transform: 'translateY(0)' },
];

export function createDice(onRoll: () => void): DiceView {
  const button = el('button', 'dice');
  button.type = 'button';
  button.title = 'Roll';

  const bounce = el('span', 'dice-bounce');
  const cube = el('span', 'dice-cube');
  for (const face of FACES) {
    const side = el('span', 'dice-face');
    side.dataset.face = String(face);
    for (let i = 0; i < 9; i++) side.append(el('span', 'pip'));
    for (const i of PIPS[face]) side.children[i].classList.add('on');
    cube.append(side);
  }
  bounce.append(cube);
  button.append(bounce);
  button.addEventListener('click', onRoll);

  let angleX = 0;
  let angleY = 0;
  let spinning: Animation | null = null;
  let hopping: Animation | null = null;

  function showFace(value: number): void {
    const [x, y] = FACE_ROT[value] ?? FACE_ROT[1];
    angleX = x;
    angleY = y;
    cube.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    button.setAttribute('aria-label', value > 0 ? `Roll, showing ${value}` : 'Roll');
  }

  async function tumble(face: number): Promise<void> {
    spinning?.cancel();
    hopping?.cancel();

    const from = { x: angleX, y: angleY };
    const end = endAngles(from, face);

    if (!prefersReducedMotion()) {
      spinning = cube.animate(tumbleFrames(from, face), { duration: TUMBLE_MS, fill: 'forwards' });
      hopping = bounce.animate(BOUNCE, { duration: TUMBLE_MS, fill: 'forwards' });
      await new Promise((resolve) => setTimeout(resolve, TUMBLE_MS));
      spinning.cancel();
      hopping.cancel();
    }

    angleX = end.x;
    angleY = end.y;
    cube.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    button.setAttribute('aria-label', `Roll, showing ${face}`);
  }

  showFace(1);
  return { el: button, showFace, tumble };
}
