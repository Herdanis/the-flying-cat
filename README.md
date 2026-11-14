# Dino Ladder

A dinosaur astronaut flies from Earth to a distant Star. Rockets zoom you
forward, black holes drag you back, and you must land on the Star exactly.

Snakes and Ladders, in a space suit, in your terminal.

## Play

```bash
cargo run -- --players 3
```

| Key | What it does |
|---|---|
| `SPACE` | roll the dice (also skips the roll animation) |
| `n` | start a new game |
| `?` | show or hide the help |
| `q` | quit |

Two to six players, taking turns on one keyboard.

## Options

```bash
dino-ladder --players 4     # 2 to 6, default 2
dino-ladder --ascii         # plain characters, for terminals without Unicode or emoji
dino-ladder --help
```

Needs a terminal at least 80 columns wide and 24 rows tall. Below that it
shows a message instead of a broken board.

## How it works

The rules are pure and live in `src/game/` — no terminal code, unit tested.
The board, dice and sprites live in `src/ui/` and never decide anything about
the game. `src/app.rs` connects the two: it reads a key, asks the game for a
result, and draws what comes back.

```bash
cargo test      # rules, geometry and the render path, all headless
```
