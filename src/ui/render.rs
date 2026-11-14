// ============================================
// Rendering
// ============================================

use ratatui::Frame;
use ratatui::layout::Rect;
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};

use super::board_view::{self, cell_label, cell_occupants, cell_pitch, square_to_cell};
use super::dice;
use super::sprites;
use super::theme;
use crate::game::board::LAST_SQUARE;
use crate::game::state::Game;

pub fn render(f: &mut Frame, game: &Game, last_roll: Option<u8>, ascii: bool, help: bool) {
    let area = f.area();
    let (board_area, status_area) = super::layout::split(area);
    render_board(f, board_area, game, ascii);
    render_status(f, status_area, game, last_roll, ascii);

    if help {
        render_help(f, area);
    }
    if let Some(winner) = game.winner {
        render_winner(f, area, &game.players[winner].name, winner);
    }
}

// Draws the board with one player shown at a different square, so a roll can
// be animated without mutating the real game state.
pub fn render_moving(
    f: &mut Frame,
    game: &Game,
    player: usize,
    at: u8,
    last_roll: Option<u8>,
    ascii: bool,
    help: bool,
) {
    let area = f.area();
    let (board_area, status_area) = super::layout::split(area);
    render_board_moving(f, board_area, game, player, at, ascii);
    render_status(f, status_area, game, last_roll, ascii);

    if help {
        render_help(f, area);
    }
    // A winning roll sets the winner before its animation runs, so the banner
    // has to be drawn here as well or it would appear a frame late.
    if let Some(winner) = game.winner {
        render_winner(f, area, &game.players[winner].name, winner);
    }
}

fn render_board_moving(f: &mut Frame, area: Rect, game: &Game, player: usize, at: u8, ascii: bool) {
    if area.width == 0 || area.height == 0 {
        return;
    }
    let (gutter, board_area) = reserve_gutter(area);
    let pitch = cell_pitch(board_area);
    let buf = f.buffer_mut();

    render_leg_labels(buf, gutter, board_area, &game.board);

    for square in 1..=LAST_SQUARE {
        let (rx, y) = square_to_cell(board_area, square);
        let x = board_area.x + rx;
        if x >= board_area.x + board_area.width
            || y < board_area.y
            || y >= board_area.y + board_area.height
        {
            continue;
        }

        // The moving player is shown at `at`, wherever the real state says
        // they are, so a roll can animate without mutating the game.
        let mut occupants = cell_occupants(game, square);
        occupants.retain(|&i| i != player);
        if square == at {
            occupants.push(player);
        }

        draw_cell(
            buf, board_area, pitch, square, &occupants, game, ascii, x, y,
        );
    }
}

pub fn render_board(f: &mut Frame, area: Rect, game: &Game, ascii: bool) {
    if area.width == 0 || area.height == 0 {
        return;
    }
    let (gutter, board_area) = reserve_gutter(area);
    let pitch = cell_pitch(board_area);
    let buf = f.buffer_mut();

    render_leg_labels(buf, gutter, board_area, &game.board);

    for square in 1..=LAST_SQUARE {
        let (rx, y) = square_to_cell(board_area, square);
        let x = board_area.x + rx;
        if x >= board_area.x + board_area.width
            || y < board_area.y
            || y >= board_area.y + board_area.height
        {
            continue;
        }
        let occupants = cell_occupants(game, square);
        draw_cell(
            buf, board_area, pitch, square, &occupants, game, ascii, x, y,
        );
    }
}

// Two columns down the left edge hold leg names, so a label never lands on a
// square. The board itself is drawn in the space that remains.
pub const GUTTER: u16 = 5;

fn reserve_gutter(area: Rect) -> (Rect, Rect) {
    let g = GUTTER.min(area.width.saturating_sub(1));
    let gutter = Rect {
        x: area.x,
        y: area.y,
        width: g,
        height: area.height,
    };
    let board = Rect {
        x: area.x + g,
        y: area.y,
        width: area.width.saturating_sub(g),
        height: area.height,
    };
    (gutter, board)
}

// One leg's initial per row, in the gutter beside the row that leg starts.
// Labels are dropped entirely when the board is too short to carry them.
fn render_leg_labels(
    buf: &mut ratatui::buffer::Buffer,
    gutter: Rect,
    board_area: Rect,
    board: &crate::game::board::Board,
) {
    if gutter.width == 0 || !board_view::legs_fit(board_area) {
        return;
    }
    for leg in 0..board.legs.len() {
        let first_square = (leg * (LAST_SQUARE as usize / 10)) as u8 + 1;
        let (_, y) = square_to_cell(board_area, first_square);
        if y < gutter.y || y >= gutter.y + gutter.height {
            continue;
        }
        // Leave one column of air before the board, and keep enough
        // characters that the ten legs stay distinguishable.
        let room = gutter.width.saturating_sub(1) as usize;
        let short: String = board.leg_name(first_square).chars().take(room).collect();
        buf.set_string(gutter.x, y, &short, Style::default().fg(theme::DIM));
    }
}

