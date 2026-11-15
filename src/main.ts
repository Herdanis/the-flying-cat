// ============================================
// Boot
// ============================================

import './styles.css';
import { LAST_SQUARE } from './game/board';
import type { MoveResult } from './game/rules';
import { SPECIES } from './game/species';
import { Game } from './game/state';
import { asset } from './ui/assets';
import { displaySquare, createBoard, type BoardView } from './ui/board';
import { createDice } from './ui/dice';
import { speaker } from './ui/icons';
import { el, faceImg, mount, onViewportChange, playerColors, prefersReducedMotion } from './ui/layout';
import { animateMove, movePath } from './ui/motion';
import { isMuted, play, setMuted } from './ui/sound';
import { showStart } from './ui/start';

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

let live: { board: BoardView; game: Game } | null = null;

function remeasure(): void {
  if (!live || !live.board.el.isConnected) return;
  live.board.reflow(live.game);
}

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
// Mute Toggle
// ============================================

function createMute(): HTMLButtonElement {
  const button = el('button', 'mute');
  button.type = 'button';

  const paint = (): void => {
    const off = isMuted();
    button.innerHTML = speaker(off);
    button.setAttribute('aria-label', off ? 'Unmute sound' : 'Mute sound');
    button.setAttribute('aria-pressed', String(off));
  };

  button.addEventListener('click', () => {
    setMuted(!isMuted());
    paint();
  });

  paint();
  return button;
}

function pathFor(from: number, result: MoveResult): number[] {
  if (result.kind === 'bounced') {
    return movePath(from, LAST_SQUARE).concat(movePath(LAST_SQUARE, result.at).slice(1));
  }
  return movePath(from, result.at);
}

function startGame(count: number): void {
  const game = new Game(count);
  const board = createBoard(game.board);
  const colors = playerColors();
  const dice = createDice(() => void roll());

  const turnDino = el('span', 'turn-dino');

  const turn = el('div', 'turn');
  turn.setAttribute('aria-live', 'polite');
  const turnName = el('span', 'turn-name');
  turn.append(turnDino, turnName);

  const log = el('p', 'log');
  const side = el('div', 'side');
  side.append(turn, dice.el, createMute(), log);

  const screen = el('div', 'screen game-screen');
  screen.append(board.el, side);
  mount(screen);
  live = { board, game };

  let animating = false;
  let skip = false;

  function paint(): void {
    board.render(game);
    const player = game.current();
    turnDino.style.setProperty('--c', colors[player.colorIndex] ?? colors[0]);
    turnDino.replaceChildren(faceImg(SPECIES[player.colorIndex % SPECIES.length].key));
    turnName.textContent = `${player.name}'s turn`;
    log.textContent = game.log.at(-1) ?? '';
  }

  async function roll(): Promise<void> {
    if (game.winner !== null) return;
    if (animating) {
      skip = true;
      return;
    }

    animating = true;
    play('roll');
    const mover = game.turn;
    // The trap square is real-board maths; 0 reads as square 1 only when drawing.
    const at = game.players[mover].position;
    const from = displaySquare(at);

    await dice.tumble();
    const face = 1 + Math.floor(Math.random() * 6);
    dice.showFace(face);

    const result = game.roll(() => face);
    skip = false;
    await animateMove(board, mover, pathFor(from, result), {
      reduced,
      arc: result.kind === 'boosted' || result.kind === 'dragged',
      skipped: () => skip,
    });

    animating = false;
    if (result.kind === 'boosted') play('rocket');
    if (result.kind === 'dragged') play('hole');

    const used = result.kind === 'boosted' || result.kind === 'dragged';
    board.markLink(used ? { from: at + face, to: result.at } : null);
    paint();
    if (game.winner !== null) {
      play('win');
      showBanner();
    }
  }

  function showBanner(): void {
    const winner = game.players[game.winner ?? 0];
    const banner = el('div', 'banner');
    banner.setAttribute('role', 'alert');

    const card = el('div', 'banner-card');
    const confetti = el('div', 'confetti');
    confetti.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18 && !reduced; i++) {
      const bit = el('i', 'confetti-bit');
      bit.style.setProperty('--x', `${(i * 37) % 100}%`);
      bit.style.setProperty('--delay', `${(i % 6) * 0.24}s`);
      bit.style.setProperty('--spin', `${180 + (i % 5) * 90}deg`);
      bit.style.setProperty('--col', colors[i % colors.length]);
      confetti.append(bit);
    }

    const dino = el('div', 'banner-dino');
    dino.style.setProperty('--c', colors[winner.colorIndex] ?? colors[0]);
    dino.append(faceImg(SPECIES[winner.colorIndex % SPECIES.length].key));

    const again = el('button', 'banner-again', '\u21BB another game');
    again.type = 'button';
    again.addEventListener('click', () => {
      banner.remove();
      startGame(game.players.length);
    });

    const alt = el('button', 'banner-alt', 'change players');
    alt.type = 'button';
    alt.addEventListener('click', () => {
      banner.remove();
      startPicker();
    });

    const name = el('h2', 'banner-name', `${winner.name} wins!`);
    card.append(dino, name, again, alt);
    banner.append(confetti, card);
    document.body.append(banner);
    again.focus();
  }

  paint();
}

function startPicker(): void {
  live = null;
  mount(showStart((count) => startGame(count)));
}

/** One palette: the species colour seeds every player variable. */
function seedColours(): void {
  SPECIES.forEach((species, i) => {
    document.documentElement.style.setProperty(`--p${i + 1}`, species.colour);
  });
}

function boot(): void {
  seedColours();
  createSky();
  startPicker();

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
