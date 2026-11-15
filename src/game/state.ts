// ============================================
// Game State
// ============================================

import { makeBoard, type Board } from './randomBoard';
import { applyMove, type Dice, type MoveResult } from './rules';
import { SPECIES } from './species';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

const LOG_LINES = 4;

export interface Player {
  name: string;
  colorIndex: number;
  position: number;
}

export class Game {
  players: Player[];
  board: Board;
  turn = 0;
  winner: number | null = null;
  log: string[] = [];

  constructor(count: number, seed = Math.random() * 2 ** 32) {
    if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
      throw new RangeError(
        `players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${count}`,
      );
    }
    this.board = makeBoard(seed);
    this.players = Array.from({ length: count }, (_, i) => ({
      name: SPECIES[i].name,
      colorIndex: i,
      position: 0,
    }));
  }

  current(): Player {
    return this.players[this.turn];
  }

  roll(dice: Dice): MoveResult {
    if (this.winner !== null) {
      return { kind: 'landed', at: this.players[this.turn].position };
    }

    const face = Math.min(Math.max(Math.trunc(dice()), 1), 6);
    const result = applyMove(this.board, this.players[this.turn].position, face);
    this.players[this.turn].position = result.at;

    const who = this.players[this.turn].name;
    this.pushLog(describe(who, face, result));

    if (result.kind === 'won') {
      this.winner = this.turn;
    } else {
      this.turn = (this.turn + 1) % this.players.length;
    }

    return result;
  }

  private pushLog(line: string): void {
    this.log.push(line);
    if (this.log.length > LOG_LINES) this.log.shift();
  }
}

function describe(who: string, face: number, r: MoveResult): string {
  switch (r.kind) {
    case 'won':
      return `${who} wins!`;
    case 'bounced':
      return `${who} rolled ${face}, bounced back to ${r.at}.`;
    case 'boosted':
      return `${who} rolled ${face} — rocket! Up to ${r.at}.`;
    case 'dragged':
      return `${who} rolled ${face} — black hole. Down to ${r.at}.`;
    case 'landed':
      return `${who} rolled ${face}. Now on ${r.at}.`;
  }
}
