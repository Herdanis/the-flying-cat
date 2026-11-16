// ============================================
// Dino Ladder
// ============================================

import { SPECIES } from '../game/species';
import { Game } from '../game/state';
import { createBoard, type BoardView } from './board';
import { createDice } from './dice';
import { restart, speaker } from './icons';
import { el, faceImg, mount, prefersReducedMotion } from './layout';
import { animateMove, planFor } from './motion';
import { showPicker } from './picker';
import { showRollOff } from './rolloff';
import { isMuted, play, setMuted } from './sound';
import { showStart } from './start';

let live: { board: BoardView; game: Game } | null = null;
let frame = 0;

/** One reflow per frame: a drag of the window fires far more resizes than that. */
export function remeasure(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!live || !live.board.el.isConnected) return;
    live.board.reflow(live.game);
  });
}

// ============================================
// Chrome
// ============================================

function createMute(): HTMLButtonElement {
  const button = el('button', 'icon-btn');
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
  const button = el('button', 'icon-btn');
  button.type = 'button';
  button.innerHTML = restart();
  button.setAttribute('aria-label', 'New game');
  button.title = 'New game';
  button.addEventListener('click', onClick);
  return button;
}

// ============================================
// Board
// ============================================

function startGame(picks: number[], order: number[]): void {
  const game = new Game(picks.length, undefined, picks, order);
  const board = createBoard(game.board);
  const colors = SPECIES.map((species) => species.colour);
  const dice = createDice(() => void roll());
  const reduced = prefersReducedMotion();

  const turnDino = el('span', 'turn-dino');

  const turn = el('div', 'turn');
  turn.setAttribute('aria-live', 'polite');
  const turnName = el('span', 'turn-name');
  turn.append(turnDino, turnName);

  const log = el('p', 'log');
  log.setAttribute('aria-live', 'polite');
  const buttons = el('div', 'panel-buttons');
  buttons.append(createMute(), createRestart(dinoLadder));
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
    turnDino.replaceChildren(faceImg(SPECIES[player.species].key));
    turnName.textContent = `${player.name}'s turn`;
    log.textContent = game.log;
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
      if (!live || live.game !== game) return;

      const result = game.roll(() => face);
      const plan = planFor(from, face, result);

      // The others re-centre in the bay while this one flies out of it.
      board.reseat(game);
      board.markLink(plan.trap);
      if (result.kind === 'boosted') play('rocket');
      if (result.kind === 'dragged') play('hole');
      await animateMove(board, mover, plan, reduced);
      if (!live || live.game !== game) return;
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
    dino.append(faceImg(SPECIES[winner.species].key));

    const again = el('button', 'banner-again', '\u21BB another game');
    again.type = 'button';
    again.addEventListener('click', () => {
      banner.remove();
      mount(showRollOff(picks, (next) => startGame(picks, next)));
    });

    const alt = el('button', 'banner-alt', 'change players');
    alt.type = 'button';
    alt.addEventListener('click', () => {
      banner.remove();
      dinoLadder();
    });

    const name = el('h2', 'banner-name', `${winner.name} wins!`);
    card.append(dino, name, again, alt);
    banner.append(confetti, card);
    document.body.append(banner);
    again.focus();
  }

  paint();
}

// ============================================
// Flow
// ============================================

export function dinoLadder(): void {
  live = null;
  mount(
    showStart((count) =>
      mount(showPicker(count, (picks) => mount(showRollOff(picks, (order) => startGame(picks, order))))),
    ),
  );
}
