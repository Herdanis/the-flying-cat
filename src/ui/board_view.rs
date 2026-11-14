// ============================================
// Board View
// ============================================

use ratatui::layout::Rect;

use crate::game::board::LAST_SQUARE;
use crate::game::state::Game;

// The route is a serpentine: it runs across the full width in fixed-width
// cells, ten squares per row, giving ten rows from Earth to Star.
const SQUARES_PER_ROW: u16 = 10;
pub const BOARD_ROWS: u16 = LAST_SQUARE as u16 / SQUARES_PER_ROW;

// A square needs at least this many columns to show a number.
const MIN_PITCH: u16 = 4;

pub fn cell_pitch(area: Rect) -> u16 {
    (area.width / SQUARES_PER_ROW).max(MIN_PITCH)
}

// Vertical offset that centres the ten-row route inside the given area.
fn board_top(area: Rect) -> u16 {
    area.height.saturating_sub(BOARD_ROWS) / 2
}

pub fn square_to_cell(area: Rect, square: u8) -> (u16, u16) {
    let idx = square.clamp(1, LAST_SQUARE) as u16 - 1;
    let row_from_bottom = (idx / SQUARES_PER_ROW).min(BOARD_ROWS - 1);
    let pos_in_row = idx % SQUARES_PER_ROW;

    // Odd rows run right to left, as on a standard snakes-and-ladders board:
    // square 1 sits bottom-left and square 100 finishes the top row.
    let col = if row_from_bottom.is_multiple_of(2) {
        pos_in_row
    } else {
        SQUARES_PER_ROW - 1 - pos_in_row
    };

    let pitch = cell_pitch(area);
    let x = col.saturating_mul(pitch);
    let y = board_top(area) + (BOARD_ROWS - 1 - row_from_bottom);

    (
        x.min(area.width.saturating_sub(1)),
        y.min(area.height.saturating_sub(1)),
    )
}

// Leg names sit on the row where each leg begins. They need one free row per
// leg plus a little padding, so ten legs need at least ten rows of board.
pub fn legs_fit(area: Rect) -> bool {
    area.height >= BOARD_ROWS
}

pub fn cell_label(square: u8, ascii: bool) -> &'static str {
    let b = crate::game::board::Board::new();
    if let Some(dest) = b.resolve(square) {
        let up = dest > square;
        return match (up, ascii) {
            (true, false) => "⇧",
            (true, true) => "^",
            (false, false) => "◉",
            (false, true) => "@",
        };
    }
    if square == LAST_SQUARE {
        return if ascii { "*" } else { "★" };
    }
    ""
}

pub fn cell_occupants(game: &Game, square: u8) -> Vec<usize> {
    game.players
        .iter()
        .enumerate()
        .filter(|(_, p)| {
            let at = if p.position == 0 { 1 } else { p.position };
            at == square
        })
        .map(|(i, _)| i)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn earth_is_bottom_left_and_the_star_finishes_the_top_row() {
        for (w, h) in [(80, 24), (80, 20), (137, 31), (200, 50), (100, 40)] {
            let area = Rect::new(0, 0, w, h);
            let first = square_to_cell(area, 1);
            let last = square_to_cell(area, LAST_SQUARE);
            assert_eq!(first.0, 0, "Earth must be at the left edge in {}x{}", w, h);
            assert!(
                last.1 < first.1,
                "the Star must be above Earth in {}x{}",
                w,
                h
            );
            assert_eq!(
                last.0, 0,
                "on a standard board the Star closes the top row in {}x{}",
                w, h
            );
        }
    }

    #[test]
    fn geometry_never_leaves_the_area() {
        for (w, h) in [(80, 24), (137, 31), (1, 1), (10, 3), (80, 12), (200, 50)] {
            let area = Rect::new(0, 0, w, h);
            for n in 1..=LAST_SQUARE {
                let (x, y) = square_to_cell(area, n);
                assert!(
                    x < area.width.max(1) && y < area.height.max(1),
                    "square {} out of bounds at {:?} in {}x{}",
                    n,
                    (x, y),
                    w,
                    h
                );
            }
        }
    }

    #[test]
    fn consecutive_squares_within_a_row_step_one_pitch() {
        let area = Rect::new(0, 0, 80, 24);
        let pitch = cell_pitch(area);
        // Squares 1..=9 are all on the bottom row, left to right.
        for n in 1..10u8 {
            let a = square_to_cell(area, n);
            let b = square_to_cell(area, n + 1);
            assert_eq!(a.1, b.1, "squares {} and {} share a row", n, n + 1);
            assert_eq!(b.0, a.0 + pitch, "square {} follows {}", n + 1, n);
        }
    }

    #[test]
    fn turns_the_row_at_each_boundary() {
        let area = Rect::new(0, 0, 80, 24);
        let s10 = square_to_cell(area, 10);
        let s11 = square_to_cell(area, 11);
        assert_eq!(s10.1, s11.1 + 1, "square 11 is one row above 10");
        assert_eq!(s10.0, s11.0, "both sit at the right edge");
    }

    #[test]
    fn occupancy_and_labels() {
        let mut g = Game::new(3).unwrap();
        g.players[0].position = 5;
        g.players[1].position = 5;
        g.players[2].position = 9;
        assert_eq!(cell_occupants(&g, 5), vec![0, 1]);
        assert_eq!(cell_occupants(&g, 9), vec![2]);
        assert!(cell_occupants(&g, 42).is_empty());
        assert_eq!(cell_occupants(&Game::new(2).unwrap(), 1).len(), 2);
    }

    #[test]
    fn traps_and_the_star_get_a_label() {
        let (rocket, _) = crate::game::board::Board::new().rockets[0];
        let (hole, _) = crate::game::board::Board::new().black_holes[0];
        assert_eq!(cell_label(rocket, false), "⇧");
        assert_eq!(cell_label(hole, false), "◉");
        assert_eq!(cell_label(LAST_SQUARE, false), "★");
        assert_eq!(cell_label(2, false), "");
        assert_eq!(cell_label(rocket, true), "^");
        assert_eq!(cell_label(hole, true), "@");
    }

    #[test]
    fn legs_fit_only_when_the_board_is_tall_enough() {
        assert!(legs_fit(Rect::new(0, 0, 80, 24)));
        assert!(legs_fit(Rect::new(0, 0, 80, BOARD_ROWS)));
        assert!(!legs_fit(Rect::new(0, 0, 80, BOARD_ROWS - 1)));
    }
}
