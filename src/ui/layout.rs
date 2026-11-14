// ============================================
// Layout
// ============================================

use ratatui::layout::{Constraint, Direction, Layout, Rect};

#[allow(dead_code)]
pub const MIN_WIDTH: u16 = 80;
#[allow(dead_code)]
pub const MIN_HEIGHT: u16 = 24;
pub const STATUS_HEIGHT: u16 = 6;

pub fn is_too_small(area: Rect) -> bool {
    area.width < MIN_WIDTH || area.height < MIN_HEIGHT
}

pub fn too_small_text(area: Rect) -> String {
    format!(
        "Too small to play  ({}x{}). Please make the window at least {}x{}.",
        area.width, area.height, MIN_WIDTH, MIN_HEIGHT
    )
}

pub fn split(area: Rect) -> (Rect, Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(1), Constraint::Length(STATUS_HEIGHT)])
        .split(area);
    (chunks[0], chunks[1])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn too_small_boundaries() {
        assert!(is_too_small(Rect::new(0, 0, 79, 24)));
        assert!(is_too_small(Rect::new(0, 0, 80, 23)));
        assert!(!is_too_small(Rect::new(0, 0, 80, 24)));
        assert!(!is_too_small(Rect::new(0, 0, 200, 60)));
    }

    #[test]
    fn board_and_status_areas_fill_the_frame_without_overlap() {
        let a = Rect::new(0, 0, 100, 30);
        let (b, s) = split(a);
        assert_eq!(b.height + s.height, a.height);
        assert_eq!(b.y, 0);
        assert_eq!(s.y, b.y + b.height);
    }

    #[test]
    fn tiny_areas_do_not_panic() {
        for (w, h) in [(1, 1), (10, 5), (80, 6), (0, 0)] {
            let a = Rect::new(0, 0, w, h);
            let _ = split(a);
            let _ = too_small_text(a);
        }
    }
}
