// ============================================
// App Loop
// ============================================

use std::io::{self, IsTerminal, stdout};
use std::time::Duration;

use crossterm::event::{self, Event, KeyCode, KeyEventKind};
use crossterm::execute;
use crossterm::terminal::{
    EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode,
};
use ratatui::Terminal;
use ratatui::backend::CrosstermBackend;

use crate::game::rules::Dice;
use crate::game::state::Game;
use crate::ui::layout::is_too_small;
use crate::ui::render;

const FRAME_MS: u64 = 90;

pub struct StdDice;

impl StdDice {
    pub fn new() -> Self {
        StdDice
    }
}

impl Dice for StdDice {
    fn roll(&mut self) -> u8 {
        rand::random_range(1..=6)
    }
}

pub fn steps(from: u8, to: u8) -> Vec<u8> {
    match from.cmp(&to) {
        std::cmp::Ordering::Less => ((from + 1)..=to).collect(),
        std::cmp::Ordering::Greater => (to..from).rev().collect(),
        std::cmp::Ordering::Equal => Vec::new(),
    }
}

pub struct Options {
    pub players: usize,
    pub ascii: bool,
}

pub fn run_default() -> io::Result<()> {
    let opts = parse_args(std::env::args().skip(1))?;
    run(opts)
}

pub fn parse_args(args: impl Iterator<Item = String>) -> io::Result<Options> {
    let mut opts = Options {
        players: 2,
        ascii: false,
    };
    let mut it = args.peekable();
    while let Some(arg) = it.next() {
        match arg.as_str() {
            "--players" => {
                let raw = it.next().unwrap_or_default();
                let n: usize = raw.parse().map_err(|_| {
                    io::Error::new(
                        io::ErrorKind::InvalidInput,
                        format!("--players needs a number from 2 to 6, got '{}'", raw),
                    )
                })?;
                if !(2..=6).contains(&n) {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidInput,
                        format!("--players must be between 2 and 6, got {}", n),
                    ));
                }
                opts.players = n;
            }
            "--ascii" => opts.ascii = true,
            "--help" | "-h" => {
                println!(
                    "Dino Ladder — fly from Earth to the Star.\n\n\
                     Usage: dino-ladder [--players 2..6] [--ascii]\n\n\
                     SPACE  roll      n  new game      q  quit      ?  help"
                );
                std::process::exit(0);
            }
            other => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unknown option '{}' (try --help)", other),
                ));
            }
        }
    }
    Ok(opts)
}

enum Phase {
    Idle,
    Animating {
        player: usize,
        path: Vec<u8>,
        at: usize,
    },
}

pub fn run(opts: Options) -> io::Result<()> {
    let mut game =
        Game::new(opts.players).map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, e))?;

    if !io::stdin().is_terminal() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "dino-ladder needs a real terminal to play",
        ));
    }

    enable_raw_mode()?;
    let mut out = stdout();
    execute!(out, EnterAlternateScreen)?;

    let default_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let _ = disable_raw_mode();
        let _ = execute!(stdout(), LeaveAlternateScreen);
        default_hook(info);
    }));

    let backend = CrosstermBackend::new(out);
    let mut terminal = Terminal::new(backend)?;
    let mut dice = StdDice::new();
    let mut last_roll: Option<u8> = None;
    let mut help = false;
    let mut phase = Phase::Idle;

    let result = (|| -> io::Result<()> {
        loop {
            terminal.draw(|f| {
                if is_too_small(f.area()) {
                    draw_too_small(f);
                    return;
                }
                match &phase {
                    Phase::Animating { player, path, at } => render::render_moving(
                        f, &game, *player, path[*at], last_roll, opts.ascii, help,
                    ),
                    Phase::Idle => render::render(f, &game, last_roll, opts.ascii, help),
                }
            })?;

            let timeout = match phase {
                Phase::Animating { .. } => Duration::from_millis(FRAME_MS),
                Phase::Idle => Duration::from_millis(200),
            };

            if !event::poll(timeout)? {
                if let Phase::Animating { path, at, .. } = &mut phase {
                    if *at + 1 < path.len() {
                        *at += 1;
                    } else {
                        phase = Phase::Idle;
                    }
                }
                continue;
            }

            let Event::Key(key) = event::read()? else {
                continue;
            };
            if key.kind != KeyEventKind::Press {
                continue;
            }

            match key.code {
                KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
                KeyCode::Char('?') => help = !help,
                KeyCode::Char('n') => {
                    game.reset();
                    phase = Phase::Idle;
                    last_roll = None;
                }
                KeyCode::Char(' ') => match &mut phase {
                    Phase::Animating { path, at, .. } => *at = path.len().saturating_sub(1),
                    Phase::Idle if game.winner.is_none() => {
                        let player = game.turn;
                        let before = game.players[player].position.max(1);
                        let roll = dice.roll();
                        last_roll = Some(roll);
                        game.roll(&mut FixedDice(roll));
                        let after = game.players[player].position.max(1);
                        let path = if after == before {
                            vec![after]
                        } else {
                            steps(before, after)
                        };
                        phase = if path.is_empty() {
                            Phase::Idle
                        } else {
                            Phase::Animating {
                                player,
                                path,
                                at: 0,
                            }
                        };
                    }
                    _ => {}
                },
                _ => {}
            }
        }
    })();

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;
    result
}

struct FixedDice(u8);

impl Dice for FixedDice {
    fn roll(&mut self) -> u8 {
        self.0
    }
}

fn draw_too_small(f: &mut ratatui::Frame) {
    use ratatui::text::Line;
    use ratatui::widgets::Paragraph;
    let area = f.area();
    let msg = crate::ui::layout::too_small_text(area);
    let para = Paragraph::new(vec![
        Line::from(msg),
        Line::from(""),
        Line::from("Press q to quit."),
    ]);
    let pos = ratatui::layout::Rect {
        x: 0,
        y: area.height / 2,
        width: area.width,
        height: area.height.saturating_sub(area.height / 2),
    };
    f.render_widget(para, pos);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn steps_walk_forward_one_square_at_a_time() {
        assert_eq!(steps(3, 7), vec![4, 5, 6, 7]);
        assert_eq!(steps(1, 1), Vec::<u8>::new());
    }

    #[test]
    fn steps_walk_backward_for_a_black_hole() {
        assert_eq!(steps(40, 37), vec![39, 38, 37]);
    }

    #[test]
    fn flags_parse_players_and_ascii() {
        let o = parse_args(["--players", "4", "--ascii"].into_iter().map(String::from)).unwrap();
        assert_eq!(o.players, 4);
        assert!(o.ascii);
    }

    #[test]
    fn flags_reject_bad_player_counts() {
        for bad in ["1", "7", "0", "abc"] {
            let r = parse_args(["--players", bad].into_iter().map(String::from));
            assert!(r.is_err(), "{} should be rejected", bad);
        }
    }

    #[test]
    fn flags_reject_unknown_options() {
        let r = parse_args(["--nope"].into_iter().map(String::from));
        assert!(r.is_err());
    }
}
