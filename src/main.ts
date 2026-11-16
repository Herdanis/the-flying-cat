// ============================================
// Entry
// ============================================

import './styles.css';
import { start } from './router';
import { asset } from './ui/assets';
import { remeasure } from './ui/dinoLadder';
import { TUMBLE_MS } from './ui/dice';
import { onViewportChange, el, prefersReducedMotion } from './ui/layout';
import { HOP_MS } from './ui/motion';

const SKY: [string, string][] = [
  ['nebulaA', 'sky-nebula-a'],
  ['nebulaB', 'sky-nebula-b'],
  ['sun', 'sky-sun'],
  ['moon', 'sky-moon'],
  ['planet', 'sky-planet'],
  ['satellite', 'sky-satellite'],
  ['comet', 'sky-comet'],
];
const reduced = prefersReducedMotion();

// ============================================
// Sky
// ============================================

function starField(): string {
  let seed = 99;
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 2 ** 32;
  };
  let out = '';
  for (let i = 0; i < 90; i++) {
    out += `<circle cx="${(rand() * 1000).toFixed(1)}" cy="${(rand() * 1000).toFixed(1)}"` +
      ` r="${(0.5 + rand() * 1.6).toFixed(1)}" opacity="${(0.2 + rand() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

function createSky(): void {
  const sky = el('div', 'sky');
  sky.setAttribute('aria-hidden', 'true');

  const stars = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  stars.setAttribute('class', 'stars');
  stars.setAttribute('viewBox', '0 0 1000 1000');
  stars.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  stars.setAttribute('fill', '#fff');
  stars.innerHTML = starField();
  sky.append(stars);

  for (const [key, name] of SKY) {
    const object = document.createElement('img');
    object.className = `sky-object ${name}`;
    object.src = asset('sky', key);
    object.alt = '';
    object.draggable = false;
    sky.append(object);
  }

  document.body.prepend(sky);
}

// ============================================
// Boot
// ============================================

function boot(): void {
  document.documentElement.style.setProperty('--hop', `${HOP_MS}ms`);
  document.documentElement.style.setProperty('--tumble', `${TUMBLE_MS}ms`);
  createSky();
  start();

  onViewportChange(remeasure);
  if (document.fonts) void document.fonts.ready.then(remeasure);

  addEventListener('keydown', (event) => {
    if (event.key !== ' ') return;
    // A focused button already handles Space; keep the global roll for the bare board.
    if (event.target instanceof HTMLElement && event.target.closest('button')) return;
    const dice = document.querySelector<HTMLButtonElement>('.dice');
    if (!dice) return;
    event.preventDefault();
    dice.click();
  });
}

document.body.classList.toggle('reduced', reduced);
boot();
