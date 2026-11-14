// ============================================
// Render Smoke Tests
// ============================================

use ratatui::Terminal;
use ratatui::backend::TestBackend;

use super::render::{render, render_moving};
use crate::game::state::Game;

#[test]
fn renders_one_frame_without_panicking() {
    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let game = Game::new(4).unwrap();
    terminal
        .draw(|f| render(f, &game, Some(3), false, false))
        .unwrap();
}

#[test]
fn renders_at_several_sizes() {
    for (w, h) in [(80, 24), (120, 40), (200, 60), (80, 25), (137, 31)] {
        let mut terminal = Terminal::new(TestBackend::new(w, h)).unwrap();
        let game = Game::new(6).unwrap();
        terminal
            .draw(|f| render(f, &game, Some(6), false, false))
            .unwrap();
        terminal
            .draw(|f| render(f, &game, None, true, false))
            .unwrap();
    }
}

#[test]
fn renders_the_winner_screen() {
    let mut terminal = Terminal::new(TestBackend::new(100, 30)).unwrap();
    let mut game = Game::new(3).unwrap();
    game.players[1].position = 100;
    game.winner = Some(1);
    terminal
        .draw(|f| render(f, &game, Some(4), false, false))
        .unwrap();
}

#[test]
fn renders_the_help_overlay() {
    let mut terminal = Terminal::new(TestBackend::new(90, 28)).unwrap();
    let game = Game::new(2).unwrap();
    terminal
        .draw(|f| render(f, &game, None, false, true))
        .unwrap();
}

#[test]
fn renders_a_move_in_flight() {
    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let game = Game::new(2).unwrap();
    terminal
        .draw(|f| render_moving(f, &game, 0, 7, Some(4), false, false))
        .unwrap();
}

#[test]
fn crowded_squares_do_not_panic() {
    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let mut game = Game::new(6).unwrap();
    // Every dino stacked on one square, the worst case for cell drawing.
    for (i, p) in game.players.iter_mut().enumerate() {
        p.position = (i as u8 % 3) + 1;
    }
    terminal
        .draw(|f| render(f, &game, Some(2), false, false))
        .unwrap();
}

#[test]
fn ascii_mode_renders() {
    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let game = Game::new(3).unwrap();
    terminal
        .draw(|f| render(f, &game, Some(1), true, false))
        .unwrap();
}

// Prints a real frame so the board can be eyeballed. Run with:
//   cargo test dump_frame -- --ignored --nocapture
#[test]
#[ignore]
fn dump_frame() {
    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let mut game = Game::new(3).unwrap();
    game.players[0].position = 1;
    game.players[1].position = 4;
    game.players[2].position = 17;
    terminal
        .draw(|f| render(f, &game, Some(3), false, false))
        .unwrap();
    let buf = terminal.backend().buffer();
    let mut out = String::new();
    for y in 0..24 {
        for x in 0..80 {
            out.push_str(buf.cell((x, y)).map(|c| c.symbol()).unwrap_or(" "));
        }
        out.push('\n');
    }
    println!("{}", out);
}
