// ============================================
// Game State
// ============================================

use super::board::{Board, LAST_SQUARE};
use super::rules::{apply_move, Dice, MoveResult};

pub const MIN_PLAYERS: usize = 2;
pub const MAX_PLAYERS: usize = 6;

const LOG_LINES: usize = 4;

pub struct Player {
    pub name: String,
    pub color_index: usize,
    pub position: u8,
}

pub struct Game {
    pub players: Vec<Player>,
    pub turn: usize,
    pub board: Board,
    pub winner: Option<usize>,
    pub log: Vec<String>,
}

impl Game {
    pub fn new(player_count: usize) -> Result<Game, String> {
        if !(MIN_PLAYERS..=MAX_PLAYERS).contains(&player_count) {
            return Err(format!(
                "players must be between {} and {}, got {}",
                MIN_PLAYERS, MAX_PLAYERS, player_count
            ));
        }

        let players = (0..player_count)
            .map(|i| Player {
                name: format!("Dino {}", i + 1),
                color_index: i,
                position: 0,
            })
            .collect();

        Ok(Game {
            players,
            turn: 0,
            board: Board::new(),
            winner: None,
            log: Vec::new(),
        })
    }

    pub fn current(&self) -> &Player {
        &self.players[self.turn]
    }

    pub fn roll(&mut self, dice: &mut impl Dice) -> MoveResult {
        if self.winner.is_some() {
            return MoveResult::Landed(self.players[self.turn].position);
        }

        let from = self.players[self.turn].position;
        let (to, result) = apply_move(&self.board, from, dice.roll().clamp(1, 6));
        self.players[self.turn].position = to;

        let who = self.players[self.turn].name.clone();
        let line = match result {
            MoveResult::Won => format!("{} reached the Star!", who),
            MoveResult::Bounced(_) => format!("{} bounced back to {}.", who, to),
            MoveResult::Landed(_) if to > from => {
                if self.board.resolve(to).is_some() && to > from {
                    format!("{} got a boost to {}!", who, to)
                } else {
                    format!("{} moved to {}.", who, to)
                }
            }
            MoveResult::Landed(_) => format!("{} fell back to {}.", who, to),
        };
        self.push_log(line);

        match result {
            MoveResult::Won => {
                self.winner = Some(self.turn);
                if self.players[self.turn].position == LAST_SQUARE {
                    self.push_log(format!("{} wins!", self.players[self.turn].name));
                }
            }
            _ => self.turn = (self.turn + 1) % self.players.len(),
        }

        result
    }

    pub fn reset(&mut self) {
        for p in &mut self.players {
            p.position = 0;
        }
        self.winner = None;
        self.log.clear();
    }

    fn push_log(&mut self, line: String) {
        self.log.push(line);
        if self.log.len() > LOG_LINES {
            self.log.remove(0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixed(u8);

    impl Dice for Fixed {
        fn roll(&mut self) -> u8 {
            self.0
        }
    }

    #[test]
    fn rejects_out_of_range_player_counts() {
        assert!(Game::new(1).is_err());
        assert!(Game::new(7).is_err());
        assert!(Game::new(2).is_ok());
        assert!(Game::new(6).is_ok());
    }

    #[test]
    fn turns_advance_in_order_and_wrap() {
        let mut g = Game::new(3).unwrap();
        let start_turn = g.turn;
        g.roll(&mut Fixed(1));
        assert_eq!(g.turn, (start_turn + 1) % 3);
    }

    #[test]
    fn reset_clears_positions_and_winner_but_keeps_players() {
        let mut g = Game::new(2).unwrap();
        let mut d = Fixed(6);
        for _ in 0..30 {
            g.roll(&mut d);
        }
        g.reset();
        assert!(g.players.iter().all(|p| p.position == 0));
        assert!(g.winner.is_none());
        assert_eq!(g.players.len(), 2);
    }

    #[test]
    fn game_stops_rolling_once_won() {
        let mut g = Game::new(2).unwrap();
        g.players[0].position = LAST_SQUARE;
        g.winner = Some(0);
        let t = g.turn;
        g.roll(&mut Fixed(1));
        assert_eq!(g.turn, t);
        assert_eq!(g.winner, Some(0));
    }

    #[test]
    fn a_player_landing_on_the_star_becomes_the_winner() {
        let mut g = Game::new(2).unwrap();
        g.players[0].position = 97;
        let result = g.roll(&mut Fixed(3));
        assert_eq!(result, MoveResult::Won);
        assert_eq!(g.winner, Some(0));
    }

    #[test]
    fn log_keeps_a_bounded_number_of_lines() {
        let mut g = Game::new(2).unwrap();
        let mut d = Fixed(1);
        for _ in 0..50 {
            g.roll(&mut d);
        }
        assert!(g.log.len() <= LOG_LINES);
    }
}
