// ============================================
// Module Tree
// ============================================

mod app;
mod game;
mod ui;

fn main() -> std::io::Result<()> {
    app::run_default()
}