#[allow(clippy::too_many_arguments)]
fn draw_cell(
    buf: &mut ratatui::buffer::Buffer,
    area: Rect,
    pitch: u16,
    square: u8,
    occupants: &[usize],
    game: &Game,
    ascii: bool,
    x: u16,
    y: u16,
) {
    let label = cell_label(square, ascii);

    // A square holding players shows only the players; otherwise it shows its
    // number, or its trap or Star glyph.
    let text = if !occupants.is_empty() {
        let crowded = occupants.len() > 1;
        let mut s = String::new();
        for i in occupants {
            s.push_str(if ascii {
                sprites::ascii_token(*i, crowded)
            } else {
                sprites::token_label(*i, crowded)
            });
        }
        s
    } else if !label.is_empty() {
        label.to_string()
    } else {
        square.to_string()
    };

    let color = if !occupants.is_empty() {
        theme::player_color(game.players[occupants[0]].color_index)
    } else if square == LAST_SQUARE {
        theme::STAR
    } else if !label.is_empty() {
        match game.board.resolve(square) {
            Some(dest) if dest > square => theme::ROCKET,
            Some(_) => theme::BLACK_HOLE,
            None => theme::STAR,
        }
    } else {
        theme::DIM
    };

    let style = if !occupants.is_empty() {
        Style::default().fg(color).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(color)
    };

    let width = text.chars().count() as u16;
    let right = (area.x + area.width).saturating_sub(width);
    let centre = x + pitch.saturating_sub(width) / 2;
    let x = centre.min(right).max(x);
    buf.set_string(x, y, &text, style);
}

pub fn render_status(f: &mut Frame, area: Rect, game: &Game, last_roll: Option<u8>, ascii: bool) {
    let block = Block::default().borders(Borders::ALL);
    let inner = block.inner(area);
    f.render_widget(block, area);

    let current = game.current();
    let mut lines: Vec<Line> = Vec::new();

    if let Some(winner) = game.winner {
        lines.push(Line::from(vec![Span::styled(
            format!("{} wins!", game.players[winner].name),
            Style::default()
                .fg(theme::player_color(game.players[winner].color_index))
                .add_modifier(Modifier::BOLD),
        )]));
        lines.push(Line::from("Press n for a new game, or q to quit."));
    } else {
        lines.push(Line::from(vec![
            Span::styled(
                format!("{} ", current.name),
                Style::default()
                    .fg(theme::player_color(current.color_index))
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("— press SPACE to roll the dice"),
        ]));
    }

    let dice_text = match last_roll {
        Some(v) => format!("{} {}", dice::pip(v, ascii), v),
        None => "Press SPACE to start".to_string(),
    };
    lines.push(Line::from(dice_text));

    if let Some(last) = game.log.last() {
        lines.push(Line::from(last.clone()));
    }

    lines.push(Line::from(Span::styled(
        "q quit   n new game   ? help",
        Style::default().fg(theme::DIM),
    )));

    if inner.height > 0 && inner.width > 0 {
        f.render_widget(Paragraph::new(lines), inner);
    }
}

pub fn render_help(f: &mut Frame, area: Rect) {
    let help_area = centred(area, 52, 10);
    let text = vec![
        Line::from(Span::styled(
            "Dino Ladder",
            Style::default().add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("Fly your dino from Earth to the Star."),
        Line::from("Rockets zoom you forward. Black holes pull you back."),
        Line::from("You must land on the Star exactly."),
        Line::from(""),
        Line::from("SPACE  roll the dice (and skip the animation)"),
        Line::from("n      new game      q  quit      ?  close this"),
    ];
    let block = Block::default().borders(Borders::ALL).title(" Help ");
    f.render_widget(ratatui::widgets::Clear, help_area);
    f.render_widget(Paragraph::new(text).block(block), help_area);
}

pub fn render_winner(f: &mut Frame, area: Rect, name: &str, color_index: usize) {
    let win_area = centred(area, 44, 5);
    let text = vec![
        Line::from(""),
        Line::from(Span::styled(
            format!("  {} reached the Star!  ", name),
            Style::default()
                .fg(theme::player_color(color_index))
                .add_modifier(Modifier::BOLD),
        )),
        Line::from(""),
        Line::from("  Press n for a new game, or q to quit.  "),
    ];
    let block = Block::default().borders(Borders::ALL).title(" Winner ");
    f.render_widget(ratatui::widgets::Clear, win_area);
    f.render_widget(Paragraph::new(text).block(block), win_area);
}

fn centred(area: Rect, w: u16, h: u16) -> Rect {
    let w = w.min(area.width);
    let h = h.min(area.height);
    Rect {
        x: area.x + (area.width.saturating_sub(w)) / 2,
        y: area.y + (area.height.saturating_sub(h)) / 2,
        width: w,
        height: h,
    }
}
