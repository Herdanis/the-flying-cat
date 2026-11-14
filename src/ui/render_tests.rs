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

// Plays many random games through the real rules to prove the loop always
// terminates and never panics, whatever the dice do.
#[test]
fn random_games_always_finish() {
    use crate::game::rules::Dice;
    use crate::game::state::Game;

    struct Rng(u32);
    impl Dice for Rng {
        fn roll(&mut self) -> u8 {
            self.0 = self.0.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
            ((self.0 >> 16) % 6 + 1) as u8
        }
    }

    for seed in 0..200u32 {
        let mut game = Game::new((seed % 5 + 2) as usize).unwrap();
        let mut dice = Rng(seed.wrapping_mul(2_654_435_761).max(1));
        let mut turns = 0;
        while game.winner.is_none() {
            game.roll(&mut dice);
            turns += 1;
            assert!(turns < 20_000, "seed {} never finished", seed);
        }
    }
}

// The gutter holds leg names and must never be written over by a square.
#[test]
fn leg_labels_never_collide_with_the_board() {
    use ratatui::Terminal;
    use ratatui::backend::TestBackend;

    let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();
    let game = Game::new(2).unwrap();
    terminal
        .draw(|f| render(f, &game, None, false, false))
        .unwrap();

    let buf = terminal.backend().buffer();
    // Column GUTTER-1 is the spacer between a leg name and the first square,
    // so it stays blank on every row the board itself occupies.
    let spacer = super::render::GUTTER - 1;
    let (board_area, _) = crate::ui::layout::split(ratatui::layout::Rect::new(0, 0, 80, 24));
    for y in board_area.y..board_area.y + board_area.height {
        let cell = buf.cell((spacer, y)).map(|c| c.symbol()).unwrap_or(" ");
        assert_eq!(cell, " ", "gutter spacer overwritten on row {}", y);
    }
}
