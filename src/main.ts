// ============================================
// Boot
// ============================================

import './styles.css';
import { LAST_SQUARE } from './game/board';
import type { MoveResult } from './game/rules';
import { Game } from './game/state';
import { displaySquare, createBoard, type BoardView } from './ui/board';
import { createDice } from './ui/dice';
import { el, mount, onViewportChange, playerColors, prefersReducedMotion } from './ui/layout';
import { animateMove, movePath } from './ui/motion';
import { isMuted, play, setMuted } from './ui/sound';
import { showStart } from './ui/start';

const DINO = '\u{1F996}';
const reduced = prefersReducedMotion();

let live: { board: BoardView; game: Game } | null = null;

function remeasure(): void {
  if (!live || !live.board.el.isConnected) return;
  live.board.reflow(live.game);
}

// ============================================
// Mute Toggle
// ============================================

function createMute(): HTMLButtonElement {
  const button = el('button', 'mute');
  button.type = 'button';

  const paint = (): void => {
    const off = isMuted();
    button.textContent = off ? '\u{1F507}' : '\u{1F50A}';
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
  const board = createBoard();
  const colors = playerColors();
  const dice = createDice(() => void roll());

  const turn = el('div', 'turn');
  turn.setAttribute('aria-live', 'polite');
  const turnDino = el('span', 'turn-dino', DINO);
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
    const from = displaySquare(game.players[mover].position);

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
    const dino = el('div', 'banner-dino');
    dino.style.setProperty('--c', colors[winner.colorIndex] ?? colors[0]);
    dino.append(el('span', '', DINO));

    const again = el('button', 'banner-again', '\u21BB another game');
    again.type = 'button';
    again.addEventListener('click', () => {
      banner.remove();
      game.reset();
      paint();
    });

    const alt = el('button', 'banner-alt', 'change players');
    alt.type = 'button';
    alt.addEventListener('click', () => {
      banner.remove();
      startPicker();
    });

    card.append(dino, el('p', 'banner-name', `${winner.name} wins`), again, alt);
    banner.append(card);
    document.body.append(banner);
  }

  paint();
}

function startPicker(): void {
  live = null;
  mount(showStart((count) => startGame(count)));
}

function boot(): void {
  startPicker();

  onViewportChange(remeasure);
  if (document.fonts) void document.fonts.ready.then(remeasure);

  addEventListener('keydown', (event) => {
    if (event.key !== ' ') return;
    const dice = document.querySelector<HTMLButtonElement>('.dice');
    if (!dice) return;
    event.preventDefault();
    dice.click();
  });
}

document.body.classList.toggle('reduced', reduced);
boot();
