// ============================================
// Theme
// ============================================

use ratatui::style::Color;

pub const PLAYER_COLORS: [Color; 6] = [
    Color::Green,
    Color::Cyan,
    Color::Yellow,
    Color::Magenta,
    Color::Red,
    Color::White,
];

pub fn player_color(i: usize) -> Color {
    PLAYER_COLORS[i % PLAYER_COLORS.len()]
}

pub const ROCKET: Color = Color::LightGreen;
pub const BLACK_HOLE: Color = Color::DarkGray;
pub const STAR: Color = Color::LightYellow;
pub const DIM: Color = Color::DarkGray;
