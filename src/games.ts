// ============================================
// Game Registry
// ============================================

import { dinoLadder } from './ui/dinoLadder';

export interface GameEntry {
  key: string;
  title: string;
  blurb: string;
  /** A manifest key under marks/, used as the shelf tile's picture. */
  mark: string;
  mount: () => void;
}

export const GAMES: GameEntry[] = [
  {
    key: 'dino-ladder',
    title: 'Dino Ladder',
    blurb: '2–6 dinos · race to the Star',
    mark: 'star',
    mount: dinoLadder,
  },
];
