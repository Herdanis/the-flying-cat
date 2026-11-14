// ============================================
// Board Layout
// ============================================

pub const LAST_SQUARE: u8 = 100;

pub struct Board {
    pub rockets: &'static [(u8, u8)],
    pub black_holes: &'static [(u8, u8)],
    pub legs: &'static [&'static str],
}

// Rocket pairs: (from, to), `to` greater than `from`.
static ROCKETS: &[(u8, u8)] = &[
    (4, 25),
    (13, 46),
    (21, 42),
    (28, 47),
    (36, 57),
    (51, 72),
    (63, 81),
    (71, 90),
    (78, 96),
    (85, 98),
];

// Black hole pairs: (from, to), `to` less than `from`.
// No entry may sit directly after another trap (see the tests).
static BLACK_HOLES: &[(u8, u8)] = &[
    (17, 3),
    (32, 11),
    (44, 24),
    (55, 34),
    (61, 41),
    (73, 52),
    (82, 61),
    (88, 68),
    (93, 74),
    (97, 86),
];

static LEGS: &[&str] = &[
    "Earth",
    "Orbit",
    "Moon",
    "Asteroid Belt",
    "Mars",
    "Jupiter",
    "Saturn",
    "Neptune",
    "Deep Space",
    "Star",
];

impl Board {
    pub fn new() -> Board {
        Board {
            rockets: ROCKETS,
            black_holes: BLACK_HOLES,
            legs: LEGS,
        }
    }

    pub fn resolve(&self, square: u8) -> Option<u8> {
        for &(from, to) in self.rockets {
            if from == square {
                return Some(to);
            }
        }
        for &(from, to) in self.black_holes {
            if from == square {
                return Some(to);
            }
        }
        None
    }

    pub fn leg_name(&self, square: u8) -> &'static str {
        let legs = self.legs.len() as u32;
        let per_leg = (LAST_SQUARE as u32).div_ceil(legs);
        let idx = ((square.clamp(1, LAST_SQUARE) as u32 - 1) / per_leg).min(legs - 1);
        self.legs[idx as usize]
    }
}

impl Default for Board {
    fn default() -> Self {
        Board::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn board_has_ten_legs_and_squares_map_to_a_leg() {
        let b = Board::new();
        assert_eq!(b.legs.len(), 10);
        assert_eq!(b.leg_name(1), "Earth");
        assert_eq!(b.leg_name(100), "Star");
    }

    #[test]
    fn rockets_go_up_and_black_holes_go_down() {
        let b = Board::new();
        for &(from, to) in b.rockets {
            assert!(to > from, "rocket {} -> {} must go up", from, to);
            assert_eq!(b.resolve(from), Some(to));
        }
        for &(from, to) in b.black_holes {
            assert!(to < from, "black hole {} -> {} must go down", from, to);
            assert_eq!(b.resolve(from), Some(to));
        }
    }

    #[test]
    fn no_square_is_both_a_rocket_and_a_black_hole() {
        let b = Board::new();
        for &(from, _) in b.rockets {
            assert!(b.black_holes.iter().all(|&(h, _)| h != from));
        }
    }

    #[test]
    fn no_trap_sits_immediately_after_another_trap() {
        let b = Board::new();
        let trapped = |s: u8| b.resolve(s).is_some();
        for &(from, _) in b.rockets.iter().chain(b.black_holes.iter()) {
            assert!(
                !trapped(from - 1),
                "square {} sits right after a trap",
                from
            );
        }
    }

    #[test]
    fn no_trap_on_the_start_or_the_star() {
        let b = Board::new();
        assert_eq!(b.resolve(1), None);
        assert_eq!(b.resolve(LAST_SQUARE), None);
    }
}
