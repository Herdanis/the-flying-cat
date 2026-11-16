// ============================================
// Boot
// ============================================

import './styles.css';
import { LAST_SQUARE } from './game/board';
import type { MoveResult } from './game/rules';
import { SPECIES } from './game/species';
import { Game } from './game/state';
import { asset } from './ui/assets';
import { createBoard, type BoardView } from './ui/board';
import { createDice } from './ui/dice';
import { restart, speaker } from './ui/icons';
import { el, faceImg, mount, onViewportChange, playerColors, prefersReducedMotion } from './ui/layout';
import { animateMove, movePath, type MovePlan } from './ui/motion';
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
let frame = 0;

/** One reflow per frame: a drag of the window fires far more resizes than that. */
function remeasure(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!live || !live.board.el.isConnected) return;
    live.board.reflow(live.game);
  });
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

function createRestart(onClick: () => void): HTMLButtonElement {
  const button = el('button', 'mute');
  button.type = 'button';
  button.innerHTML = restart();
  button.setAttribute('aria-label', 'New game');
  button.title = 'New game';
  button.addEventListener('click', onClick);
  return button;
}

function planFor(from: number, face: number, result: MoveResult): MovePlan {
  if (result.kind === 'bounced') {
    return {
      walk: movePath(from, LAST_SQUARE).concat(movePath(LAST_SQUARE, result.at).slice(1)),
      trap: null,
    };
  }
  if (result.kind === 'boosted' || result.kind === 'dragged') {
    return { walk: movePath(from, from + face), trap: { from: from + face, to: result.at } };
  }
  return { walk: movePath(from, result.at), trap: null };
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
  log.setAttribute('aria-live', 'polite');
  const buttons = el('div', 'panel-buttons');
  buttons.append(createMute(), createRestart(startPicker));
  const side = el('div', 'side');
  side.append(turn, dice.el, buttons, log);

  const screen = el('div', 'screen game-screen');
  screen.append(board.el, side);
  mount(screen);
  live = { board, game };

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

    // A die that is out of action cannot be pressed twice.
    dice.el.disabled = true;
    play('roll');
    const mover = game.turn;
    const from = game.players[mover].position;
    const face = 1 + Math.floor(Math.random() * 6);

    try {
      await dice.tumble(face);
      const result = game.roll(() => face);
      const plan = planFor(from, face, result);

      // The others re-centre in the bay while this one flies out of it.
      board.reseat(game);
      board.markLink(plan.trap);
      await animateMove(board, mover, plan, reduced);

      if (result.kind === 'boosted') play('rocket');
      if (result.kind === 'dragged') play('hole');
    } finally {
      dice.el.disabled = false;
    }

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
