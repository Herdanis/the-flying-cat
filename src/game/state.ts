// ============================================
// Game State
// ============================================

import { makeBoard, type Board } from './randomBoard';
import { applyMove, type Dice, type MoveResult } from './rules';
import { SPECIES } from './species';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export interface Player {
  name: string;
  colorIndex: number;
  /** Index into SPECIES: the dino this seat picked. */
  species: number;
  /** Board square, 1-based; 0 means still waiting in the launch bay. */
  position: number;
}

export class Game {
  players: Player[];
  board: Board;
  turn = 0;
  winner: number | null = null;
  log = '';
  /** Seat indexes in turn order, as the roll-off decided. */
  order: number[];

  constructor(count: number, seed = Math.random() * 2 ** 32, picks?: number[], order?: number[]) {
    if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
      throw new RangeError(
        `players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${count}`,
      );
    }
    if (picks && picks.length !== count) {
      throw new RangeError(`picks must hold ${count} species, got ${picks.length}`);
    }
    const seats = Array.from({ length: count }, (_, i) => i);
    const species = picks ?? seats;
    this.order = order ?? seats;
    this.board = makeBoard(seed);
    this.players = seats.map((i) => ({
      name: SPECIES[species[i]].name,
      colorIndex: species[i],
      species: species[i],
      position: 0,
    }));
    this.turn = this.order[0];
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
    this.log = describe(who, face, result);

    if (result.kind === 'won') {
      this.winner = this.turn;
    } else {
      this.turn = this.order[(this.order.indexOf(this.turn) + 1) % this.order.length];
    }

    return result;
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
