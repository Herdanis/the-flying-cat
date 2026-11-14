// ============================================
// Game Rules
// ============================================

use super::board::{Board, LAST_SQUARE};

pub trait Dice {
    fn roll(&mut self) -> u8;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoveResult {
    Landed(u8),
    Bounced(u8),
    Won,
}

pub fn take_turn(board: &Board, from: u8, dice: &mut impl Dice) -> (u8, MoveResult) {
    let roll = dice.roll().clamp(1, 6);
    let (to, result) = apply_move(board, from, roll);
    (to, result)
}

pub fn apply_move(board: &Board, from: u8, roll: u8) -> (u8, MoveResult) {
    let target = from.saturating_add(roll);

    if target > LAST_SQUARE {
        let bounce = LAST_SQUARE - (target - LAST_SQUARE);
        return (bounce.max(1), MoveResult::Bounced(bounce.max(1)));
    }

    if target == LAST_SQUARE {
        return (LAST_SQUARE, MoveResult::Won);
    }

    match board.resolve(target) {
        Some(dest) => {
            if dest == LAST_SQUARE {
                (dest, MoveResult::Won)
            } else {
                (dest, MoveResult::Landed(dest))
            }
        }
        None => (target, MoveResult::Landed(target)),
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
    fn plain_advance_without_trap() {
        let b = Board::new();
        // 1 + 5 = 6; square 6 is a plain square on the fixture board.
        let (pos, result) = apply_move(&b, 1, 5);
        assert_eq!(pos, 6);
        assert_eq!(result, MoveResult::Landed(6));
    }

    #[test]
    fn overshoot_bounces_and_does_not_resolve() {
        let b = Board::new();
        let (pos, result) = apply_move(&b, 98, 4);
        assert_eq!(pos, 98);
        assert_eq!(result, MoveResult::Bounced(98));
        assert_eq!(b.resolve(98), None);
    }

    #[test]
    fn exact_landing_on_last_square_wins() {
        let b = Board::new();
        let (pos, result) = take_turn(&b, 97, &mut Fixed(3));
        assert_eq!(pos, LAST_SQUARE);
        assert_eq!(result, MoveResult::Won);
    }

    #[test]
    fn roll_from_99_that_overshoots_bounces_to_99() {
        let b = Board::new();
        let (pos, result) = take_turn(&b, 99, &mut Fixed(2));
        assert_eq!(pos, 99);
        assert_eq!(result, MoveResult::Bounced(99));
    }

    #[test]
    fn bounce_never_wins_even_when_it_lands_on_100() {
        // Nothing can bounce onto the Star: a bounce only happens on an
        // overshoot, and the result is always below LAST_SQUARE.
        let b = Board::new();
        for start in 1..=LAST_SQUARE {
            for roll in 1..=6u8 {
                let (pos, result) = apply_move(&b, start, roll);
                if matches!(result, MoveResult::Bounced(_)) {
                    assert!(pos < LAST_SQUARE, "bounce from {} with {} reached {}", start, roll, pos);
                }
            }
        }
    }

    #[test]
    fn rocket_lifts_after_a_normal_move() {
        let b = Board::new();
        let (from, to) = b.rockets[0];
        let (pos, _) = take_turn(&b, from - 1, &mut Fixed(1));
        assert_eq!(pos, to);
    }

    #[test]
    fn black_hole_drags_after_a_normal_move() {
        let b = Board::new();
        let (from, to) = b.black_holes[0];
        let (pos, _) = take_turn(&b, from - 1, &mut Fixed(1));
        assert_eq!(pos, to);
    }

    #[test]
    fn bounce_onto_a_trap_square_does_not_resolve() {
        // 98 + 5 = 103 -> bounce to 97. 97 is a black hole on the fixture board,
        // and the bounce must win out over it.
        let b = Board::new();
        assert!(b.resolve(97).is_some(), "fixture expects 97 to be a trap");
        let (pos, result) = apply_move(&b, 98, 5);
        assert_eq!(pos, 97);
        assert_eq!(result, MoveResult::Bounced(97));
    }
}
